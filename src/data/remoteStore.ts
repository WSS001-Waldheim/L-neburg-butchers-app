import type { AuthUser, UserRole } from '../pop/types';
import type { PopApprovalStatus, PopLocation } from '../pop/types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { isStoreOrderStatus, storeStatusForFulfilment } from './storeStatus';
import type {
  Order,
  OrderLine,
  OrderStatusEvent,
  Product,
  ProductSection,
  StoreOrderStatus,
} from './types';
import type { PaymentMethodKind, PaymentStatus } from '../payments/types';
import type { FulfilmentMethod } from './types';
import type { PopFulfilmentStatus } from '../pop/types';
import type { PopPartnerApplication } from '../pop/applicationTypes';

type ProductRow = {
  id: string;
  name: string;
  category: ProductSection;
  description: string;
  price_cents: number;
  pack_size: string;
  weight_grams: number | null;
  cut_notes: string | null;
  image_hint: string;
  photo_url: string | null;
  stock_qty: number;
  low_stock_threshold: number;
  next_arrival_date: string | null;
  carcass_batch_id: string | null;
};

type PopRow = {
  id: string;
  code: string;
  name: string;
  status: PopApprovalStatus;
  area_label: string;
  phase: PopLocation['phase'];
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  hours: PopLocation['hours'];
  collection_instructions: string;
  contact_phone: string | null;
  sort_order: number;
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
};

type OrderEventRow = {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  store_status: string | null;
  created_at: string;
  actor_role: string | null;
  note: string | null;
  collection_code: string | null;
};

type OrderRow = {
  id: string;
  order_ref: string;
  created_at: string;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: string;
  fulfilment_status: string;
  fulfilment: string;
  pop_id: string | null;
  total_cents: number;
  payment_method: string | null;
  payment_status: string;
  amount_estimated_cents: number;
  amount_final_cents: number | null;
  payment_session_id: string | null;
  payment_provider_reference: string | null;
  paid_at: string | null;
  yoco_checkout_id: string | null;
  yoco_redirect_url: string | null;
  collection_code: string | null;
  collection_code_expires_at: string | null;
  assigned_at: string | null;
  dispatched_at: string | null;
  ready_at: string | null;
  collected_at: string | null;
  collected_by: string | null;
  collector_note: string | null;
  pack_check_accepted_at: string;
  cold_chain_clock_started_at: string | null;
  pickup_location: string | null;
  order_items?: OrderItemRow[];
  order_status_events?: OrderEventRow[];
};

type ProfileRow = {
  id: string;
  role: 'customer' | 'pop' | 'admin';
  full_name: string;
  phone: string;
  email: string | null;
  pop_id: string | null;
};

type ApplicationRow = {
  id: string;
  status: PopPartnerApplication['status'];
  business_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  notes: string | null;
  proposed_hours_note: string | null;
  applicant_user_id: string | null;
  linked_pop_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

function assertOk<T>(data: T, error: { message: string } | null, action: string): T {
  if (error) throw new Error(`${action}: ${error.message}`);
  return data;
}

function appRole(role: ProfileRow['role']): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'pop') return 'pop_partner';
  return 'customer';
}

function dbRole(role: UserRole): ProfileRow['role'] {
  if (role === 'admin') return 'admin';
  if (role === 'pop_partner') return 'pop';
  return 'customer';
}

export function profileToUser(row: ProfileRow): AuthUser {
  return {
    id: row.id,
    role: appRole(row.role),
    name: row.full_name || 'Customer',
    phone: row.phone || '',
    email: row.email ?? undefined,
    popId: row.pop_id ?? undefined,
  };
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    section: row.category,
    description: row.description,
    priceCents: row.price_cents,
    unitLabel: row.pack_size,
    weightGrams: row.weight_grams ?? undefined,
    cutNotes: row.cut_notes ?? undefined,
    imageHint: row.image_hint,
    photoUri: row.photo_url,
    stockLevel: row.stock_qty,
    lowStockThreshold: row.low_stock_threshold,
    nextArrivalAt: row.next_arrival_date,
    carcassBatchId: row.carcass_batch_id,
  };
}

function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    name: product.name,
    category: product.section,
    description: product.description,
    price_cents: product.priceCents,
    pack_size: product.unitLabel,
    weight_grams: product.weightGrams ?? null,
    cut_notes: product.cutNotes ?? null,
    image_hint: product.imageHint,
    photo_url: product.photoUri ?? null,
    stock_qty: product.stockLevel,
    low_stock_threshold: product.lowStockThreshold,
    next_arrival_date: product.nextArrivalAt,
    carcass_batch_id: product.carcassBatchId,
  };
}

function popFromRow(row: PopRow): PopLocation {
  const status = row.status;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status,
    areaLabel: row.area_label,
    phase: row.phase,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? undefined,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code ?? undefined,
    geo:
      row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
    hours: row.hours,
    collectionInstructions: row.collection_instructions,
    contactPhone: row.contact_phone ?? undefined,
    isActive: status === 'active',
    sortOrder: row.sort_order,
  };
}

function popToRow(pop: PopLocation): PopRow {
  return {
    id: pop.id,
    code: pop.code,
    name: pop.name,
    status: pop.status,
    area_label: pop.areaLabel,
    phase: pop.phase,
    address_line1: pop.addressLine1,
    address_line2: pop.addressLine2 ?? null,
    city: pop.city,
    region: pop.region,
    postal_code: pop.postalCode ?? null,
    lat: pop.geo?.lat ?? null,
    lng: pop.geo?.lng ?? null,
    hours: pop.hours,
    collection_instructions: pop.collectionInstructions,
    contact_phone: pop.contactPhone ?? null,
    sort_order: pop.sortOrder,
  };
}

function asPaymentStatus(value: string): PaymentStatus {
  const known: PaymentStatus[] = [
    'none',
    'pending',
    'authorized',
    'paid',
    'adjusted',
    'failed',
    'cancelled',
    'refunded',
  ];
  return (known as string[]).includes(value) ? (value as PaymentStatus) : 'none';
}

function asMethod(value: string | null): PaymentMethodKind | undefined {
  if (value === 'apple_pay' || value === 'yoco' || value === 'stub') return value;
  return undefined;
}

function orderFromRow(row: OrderRow): Order {
  const paymentStatus = asPaymentStatus(row.payment_status);
  const fulfilmentStatus = row.fulfilment_status as PopFulfilmentStatus;
  const storeStatus: StoreOrderStatus = isStoreOrderStatus(row.status)
    ? row.status
    : storeStatusForFulfilment(fulfilmentStatus, paymentStatus);
  const lines: OrderLine[] = (row.order_items ?? []).map((line) => ({
    productId: line.product_id,
    productName: line.product_name,
    quantity: line.quantity,
    unitPriceCents: line.unit_price_cents,
  }));
  const statusEvents: OrderStatusEvent[] = (row.order_status_events ?? [])
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((event) => ({
      id: event.id,
      orderId: event.order_id,
      fromStatus: (event.from_status as PopFulfilmentStatus | null) ?? null,
      toStatus: event.to_status as PopFulfilmentStatus,
      storeStatus: event.store_status && isStoreOrderStatus(event.store_status)
        ? event.store_status
        : null,
      createdAt: event.created_at,
      actorRole: event.actor_role ?? undefined,
      note: event.note,
      collectionCode: event.collection_code,
    }));

  return {
    id: row.id,
    orderRef: row.order_ref,
    createdAt: row.created_at,
    customerId: row.customer_id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    lines,
    totalCents: row.total_cents,
    fulfilment: row.fulfilment as FulfilmentMethod,
    popId: row.pop_id ?? undefined,
    storeStatus,
    fulfilmentStatus,
    collectionCode: row.collection_code ?? undefined,
    collectionCodeExpiresAt: row.collection_code_expires_at ?? undefined,
    assignedAt: row.assigned_at ?? undefined,
    dispatchedAt: row.dispatched_at ?? undefined,
    readyAt: row.ready_at ?? undefined,
    collectedAt: row.collected_at ?? undefined,
    collectedByUserId: row.collected_by ?? undefined,
    collectorNote: row.collector_note ?? undefined,
    packCheckAcceptedAt: row.pack_check_accepted_at,
    coldChainClockStartedAt: row.cold_chain_clock_started_at ?? undefined,
    statusEvents,
    pickupLocation: row.pickup_location ?? undefined,
    yocoCheckoutId: row.yoco_checkout_id,
    yocoRedirectUrl: row.yoco_redirect_url,
    paymentMethod: asMethod(row.payment_method),
    paymentStatus,
    amountEstimated: { cents: row.amount_estimated_cents, currency: 'ZAR' },
    amountFinal:
      row.amount_final_cents != null
        ? { cents: row.amount_final_cents, currency: 'ZAR' }
        : undefined,
    paymentSessionId: row.payment_session_id ?? undefined,
    paymentProviderReference: row.payment_provider_reference ?? undefined,
    paidAt: row.paid_at ?? undefined,
  };
}

function orderToRow(order: Order): Omit<OrderRow, 'order_items' | 'order_status_events'> {
  return {
    id: order.id,
    order_ref: order.orderRef,
    created_at: order.createdAt,
    customer_id: order.customerId ?? null,
    customer_name: order.customerName,
    phone: order.phone,
    email: order.email ?? null,
    notes: order.notes ?? null,
    status: order.storeStatus,
    fulfilment_status: order.fulfilmentStatus,
    fulfilment: order.fulfilment,
    pop_id: order.popId ?? null,
    total_cents: order.totalCents,
    payment_method: order.paymentMethod ?? null,
    payment_status: order.paymentStatus,
    amount_estimated_cents: order.amountEstimated.cents,
    amount_final_cents: order.amountFinal?.cents ?? null,
    payment_session_id: order.paymentSessionId ?? null,
    payment_provider_reference: order.paymentProviderReference ?? null,
    paid_at: order.paidAt ?? null,
    yoco_checkout_id: order.yocoCheckoutId ?? null,
    yoco_redirect_url: order.yocoRedirectUrl ?? null,
    collection_code: order.collectionCode ?? null,
    collection_code_expires_at: order.collectionCodeExpiresAt ?? null,
    assigned_at: order.assignedAt ?? null,
    dispatched_at: order.dispatchedAt ?? null,
    ready_at: order.readyAt ?? null,
    collected_at: order.collectedAt ?? null,
    collected_by: order.collectedByUserId ?? null,
    collector_note: order.collectorNote ?? null,
    pack_check_accepted_at: order.packCheckAcceptedAt,
    cold_chain_clock_started_at: order.coldChainClockStartedAt ?? null,
    pickup_location: order.pickupLocation ?? null,
  };
}

function applicationFromRow(row: ApplicationRow): PopPartnerApplication {
  return {
    id: row.id,
    status: row.status,
    businessName: row.business_name,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? undefined,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code ?? undefined,
    geo: row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    notes: row.notes ?? undefined,
    proposedHoursNote: row.proposed_hours_note ?? undefined,
    applicantUserId: row.applicant_user_id ?? undefined,
    linkedPopId: row.linked_pop_id ?? undefined,
    reviewedByUserId: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function applicationToRow(app: PopPartnerApplication): ApplicationRow {
  return {
    id: app.id,
    status: app.status,
    business_name: app.businessName,
    address_line1: app.addressLine1,
    address_line2: app.addressLine2 ?? null,
    city: app.city,
    region: app.region,
    postal_code: app.postalCode ?? null,
    lat: app.geo?.lat ?? null,
    lng: app.geo?.lng ?? null,
    contact_name: app.contactName,
    contact_phone: app.contactPhone,
    contact_email: app.contactEmail,
    notes: app.notes ?? null,
    proposed_hours_note: app.proposedHoursNote ?? null,
    applicant_user_id: app.applicantUserId ?? null,
    linked_pop_id: app.linkedPopId ?? null,
    reviewed_by: app.reviewedByUserId ?? null,
    reviewed_at: app.reviewedAt ?? null,
    review_note: app.reviewNote ?? null,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  const rows = assertOk(data as ProductRow[] | null, error, 'Load products') ?? [];
  return rows.map(productFromRow);
}

export async function saveProduct(product: Product): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('products').upsert(productToRow(product));
  assertOk(null, error, 'Save product');
}

export async function removeProduct(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('products').delete().eq('id', id);
  assertOk(null, error, 'Delete product');
}

export async function fetchPops(): Promise<PopLocation[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pops')
    .select('*')
    .order('sort_order');
  const rows = assertOk(data as PopRow[] | null, error, 'Load pickup points') ?? [];
  return rows.map(popFromRow);
}

export async function savePop(pop: PopLocation): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('pops').upsert(popToRow(pop));
  assertOk(null, error, 'Save pickup point');
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_events(*)')
    .order('created_at', { ascending: false });
  const rows = assertOk(data as OrderRow[] | null, error, 'Load orders') ?? [];
  return rows.map(orderFromRow);
}

export async function saveOrder(
  order: Order,
  options: { replaceLines?: boolean } = {},
): Promise<void> {
  const supabase = getSupabase();
  const { error: orderError } = await supabase.from('orders').upsert(orderToRow(order));
  assertOk(null, orderError, 'Save order');

  if (options.replaceLines !== false && order.lines.length > 0) {
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id);
    assertOk(null, deleteError, 'Replace order lines');
    const { error: lineError } = await supabase.from('order_items').insert(
      order.lines.map((line) => ({
        order_id: order.id,
        product_id: line.productId,
        product_name: line.productName,
        quantity: line.quantity,
        unit_price_cents: line.unitPriceCents,
      })),
    );
    assertOk(null, lineError, 'Save order lines');
  }

  if (order.statusEvents.length > 0) {
    const { error: eventError } = await supabase.from('order_status_events').upsert(
      order.statusEvents.map((event) => ({
        id: event.id,
        order_id: order.id,
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus,
        store_status: event.storeStatus ?? order.storeStatus,
        created_at: event.createdAt,
        actor_role: event.actorRole ?? null,
        note: event.note ?? null,
        collection_code: event.collectionCode ?? null,
      })),
    );
    assertOk(null, eventError, 'Save order events');
  }
}

export async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, email, pop_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Load profile: ${error.message}`);
  if (!data) return null;
  return profileToUser(data as ProfileRow);
}

export async function fetchApplications(): Promise<PopPartnerApplication[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('pop_applications')
    .select('*')
    .order('created_at', { ascending: false });
  const rows =
    assertOk(data as ApplicationRow[] | null, error, 'Load applications') ?? [];
  return rows.map(applicationFromRow);
}

export async function saveApplication(app: PopPartnerApplication): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('pop_applications')
    .upsert(applicationToRow(app));
  assertOk(null, error, 'Save application');
}

export { dbRole };
