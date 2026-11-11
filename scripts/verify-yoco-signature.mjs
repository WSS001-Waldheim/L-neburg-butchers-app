/**
 * Self-check for the Yoco Standard Webhooks verifier.
 * Run: node scripts/verify-yoco-signature.mjs
 */
import { verifyYocoWebhookSignature } from '../supabase/functions/_shared/yocoSignature.js';

const secretBytes = new Uint8Array(24);
crypto.getRandomValues(secretBytes);
let binary = '';
for (const byte of secretBytes) binary += String.fromCharCode(byte);
const secret = `whsec_${btoa(binary)}`;
const rawBody = JSON.stringify({
  id: 'evt_test',
  type: 'payment.succeeded',
  payload: { amount: 38900 },
});
const webhookId = 'msg_test';
const webhookTimestamp = String(Math.floor(Date.now() / 1000));

const key = await crypto.subtle.importKey(
  'raw',
  secretBytes,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign'],
);
const mac = new Uint8Array(
  await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${webhookId}.${webhookTimestamp}.${rawBody}`),
  ),
);
let macBinary = '';
for (const byte of mac) macBinary += String.fromCharCode(byte);
const signature = `v1,${btoa(macBinary)}`;

const ok = await verifyYocoWebhookSignature({
  secret,
  rawBody,
  webhookId,
  webhookTimestamp,
  webhookSignature: signature,
});
if (!ok.ok) {
  console.error('expected a valid signature', ok);
  process.exit(1);
}

const tampered = await verifyYocoWebhookSignature({
  secret,
  rawBody: `${rawBody} `,
  webhookId,
  webhookTimestamp,
  webhookSignature: signature,
});
if (tampered.ok) {
  console.error('tampered body was accepted');
  process.exit(1);
}

const expired = await verifyYocoWebhookSignature({
  secret,
  rawBody,
  webhookId,
  webhookTimestamp: '100',
  webhookSignature: signature,
  nowSeconds: 10_000,
});
if (expired.ok || expired.reason !== 'expired') {
  console.error('old timestamp was accepted', expired);
  process.exit(1);
}

console.log('yoco signature verifier ok');
