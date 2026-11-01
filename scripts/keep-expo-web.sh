#!/usr/bin/env bash
# Keep Expo web listening on :8081. Restart if the port dies.
set -u
cd /agent/luneburg-butchery || exit 1
PORT=8081
LOG=/tmp/luneburg-expo-web.log

while true; do
  if curl -sf -o /dev/null --connect-timeout 2 "http://127.0.0.1:${PORT}/"; then
    sleep 15
    continue
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Expo :${PORT} down — restarting" | tee -a "$LOG"
  # Kill any stale expo/metro on this port
  pkill -f "expo start --web --port ${PORT}" 2>/dev/null || true
  sleep 2
  npx expo start --web --port "$PORT" >>"$LOG" 2>&1 &
  # Wait until healthy or timeout
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null --connect-timeout 2 "http://127.0.0.1:${PORT}/"; then
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Expo :${PORT} healthy" | tee -a "$LOG"
      break
    fi
    sleep 2
  done
  sleep 10
done
