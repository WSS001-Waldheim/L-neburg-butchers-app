-- Guest checkout for the hosted shop.
-- Run this file once in the Supabase SQL editor (or `npx supabase db push`).
-- Do not re-paste supabase/setup.sql on a database that already has the tables.
--
-- Guests do not get select on public.orders. Confirmation is
-- order_by_guest_token(token), which returns one order when the SHA-256 of
-- the token matches. The raw token is not stored.
-- The Yoco webhook still marks these orders paid through mark_order_paid
-- (service role). customer_id may be null.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists guest_token_hash text,
  add column if not exists client_request_id text;

create unique index if not exists orders_guest_token_hash_idx
  on public.orders (guest_token_hash)
  where guest_token_hash is not null;

create unique index if not exists orders_client_request_idx
  on public.orders (client_request_id)
  where client_request_id is not null;

create or replace function public.order_by_guest_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  hashed text;
  rec public.orders%rowtype;
  items jsonb;
  events jsonb;
  pop_name text;
  pop_address text;
  pop_city text;
begin
  if p_token is null or length(btrim(p_token)) < 32 then
    return null;
  end if;

  hashed := encode(digest(convert_to(btrim(p_token), 'UTF8'), 'sha256'), 'hex');
  select * into rec from public.orders where guest_token_hash = hashed;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'productId', product_id,
    'productName', product_name,
    'quantity', quantity,
    'unitPriceCents', unit_price_cents
  ) order by product_name), '[]'::jsonb)
  into items
  from public.order_items
  where order_id = rec.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'fromStatus', from_status,
    'toStatus', to_status,
    'storeStatus', store_status,
    'createdAt', created_at,
    'actorRole', actor_role,
    'note', note,
    'collectionCode', collection_code
  ) order by created_at), '[]'::jsonb)
  into events
  from public.order_status_events
  where order_id = rec.id;

  select name, address_line1, city
  into pop_name, pop_address, pop_city
  from public.pops
  where id = rec.pop_id;

  return jsonb_build_object(
    'id', rec.id,
    'orderRef', rec.order_ref,
    'createdAt', rec.created_at,
    'customerName', rec.customer_name,
    'phone', rec.phone,
    'email', rec.email,
    'notes', rec.notes,
    'status', rec.status,
    'fulfilmentStatus', rec.fulfilment_status,
    'paymentStatus', rec.payment_status,
    'fulfilment', rec.fulfilment,
    'popId', rec.pop_id,
    'popName', pop_name,
    'popAddress', pop_address,
    'popCity', pop_city,
    'totalCents', rec.total_cents,
    'collectionCode', rec.collection_code,
    'packCheckAcceptedAt', rec.pack_check_accepted_at,
    'lines', items,
    'events', events
  );
end;
$$;

revoke all on function public.order_by_guest_token(text) from public, anon, authenticated;
grant execute on function public.order_by_guest_token(text) to anon, authenticated;

-- Catalogue fixes already shipped in the app, applied here for the hosted rows.
update public.carcass_batches
set
  raised_at = replace(raised_at, 'Ouderdam', 'Ouderdom'),
  story = replace(story, 'Ouderdam', 'Ouderdom')
where raised_at like '%Ouderdam%' or story like '%Ouderdam%';

delete from public.products where id = 'sausage-buddhawurst';

update public.pops
set collection_instructions =
  'Bring your collection code and ID. Your order is packed in a box and waiting for you — collect whenever suits you. Keep the packs cold. Site formerly Foggerful Megaworld.'
where id = 'ultimate-outdoor-piet-retief';

update public.pops
set collection_instructions =
  'Bring your collection code and ID. Your order is packed in a box and waiting for you — collect whenever suits you. Keep the packs cold.'
where collection_instructions ilike '%collect promptly%';
