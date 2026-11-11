/**
 * Yoco Checkout webhook signatures (Standard Webhooks v1).
 * https://developer.yoco.com/online/api-reference/webhooks/
 *
 * signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * HMAC-SHA256 key = base64-decode(secret without the whsec_ prefix)
 * webhook-signature = one or more space-separated `v1,<base64 mac>` tokens
 */

function decodeBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const length = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;
  for (let i = 0; i < length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyYocoWebhookSignature(input) {
  const secret = input.secret ?? '';
  if (!secret.startsWith('whsec_')) return { ok: false, reason: 'secret' };

  const webhookId = input.webhookId ?? '';
  const webhookTimestamp = input.webhookTimestamp ?? '';
  const webhookSignature = input.webhookSignature ?? '';
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { ok: false, reason: 'headers' };
  }

  const timestamp = Number(webhookTimestamp);
  if (!Number.isFinite(timestamp)) return { ok: false, reason: 'timestamp' };
  const nowSeconds = input.nowSeconds ?? Date.now() / 1000;
  const toleranceSeconds = input.toleranceSeconds ?? 180;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    return { ok: false, reason: 'expired' };
  }

  let keyBytes;
  try {
    keyBytes = decodeBase64(secret.slice('whsec_'.length));
  } catch {
    return { ok: false, reason: 'secret' };
  }
  if (keyBytes.length === 0) return { ok: false, reason: 'secret' };

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = new TextEncoder().encode(
    `${webhookId}.${webhookTimestamp}.${input.rawBody ?? ''}`,
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
  const expected = encodeBase64(mac);
  const match = webhookSignature.split(' ').some((part) => {
    const comma = part.indexOf(',');
    if (comma <= 0) return false;
    const version = part.slice(0, comma);
    const value = part.slice(comma + 1);
    return version === 'v1' && timingSafeEqual(value, expected);
  });
  return match ? { ok: true } : { ok: false, reason: 'signature' };
}
