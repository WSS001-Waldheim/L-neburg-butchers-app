const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function assertReturnUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Return URL is not valid');
  }
  const allow = Deno.env.get('ALLOWED_RETURN_ORIGINS');
  if (allow?.trim()) {
    const origins = allow.split(',').map((item) => item.trim());
    if (!origins.includes(url.origin)) {
      throw new Error('Return URL origin is not allowed');
    }
    return url.toString();
  }
  const local =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (url.protocol !== 'https:' && !local) {
    throw new Error('Return URL must be https');
  }
  return url.toString();
}

async function yocoCheckout(secret, order, urls) {
  const lineItems = (order.order_items ?? []).map((line) => ({
    displayName: line.product_name,
    quantity: line.quantity,
    pricingDetails: { price: line.unit_price_cents },
  }));
  const payload = {
    amount: order.total_cents,
    currency: 'ZAR',
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
    failureUrl: urls.failureUrl,
    metadata: { orderId: order.id, orderRef: order.order_ref },
    lineItems,
  };

  const send = (body, idempotencyKey) =>
    fetch(YOCO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });

  let response = await send(payload, order.id);
  if (!response.ok && lineItems.length > 0) {
    const { lineItems: _lines, ...withoutLines } = payload;
    response = await send(withoutLines, `${order.id}-plain`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.redirectUrl) {
    const message =
      body.message || body.error || `Yoco checkout failed (${response.status})`;
    throw new Error(message);
  }
  return { id: body.id, redirectUrl: body.redirectUrl };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const yocoSecret = Deno.env.get('YOCO_SECRET_KEY') ?? '';
  if (!supabaseUrl || !serviceKey || !anonKey || !yocoSecret) {
    return json({ error: 'Checkout is not configured' }, 500);
  }
  if (!yocoSecret.startsWith('sk_test_') && !yocoSecret.startsWith('sk_live_')) {
    return json({ error: 'YOCO_SECRET_KEY must be an sk_test_ or sk_live_ key' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Sign in before paying' }, 401);
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: anonKey },
  });
  if (!userResponse.ok) return json({ error: 'Sign in before paying' }, 401);
  const user = await userResponse.json();
  const userId = user?.id;
  if (!userId) return json({ error: 'Sign in before paying' }, 401);

  let input;
  try {
    input = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const orderId = String(input.orderId ?? '');
  if (!orderId) return json({ error: 'orderId is required' }, 400);

  let successUrl;
  let cancelUrl;
  let failureUrl;
  try {
    successUrl = assertReturnUrl(String(input.successUrl ?? ''));
    cancelUrl = assertReturnUrl(String(input.cancelUrl ?? ''));
    failureUrl = assertReturnUrl(String(input.failureUrl ?? ''));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Bad return URL' }, 400);
  }

  const serviceHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
  };

  const orderResponse = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*,order_items(*)`,
    { headers: serviceHeaders },
  );
  if (!orderResponse.ok) return json({ error: 'Could not load the order' }, 502);
  const rows = await orderResponse.json();
  const order = Array.isArray(rows) ? rows[0] : null;
  if (!order) return json({ error: 'Order not found' }, 404);

  if (order.customer_id !== userId) {
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      { headers: serviceHeaders },
    );
    const profiles = profileResponse.ok ? await profileResponse.json() : [];
    if (profiles?.[0]?.role !== 'admin') {
      return json({ error: 'This order belongs to another customer' }, 403);
    }
  }

  if (order.status !== 'pending_payment') {
    return json({ error: 'This order is not awaiting payment' }, 409);
  }
  if (order.total_cents < 200) {
    return json({ error: 'Yoco does not take payments under R2.00' }, 400);
  }
  if (order.yoco_checkout_id && order.yoco_redirect_url) {
    return json({
      redirectUrl: order.yoco_redirect_url,
      checkoutId: order.yoco_checkout_id,
    });
  }

  for (const line of order.order_items ?? []) {
    const productResponse = await fetch(
      `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(line.product_id)}&select=stock_qty,name`,
      { headers: serviceHeaders },
    );
    const products = productResponse.ok ? await productResponse.json() : [];
    const product = products?.[0];
    if (!product || product.stock_qty < line.quantity) {
      return json(
        { error: `${line.product_name} does not have enough packs.` },
        409,
      );
    }
  }

  let checkout;
  try {
    checkout = await yocoCheckout(yocoSecret, order, {
      successUrl,
      cancelUrl,
      failureUrl,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Yoco checkout failed' },
      502,
    );
  }

  const patch = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: 'PATCH',
      headers: { ...serviceHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        yoco_checkout_id: checkout.id,
        yoco_redirect_url: checkout.redirectUrl,
        payment_method: 'yoco',
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!patch.ok) {
    return json({ error: 'Checkout was created but the order could not be updated' }, 502);
  }

  return json({ redirectUrl: checkout.redirectUrl, checkoutId: checkout.id });
});
