const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts';
const ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const REQUEST_PATTERN = /^[A-Za-z0-9-]{8,80}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return url;
  }
  const local =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (url.protocol !== 'https:' && !local) {
    throw new Error('Return URL must be https');
  }
  return url;
}

function withOrderAccess(value, orderId, token) {
  const url = assertReturnUrl(value);
  url.searchParams.set('orderId', orderId);
  url.searchParams.set('token', token);
  return url.toString();
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function orderRef() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Johannesburg',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `LC-${parts.year}${parts.month}${parts.day}-${suffix}`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function yocoCheckout(secret, order, urls, idempotencyKey) {
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
    metadata: {
      orderId: order.id,
      orderRef: order.order_ref,
      customerName: order.customer_name,
      customerEmail: order.email ?? '',
    },
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

  let response = await send(payload, idempotencyKey);
  if (!response.ok && lineItems.length > 0) {
    const { lineItems: _lines, ...withoutLines } = payload;
    response = await send(withoutLines, `${idempotencyKey}-plain`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.redirectUrl) {
    const message = body.message || body.error || '';
    throw new Error(
      typeof message === 'string' && message.length > 0 && message.length < 180
        ? message
        : 'Yoco could not start the payment.',
    );
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
    return json({ error: 'Payment is not available right now.' }, 500);
  }
  if (!yocoSecret.startsWith('sk_test_') && !yocoSecret.startsWith('sk_live_')) {
    return json({ error: 'Payment is not available right now.' }, 500);
  }

  const serviceHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
  };

  async function rest(path, init = {}) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: { ...serviceHeaders, ...(init.headers ?? {}) },
    });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text.slice(0, 300) };
      }
    }
    return { ok: response.ok, status: response.status, body };
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  let customerId = null;
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (userResponse.ok) {
      const user = await userResponse.json();
      if (user?.id && isUuid(String(user.id))) customerId = String(user.id);
    }
  }

  let input;
  try {
    input = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const customerName = String(input.customerName ?? '').trim();
  const phone = String(input.phone ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const popId = String(input.popId ?? '').trim();
  const clientRequestId = String(input.clientRequestId ?? '').trim();
  const notes = String(input.notes ?? '').trim().slice(0, 500);

  if (customerName.length < 2 || customerName.length > 120) {
    return json({ error: 'Enter your name.' }, 400);
  }
  if (phone.length < 6 || phone.length > 40) {
    return json({ error: 'Enter your mobile number.' }, 400);
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return json({ error: 'Enter an email address for the receipt.' }, 400);
  }
  if (!ID_PATTERN.test(popId)) {
    return json({ error: 'Choose a pickup point.' }, 400);
  }
  if (!REQUEST_PATTERN.test(clientRequestId)) {
    return json({ error: 'Checkout could not be started. Please try again.' }, 400);
  }
  if (input.packCheck !== true) {
    return json({ error: 'Confirm that you have checked this order.' }, 400);
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 30) {
    return json({ error: 'Your cart is empty.' }, 400);
  }

  const quantities = new Map();
  for (const line of input.lines) {
    const productId = String(line?.productId ?? '');
    const quantity = Number(line?.quantity);
    if (!ID_PATTERN.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 40) {
      return json({ error: 'Check the items in your cart.' }, 400);
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > 40) return json({ error: 'Check the items in your cart.' }, 400);
  }

  let successUrl;
  let cancelUrl;
  let failureUrl;
  try {
    assertReturnUrl(String(input.successUrl ?? ''));
    assertReturnUrl(String(input.cancelUrl ?? ''));
    assertReturnUrl(String(input.failureUrl ?? ''));
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Bad return URL' },
      400,
    );
  }

  const popResult = await rest(
    `pops?id=eq.${encodeURIComponent(popId)}&status=eq.active&select=id`,
  );
  if (!popResult.ok) return json({ error: 'Could not load the pickup point.' }, 502);
  if (!Array.isArray(popResult.body) || !popResult.body[0]) {
    return json({ error: 'Choose a pickup point.' }, 400);
  }

  const productIds = [...quantities.keys()].join(',');
  const productResult = await rest(
    `products?id=in.(${productIds})&select=id,name,price_cents,stock_qty`,
  );
  if (!productResult.ok) return json({ error: 'Could not load the catalogue.' }, 502);
  const products = new Map(
    (Array.isArray(productResult.body) ? productResult.body : []).map((row) => [row.id, row]),
  );

  const priced = [];
  for (const [productId, quantity] of quantities) {
    const product = products.get(productId);
    if (!product) return json({ error: 'One of those products is no longer listed.' }, 409);
    if (product.stock_qty < quantity) {
      return json({ error: `${product.name} does not have enough packs.` }, 409);
    }
    priced.push({
      product_id: productId,
      product_name: product.name,
      quantity,
      unit_price_cents: product.price_cents,
    });
  }
  const totalCents = priced.reduce(
    (sum, line) => sum + line.unit_price_cents * line.quantity,
    0,
  );
  if (totalCents < 200) {
    return json({ error: 'Yoco does not take payments under R2.00.' }, 400);
  }

  const existingResult = await rest(
    `orders?client_request_id=eq.${encodeURIComponent(clientRequestId)}&select=id,order_ref,status,total_cents,customer_name,email,yoco_checkout_id,yoco_redirect_url`,
  );
  if (!existingResult.ok) return json({ error: 'Could not start checkout.' }, 502);
  let order = Array.isArray(existingResult.body) ? existingResult.body[0] : null;

  if (order && order.status !== 'pending_payment') {
    return json({ error: 'This checkout has already been used.' }, 409);
  }
  if (order?.yoco_redirect_url) {
    return json({
      redirectUrl: order.yoco_redirect_url,
      checkoutId: order.yoco_checkout_id,
      orderId: order.id,
      guestToken: null,
    });
  }

  const guestToken = randomHex(32);
  const guestTokenHash = await sha256Hex(guestToken);
  const now = new Date().toISOString();
  let createdFresh = false;

  if (!order) {
    const created = await rest('orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: `ord-${randomHex(8)}`,
        order_ref: orderRef(),
        customer_id: customerId,
        customer_name: customerName,
        phone,
        email,
        notes: notes || null,
        status: 'pending_payment',
        fulfilment_status: 'placed',
        fulfilment: 'pop_collect',
        pop_id: popId,
        total_cents: totalCents,
        payment_method: 'yoco',
        payment_status: 'pending',
        amount_estimated_cents: totalCents,
        pack_check_accepted_at: now,
        assigned_at: now,
        guest_token_hash: guestTokenHash,
        client_request_id: clientRequestId,
      }),
    });
    if (created.status === 409) {
      const again = await rest(
        `orders?client_request_id=eq.${encodeURIComponent(clientRequestId)}&select=id,order_ref,status,total_cents,customer_name,email,yoco_checkout_id,yoco_redirect_url`,
      );
      order = Array.isArray(again.body) ? again.body[0] : null;
      if (order?.yoco_redirect_url && order.status === 'pending_payment') {
        return json({
          redirectUrl: order.yoco_redirect_url,
          checkoutId: order.yoco_checkout_id,
          orderId: order.id,
          guestToken: null,
        });
      }
    } else if (!created.ok || !Array.isArray(created.body) || !created.body[0]) {
      return json({ error: 'Could not save the order.' }, 502);
    } else {
      order = created.body[0];
      createdFresh = true;
    }
  }
  if (!order || order.status !== 'pending_payment') {
    return json({ error: 'Could not save the order.' }, 502);
  }

  if (!createdFresh) {
    const patched = await rest(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        guest_token_hash: guestTokenHash,
        customer_name: customerName,
        phone,
        email,
        notes: notes || null,
        customer_id: customerId,
        pop_id: popId,
        total_cents: totalCents,
        amount_estimated_cents: totalCents,
        updated_at: now,
      }),
    });
    if (!patched.ok) return json({ error: 'Could not update the order.' }, 502);
    await rest(`order_items?order_id=eq.${encodeURIComponent(order.id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });
  }

  const items = await rest('order_items', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(
      priced.map((line) => ({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
      })),
    ),
  });
  if (!items.ok && !(createdFresh && items.status === 409)) {
    return json({ error: 'Could not save the order lines.' }, 502);
  }

  if (createdFresh) {
    await rest('order_status_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: `ev-${randomHex(8)}`,
        order_id: order.id,
        from_status: null,
        to_status: 'placed',
        store_status: 'pending_payment',
        actor_role: customerId ? 'customer' : 'guest',
        note: 'Order placed',
      }),
    });
  }

  try {
    successUrl = withOrderAccess(String(input.successUrl), order.id, guestToken);
    cancelUrl = withOrderAccess(String(input.cancelUrl), order.id, guestToken);
    failureUrl = withOrderAccess(String(input.failureUrl), order.id, guestToken);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Bad return URL' },
      400,
    );
  }

  let checkout;
  try {
    checkout = await yocoCheckout(
      yocoSecret,
      {
        id: order.id,
        order_ref: order.order_ref,
        total_cents: totalCents,
        customer_name: customerName,
        email,
        order_items: priced,
      },
      { successUrl, cancelUrl, failureUrl },
      `${order.id}-${guestToken.slice(0, 12)}`,
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Yoco could not start the payment.' },
      502,
    );
  }

  const saved = await rest(`orders?id=eq.${encodeURIComponent(order.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      yoco_checkout_id: checkout.id,
      yoco_redirect_url: checkout.redirectUrl,
      payment_method: 'yoco',
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    }),
  });
  if (!saved.ok) {
    return json({ error: 'Checkout was created but the order could not be updated.' }, 502);
  }

  return json({
    redirectUrl: checkout.redirectUrl,
    checkoutId: checkout.id,
    orderId: order.id,
    guestToken,
  });
});
