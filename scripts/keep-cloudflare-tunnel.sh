#!/usr/bin/env bash
# Auto-restart Cloudflare quick tunnel; write latest HTTPS URL for Karl's phone.
# Quick tunnels expire (Unauthorized: Tunnel not found) even while cloudflared keeps retrying —
# we detect that / dead process / bad public probe and spawn a fresh tunnel (new URL each time).
set -u

CF=/tmp/cloudflared
URL_FILE=/cursor/stores/self/internal/pilot-public-url.txt
LOG=/tmp/cloudflared-tunnel.log
PORT=8081

if [ ! -x "$CF" ]; then
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "$CF"
  chmod +x "$CF"
fi

write_url_file() {
  local url="$1"
  mkdir -p "$(dirname "$URL_FILE")"
  cat >"$URL_FILE" <<EOF
${url}

Tunnel: Cloudflare quick tunnel → http://127.0.0.1:${PORT}
Auto-restart: yes (keep-cloudflare-tunnel.sh)
tmux: luneburg-cf-watch
Log: ${LOG}
Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ) UTC

Why it drops: *.trycloudflare.com quick tunnels expire / lose auth when Cloudflare
closes the ephemeral tunnel (or the process/VM idles). Expo on :${PORT} often stays
up; only the public URL dies. Each restart gets a new URL — read this file for latest.
EOF
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) wrote ${url}" | tee -a /tmp/luneburg-tunnel-watch.log
}

start_tunnel() {
  pkill -f 'cloudflared tunnel --url' 2>/dev/null || true
  sleep 1
  : >"$LOG"
  "$CF" tunnel --url "http://127.0.0.1:${PORT}" >>"$LOG" 2>&1 &
  echo $! >/tmp/cloudflared.pid
  # Wait for trycloudflare URL
  local url=""
  for _ in $(seq 1 45); do
    url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1 || true)
    if [ -n "$url" ]; then
      write_url_file "$url"
      echo "$url"
      return 0
    fi
    sleep 1
  done
  echo ""
  return 1
}

tunnel_is_dead() {
  # Process gone
  if ! pgrep -f 'cloudflared tunnel --url' >/dev/null 2>&1; then
    return 0
  fi
  # Cloudflare revoked the quick tunnel but process still retries
  if tail -n 40 "$LOG" 2>/dev/null | grep -q 'Unauthorized: Tunnel not found'; then
    return 0
  fi
  if tail -n 20 "$LOG" 2>/dev/null | grep -q 'datagram manager error: timeout'; then
    # Give it a moment; if Unauthorized follows we're dead — checked next loop
    return 1
  fi
  return 1
}

public_url_ok() {
  local url host ip
  url=$(head -1 "$URL_FILE" 2>/dev/null | tr -d '\r')
  [[ "$url" == https://*.trycloudflare.com ]] || [[ "$url" == https://*trycloudflare.com ]] || return 1
  host=${url#https://}
  host=${host%%/*}
  ip=$(dig @1.1.1.1 +short "$host" 2>/dev/null | grep -E '^[0-9.]+$' | head -1)
  [ -n "$ip" ] || return 1
  code=$(curl -sL -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 25 \
    --resolve "${host}:443:${ip}" "$url/" || echo 000)
  [ "$code" = "200" ]
}

# Boot: reuse healthy tunnel/URL if already working (avoid thrashing share links)
if pgrep -f 'cloudflared tunnel --url' >/dev/null && public_url_ok; then
  CURRENT=$(head -1 "$URL_FILE" 2>/dev/null || true)
  echo "initial=reuse $CURRENT"
else
  CURRENT=$(start_tunnel)
  echo "initial=$CURRENT"
fi

while true; do
  sleep 30
  # Ensure Expo is answering before bothering with tunnel health
  if ! curl -sf -o /dev/null --connect-timeout 2 "http://127.0.0.1:${PORT}/"; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Expo down — waiting" | tee -a /tmp/luneburg-tunnel-watch.log
    continue
  fi
  if tunnel_is_dead || ! public_url_ok; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) tunnel unhealthy — restarting" | tee -a /tmp/luneburg-tunnel-watch.log
    CURRENT=$(start_tunnel)
    echo "restarted=$CURRENT"
  fi
done
