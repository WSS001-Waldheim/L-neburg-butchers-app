-- Lüneburg web store: catalogue, pickup points, orders, profiles.
-- Customers see their own orders. A POP sees only orders assigned to them.
-- Admins see everything. New pickup points stay hidden until an admin
-- approves them and then activates them (status = active).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users). role is customer | pop | admin.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'pop', 'admin')),
  full_name text not null default '',
  phone text not null default '',
  email text,
  pop_id text,
  created_at timestamptz not null default now(),
  constraint profiles_pop_role_has_pop check (role <> 'pop' or pop_id is not null)
);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_pop_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select pop_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.current_profile_pop_id() from public;
grant execute on function public.current_profile_role() to anon, authenticated, service_role;
grant execute on function public.current_profile_pop_id() to anon, authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    case
      when lower(new.email) = 'karl@wssfarming.co.za' then 'admin'
      else 'customer'
    end,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'customer'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case
      when lower(excluded.email) = 'karl@wssfarming.co.za' then 'admin'
      else public.profiles.role
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if public.current_profile_role() is distinct from 'admin' then
    if new.role is distinct from old.role or new.pop_id is distinct from old.pop_id then
      raise exception 'Only an admin can change role or pickup assignment';
    end if;
  end if;
  if new.role = 'pop' and new.pop_id is null then
    raise exception 'A pickup account needs a pickup point';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.carcass_batches (
  id text primary key,
  ear_tag text not null,
  carcass_number text not null,
  qr_code text not null,
  breed text not null,
  born_at date,
  raised_at text,
  finished_at date,
  processed_at date,
  story text not null,
  butchers_note text not null
);

create table public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('premium-vsp', 'braai-boxes', 'sausages')),
  description text not null,
  price_cents integer not null check (price_cents >= 0),
  pack_size text not null,
  weight_grams integer,
  cut_notes text,
  image_hint text not null default 'cut',
  photo_url text,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  next_arrival_date timestamptz,
  carcass_batch_id text references public.carcass_batches (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pickup points. status: pending → approved → active.
-- Only active is shown to customers.
-- ---------------------------------------------------------------------------

create table public.pops (
  id text primary key,
  code text not null unique,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'active')),
  area_label text not null,
  phase text not null check (phase in ('P1', 'P2', 'P3')),
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text not null,
  postal_code text,
  lat double precision,
  lng double precision,
  hours jsonb not null default '{}'::jsonb,
  collection_instructions text not null,
  contact_phone text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_pop_id_fkey
  foreign key (pop_id) references public.pops (id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id text primary key,
  order_ref text not null unique,
  created_at timestamptz not null default now(),
  customer_id uuid references public.profiles (id),
  customer_name text not null,
  phone text not null,
  email text,
  notes text,
  status text not null check (status in (
    'pending_payment', 'paid', 'confirmed', 'left_butchery', 'at_pop', 'collected', 'cancelled'
  )),
  fulfilment_status text not null,
  fulfilment text not null,
  pop_id text references public.pops (id),
  total_cents integer not null check (total_cents >= 0),
  payment_method text,
  payment_status text not null default 'none',
  amount_estimated_cents integer not null check (amount_estimated_cents >= 0),
  amount_final_cents integer,
  payment_session_id text,
  payment_provider_reference text,
  paid_at timestamptz,
  yoco_checkout_id text,
  yoco_redirect_url text,
  collection_code text,
  collection_code_expires_at timestamptz,
  assigned_at timestamptz,
  dispatched_at timestamptz,
  ready_at timestamptz,
  collected_at timestamptz,
  collected_by uuid,
  collector_note text,
  pack_check_accepted_at timestamptz not null,
  cold_chain_clock_started_at timestamptz,
  pickup_location text,
  updated_at timestamptz not null default now()
);

create table public.order_items (
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  primary key (order_id, product_id)
);

create table public.order_status_events (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  store_status text,
  created_at timestamptz not null default now(),
  actor_role text,
  note text,
  collection_code text
);

create table public.yoco_webhook_events (
  id text primary key,
  event_type text not null,
  order_id text,
  received_at timestamptz not null default now()
);

create index orders_customer_idx on public.orders (customer_id);
create index orders_pop_idx on public.orders (pop_id);
create index orders_status_idx on public.orders (status);
create index orders_yoco_checkout_idx on public.orders (yoco_checkout_id);

create table public.pop_applications (
  id text primary key,
  status text not null check (status in (
    'draft', 'submitted', 'pending_review', 'approved', 'rejected', 'withdrawn'
  )),
  business_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text not null,
  postal_code text,
  lat double precision,
  lng double precision,
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  notes text,
  proposed_hours_note text,
  applicant_user_id uuid references public.profiles (id),
  linked_pop_id text references public.pops (id),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Guards. Customers cannot mark themselves paid. The webhook uses service_role.
-- ---------------------------------------------------------------------------

create or replace function public.orders_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if public.current_profile_role() = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.current_profile_role() is distinct from 'customer' then
      raise exception 'Only a customer can place an order';
    end if;
    if new.customer_id is distinct from auth.uid() then
      raise exception 'customer_id must be the signed-in user';
    end if;
    if new.status <> 'pending_payment' then
      raise exception 'New orders start as pending payment';
    end if;
    if new.payment_status not in ('none', 'pending') then
      raise exception 'Payment status is set by Yoco or an admin';
    end if;
    return new;
  end if;

  if public.current_profile_role() = 'customer'
     and old.customer_id = auth.uid()
     and old.status = 'pending_payment' then
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Only payment confirmation can move an unpaid order';
    end if;
    if new.total_cents is distinct from old.total_cents
       or new.payment_status is distinct from old.payment_status
       or new.customer_id is distinct from old.customer_id
       or new.pop_id is distinct from old.pop_id then
      raise exception 'Order totals and payment status cannot be changed by the customer';
    end if;
    return new;
  end if;

  if public.current_profile_role() = 'pop'
     and old.pop_id is not distinct from public.current_profile_pop_id()
     and old.status = 'at_pop'
     and new.status = 'collected'
     and new.collection_code is not distinct from old.collection_code
     and new.total_cents = old.total_cents
     and new.customer_id is not distinct from old.customer_id
     and new.pop_id is not distinct from old.pop_id then
    return new;
  end if;

  raise exception 'Not allowed to update this order';
end;
$$;

create trigger orders_guard_trigger
  before insert or update on public.orders
  for each row execute function public.orders_guard();

create or replace function public.mark_order_paid(
  p_order_id text,
  p_payment_id text,
  p_checkout_id text,
  p_amount_cents integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders%rowtype;
begin
  select * into rec from public.orders where id = p_order_id for update;
  if not found and p_checkout_id is not null then
    select * into rec from public.orders where yoco_checkout_id = p_checkout_id for update;
  end if;
  if not found then
    raise exception 'order_not_found';
  end if;
  if rec.payment_status = 'paid' then
    return jsonb_build_object('status', 'already_paid', 'order_id', rec.id);
  end if;
  if rec.status = 'cancelled' then
    raise exception 'order_cancelled';
  end if;
  if p_amount_cents is distinct from rec.total_cents then
    raise exception 'amount_mismatch';
  end if;
  if p_checkout_id is not null
     and rec.yoco_checkout_id is not null
     and rec.yoco_checkout_id <> p_checkout_id then
    raise exception 'checkout_mismatch';
  end if;

  update public.orders set
    status = 'paid',
    fulfilment_status = 'confirmed',
    payment_status = 'paid',
    payment_method = 'yoco',
    payment_provider_reference = p_payment_id,
    payment_session_id = coalesce(p_checkout_id, yoco_checkout_id),
    yoco_checkout_id = coalesce(yoco_checkout_id, p_checkout_id),
    paid_at = now(),
    updated_at = now()
  where id = rec.id;

  update public.products as product
  set stock_qty = greatest(0, product.stock_qty - item.quantity),
      updated_at = now()
  from public.order_items as item
  where item.order_id = rec.id
    and item.product_id = product.id;

  insert into public.order_status_events (
    id, order_id, from_status, to_status, store_status, created_at, actor_role, note
  ) values (
    'ev-paid-' || rec.id || '-' || substr(md5(clock_timestamp()::text || random()::text), 1, 8),
    rec.id,
    rec.fulfilment_status,
    'confirmed',
    'paid',
    now(),
    'system',
    'Yoco payment succeeded'
  );

  return jsonb_build_object('status', 'paid', 'order_id', rec.id);
end;
$$;

create or replace function public.mark_order_payment_failed(
  p_order_id text,
  p_payment_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id text;
begin
  update public.orders set
    payment_status = 'failed',
    payment_provider_reference = coalesce(p_payment_id, payment_provider_reference),
    yoco_checkout_id = null,
    yoco_redirect_url = null,
    updated_at = now()
  where id = p_order_id
    and payment_status <> 'paid'
    and status = 'pending_payment'
  returning id into updated_id;

  if updated_id is null then
    return jsonb_build_object('status', 'ignored', 'order_id', p_order_id);
  end if;
  return jsonb_build_object('status', 'failed', 'order_id', updated_id);
end;
$$;

revoke all on function public.mark_order_paid(text, text, text, integer) from public;
revoke all on function public.mark_order_payment_failed(text, text) from public;
grant execute on function public.mark_order_paid(text, text, text, integer) to service_role;
grant execute on function public.mark_order_payment_failed(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.carcass_batches enable row level security;
alter table public.products enable row level security;
alter table public.pops enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.yoco_webhook_events enable row level security;
alter table public.pop_applications enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_profile_role() = 'admin');

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.current_profile_role() = 'admin')
  with check (id = auth.uid() or public.current_profile_role() = 'admin');

create policy batches_select on public.carcass_batches
  for select to anon, authenticated
  using (true);

create policy products_select on public.products
  for select to anon, authenticated
  using (true);

create policy products_write on public.products
  for all to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy pops_select on public.pops
  for select to anon, authenticated
  using (
    status = 'active'
    or public.current_profile_role() = 'admin'
    or (
      public.current_profile_role() = 'pop'
      and id = public.current_profile_pop_id()
    )
  );

create policy pops_write on public.pops
  for all to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy orders_select on public.orders
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.current_profile_role() = 'admin'
    or (
      public.current_profile_role() = 'pop'
      and pop_id = public.current_profile_pop_id()
    )
  );

create policy orders_insert on public.orders
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and status = 'pending_payment'
    and public.current_profile_role() = 'customer'
    or public.current_profile_role() = 'admin'
  );

create policy orders_update on public.orders
  for update to authenticated
  using (
    public.current_profile_role() = 'admin'
    or (customer_id = auth.uid() and status = 'pending_payment')
    or (
      public.current_profile_role() = 'pop'
      and pop_id = public.current_profile_pop_id()
      and status = 'at_pop'
    )
  );

create policy order_items_select on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy order_items_write on public.order_items
  for all to authenticated
  using (
    public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending_payment'
    )
  )
  with check (
    public.current_profile_role() = 'admin'
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending_payment'
    )
  );

create policy order_events_select on public.order_status_events
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy order_events_insert on public.order_status_events
  for insert to authenticated
  with check (
    public.current_profile_role() = 'admin'
    or (
      public.current_profile_role() = 'customer'
      and exists (
        select 1 from public.orders o
        where o.id = order_id and o.customer_id = auth.uid()
      )
    )
    or (
      public.current_profile_role() = 'pop'
      and exists (
        select 1 from public.orders o
        where o.id = order_id and o.pop_id = public.current_profile_pop_id()
      )
    )
  );

create policy applications_select on public.pop_applications
  for select to authenticated
  using (
    applicant_user_id = auth.uid()
    or public.current_profile_role() = 'admin'
  );

create policy applications_insert on public.pop_applications
  for insert to authenticated
  with check (applicant_user_id is null or applicant_user_id = auth.uid());

create policy applications_update on public.pop_applications
  for update to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.pops, public.carcass_batches to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert on public.order_status_events to authenticated;
grant select, insert, update on public.pop_applications to authenticated;

-- ---------------------------------------------------------------------------
-- Seed from the in-app catalogue. Ultimate Outdoor is the only live POP.
-- ---------------------------------------------------------------------------

insert into public.carcass_batches (
  id, ear_tag, carcass_number, qr_code, breed, born_at, raised_at, finished_at, processed_at, story, butchers_note
) values
(
  'batch-ox-214', 'ODB-214', 'LC-2026-0142', 'LC-2026-0142', 'Drakensberg',
  '2023-04-12', 'Ouderdam Farm, Lüneburg', '2026-09-28', '2026-10-02',
  'Born on Ouderdam under the Drakensberg foothills. Raised on our own pastures by the Lüneburg family — the same land and the same standards since 1946. Finished slowly for yellow fat and marbling that hold up in vacuum skin pack.',
  'Carcass LC-2026-0142 was broken by father and brother Ruben. Ear tag ODB-214 linked in Cleaver. Packs from this carcass carry one shared QR for the batch story.'
),
(
  'batch-ox-198', 'ODB-198', 'LC-2026-0118', 'LC-2026-0118', 'Drakensberg',
  '2023-02-03', 'Ouderdam Farm, Lüneburg', '2026-08-15', '2026-08-19',
  'A quiet animal with strong frame — typical of our Drakensberg line. Grazed the same camps as his sire. We wait for the fat colour and size we want before we cut.',
  'Used primarily for braai-box and sausage trim after premium steaks were pulled. Traceability still runs ear tag to carcass to pack QR.'
)
on conflict do nothing;

insert into public.products (
  id, name, category, description, price_cents, pack_size, weight_grams, cut_notes,
  image_hint, stock_qty, low_stock_threshold, next_arrival_date, carcass_batch_id
) values
('vsp-ribeye', 'Ribeye VSP', 'premium-vsp',
  'C-grade ribeye from our own Drakensberg cattle. Vacuum skin packed — cut for size, yellow fat, and marbling.',
  38900, 'per pack (~400g)', 400, 'Big steak size · yellow fat · marbling', 'ribeye', 6, 4, '2026-11-12T08:00:00+02:00', 'batch-ox-214'),
('vsp-sirloin', 'Sirloin VSP', 'premium-vsp',
  'Premium sirloin, VSP. Own cattle only — we do not buy in for this line.',
  34900, 'per pack (~380g)', 380, 'Actual size on the pack · yellow fat', 'sirloin', 2, 4, '2026-11-12T08:00:00+02:00', 'batch-ox-214'),
('vsp-fillet', 'Fillet VSP', 'premium-vsp',
  'Fillet steaks in vacuum skin pack. Limited by carcass yield — when it is gone, the next date is on the listing.',
  42900, 'per pack (~350g)', 350, 'Centre-cut · marbling where the animal gives it', 'fillet', 0, 3, '2026-11-18T08:00:00+02:00', 'batch-ox-214'),
('vsp-rump', 'Rump VSP', 'premium-vsp',
  'Rump steak, VSP. Same cattle, same yard, same cut discipline.',
  29900, 'per pack (~400g)', 400, 'Large portion · yellow fat edge', 'rump', 11, 4, '2026-11-20T08:00:00+02:00', 'batch-ox-214'),
('braai-family', 'Family Braai Box', 'braai-boxes',
  'Mixed everyday cuts for the fire — chops, wors pieces, and braai steaks. Built for the existing customer base.',
  65000, 'box (~2.5kg)', 2500, null, 'braai-box', 18, 5, '2026-11-08T08:00:00+02:00', 'batch-ox-198'),
('braai-weekend', 'Weekend Braai Box', 'braai-boxes',
  'Smaller mixed box for two to four. Honest country cuts, no fuss.',
  42000, 'box (~1.5kg)', 1500, null, 'braai-weekend', 3, 5, '2026-11-08T08:00:00+02:00', 'batch-ox-198'),
('braai-boere', 'Boerewors Braai Pack', 'braai-boxes',
  'Traditional boerewors pack ready for the grid. Part of the everyday range.',
  18900, '1kg', 1000, null, 'boerewors', 0, 6, '2026-11-05T08:00:00+02:00', 'batch-ox-198'),
('sausage-medwurst', 'Medwurst', 'sausages',
  'German-style Medwurst. Made in the butchery to the house recipe.',
  16500, '500g', 500, null, 'medwurst', 14, 4, '2026-11-10T08:00:00+02:00', null),
('sausage-bratwurst', 'Bratwurst', 'sausages',
  'German-style Bratwurst for the pan or the fire.',
  15500, '500g', 500, null, 'bratwurst', 1, 4, '2026-11-10T08:00:00+02:00', null),
('sausage-buddhawurst', 'Buddhawurst', 'sausages',
  'Salt and pepper style Buddhawurst — clean seasoning, no compromise.',
  17500, '500g', 500, null, 'buddhawurst', 8, 4, '2026-11-10T08:00:00+02:00', null)
on conflict do nothing;

insert into public.pops (
  id, code, name, status, area_label, phase, address_line1, address_line2, city, region,
  lat, lng, hours, collection_instructions, sort_order
) values
(
  'ultimate-outdoor-piet-retief', 'UO-PR', 'Ultimate Outdoor', 'active', 'Piet Retief', 'P1',
  '18 Smit Street', 'ex-Foggerful Megaworld', 'Piet Retief', 'Mpumalanga',
  -27.0035, 30.8132,
  '{"weekly":[{"day":0,"open":"00:00","close":"00:00","closed":true},{"day":1,"open":"09:00","close":"17:00"},{"day":2,"open":"09:00","close":"17:00"},{"day":3,"open":"09:00","close":"17:00"},{"day":4,"open":"09:00","close":"17:00"},{"day":5,"open":"09:00","close":"17:00"},{"day":6,"open":"09:00","close":"13:00"}],"note":"Collection hours are confirmed with your order."}'::jsonb,
  'Bring your collection code and ID. Keep packs cold — collect promptly once marked ready. Site formerly Foggerful Megaworld.',
  1
),
(
  'brooks-in-the-park-pretoria', 'BIP-PTA', 'Brooks in the Park', 'pending', 'Waterkloof, Pretoria', 'P2',
  '291 Main Street', null, 'Pretoria', 'Gauteng',
  -25.7786, 28.2406,
  '{"weekly":[{"day":0,"open":"00:00","close":"00:00","closed":true},{"day":1,"open":"09:00","close":"17:00"},{"day":2,"open":"09:00","close":"17:00"},{"day":3,"open":"09:00","close":"17:00"},{"day":4,"open":"09:00","close":"17:00"},{"day":5,"open":"09:00","close":"17:00"},{"day":6,"open":"09:00","close":"13:00"}],"note":"Collection hours are confirmed with your order."}'::jsonb,
  'Bring your collection code and collect promptly once the order is marked ready.',
  2
),
(
  'heidelberg-partner-tbd', 'HDB-TBD', 'Heidelberg', 'pending', 'Heidelberg', 'P3',
  'Address TBC', null, 'Heidelberg', 'Gauteng',
  null, null,
  '{"weekly":[{"day":0,"open":"00:00","close":"00:00","closed":true},{"day":1,"open":"09:00","close":"17:00"},{"day":2,"open":"09:00","close":"17:00"},{"day":3,"open":"09:00","close":"17:00"},{"day":4,"open":"09:00","close":"17:00"},{"day":5,"open":"09:00","close":"17:00"},{"day":6,"open":"09:00","close":"13:00"}],"note":"Collection hours are confirmed with your order."}'::jsonb,
  'Bring your collection code and collect promptly once the order is marked ready.',
  3
)
on conflict do nothing;

-- Sample order for the admin queue. No customer account is attached.
insert into public.orders (
  id, order_ref, created_at, customer_name, phone, email, status, fulfilment_status,
  fulfilment, pop_id, total_cents, payment_method, payment_status, amount_estimated_cents,
  paid_at, pack_check_accepted_at, assigned_at
) values (
  'ord-demo-001', 'LC-261020-014', '2026-10-20T14:22:00+02:00',
  'Demo Customer', '+27 82 000 0000', 'demo@luneburg.example',
  'confirmed', 'packing', 'pop_collect', 'ultimate-outdoor-piet-retief',
  94300, 'stub', 'paid', 94300,
  '2026-10-20T14:21:00+02:00', '2026-10-20T14:20:00+02:00', '2026-10-20T14:20:00+02:00'
)
on conflict do nothing;

insert into public.order_items (order_id, product_id, product_name, quantity, unit_price_cents) values
  ('ord-demo-001', 'vsp-ribeye', 'Ribeye VSP', 2, 38900),
  ('ord-demo-001', 'sausage-medwurst', 'Medwurst', 1, 16500)
on conflict do nothing;

insert into public.order_status_events (id, order_id, from_status, to_status, store_status, created_at, actor_role, note) values
  ('ev-demo-1', 'ord-demo-001', null, 'placed', 'pending_payment', '2026-10-20T14:20:00+02:00', 'customer', 'Order placed'),
  ('ev-demo-2', 'ord-demo-001', 'placed', 'confirmed', 'confirmed', '2026-10-20T14:21:00+02:00', 'system', 'Payment received'),
  ('ev-demo-3', 'ord-demo-001', 'confirmed', 'packing', 'confirmed', '2026-10-20T14:22:00+02:00', 'admin', 'Packing')
on conflict do nothing;
