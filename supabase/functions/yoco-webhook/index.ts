import { verifyYocoWebhookSignature } from '../_shared/yocoSignature.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function header(req, name) {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase()) ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const secret = Deno.env.get('YOCO_WEBHOOK_SECRET') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!secret || !supabaseUrl || !serviceKey) {
    return json({ error: 'Webhook is not configured' }, 500);
  }

  const rawBody = await req.text();
  const verified = await verifyYocoWebhookSignature({
    secret,
    rawBody,
    webhookId: header(req, 'webhook-id'),
    webhookTimestamp: header(req, 'webhook-timestamp'),
    webhookSignature: header(req, 'webhook-signature'),
  });
  if (!verified.ok) return json({ error: 'Invalid signature' }, 401);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const type = String(event.type ?? event.event_type ?? '');
  const payload = event.payload ?? {};
  const metadata = payload.metadata ?? {};
  const orderId = String(metadata.orderId ?? metadata.order_id ?? '');
  const checkoutId = String(metadata.checkoutId ?? metadata.checkout_id ?? '');
  const paymentId = String(payload.id ?? '');
  const amount = Number(payload.amount);

  if (type !== 'payment.succeeded' && type !== 'payment.failed') {
    return json({ ignored: true, type });
  }
  if (!orderId && !checkoutId) return json({ error: 'Missing order id' }, 400);

  const rpc = type === 'payment.succeeded' ? 'mark_order_paid' : 'mark_order_payment_failed';
  const rpcBody =
    type === 'payment.succeeded'
      ? {
          p_order_id: orderId,
          p_payment_id: paymentId,
          p_checkout_id: checkoutId || null,
          p_amount_cents: amount,
        }
      : { p_order_id: orderId, p_payment_id: paymentId };

  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rpcBody),
  });
  const text = await result.text();
  if (!result.ok) {
    return json({ error: 'Could not update the order', detail: text.slice(0, 300) }, 409);
  }

  const eventId = String(event.id ?? header(req, 'webhook-id'));
  if (eventId) {
    await fetch(`${supabaseUrl}/rest/v1/yoco_webhook_events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        id: eventId,
        event_type: type,
        order_id: orderId || null,
      }),
    });
  }

  return json({ ok: true, result: text ? JSON.parse(text) : null });
});
