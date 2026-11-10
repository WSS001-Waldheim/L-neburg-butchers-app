/**
 * POP (Point of Pickup) types for Lüneburg fulfilment.
 * Merge order fields into app Order type; seed from seedPops.ts.
 */

export type UserRole = 'customer' | 'pop_partner' | 'admin';

export type PopPhase = 'P1' | 'P2' | 'P3';

/** 0 = Sunday … 6 = Saturday (JS Date.getDay). */
export type PopDayHours = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "HH:mm" 24h local, ignored when closed */
  open: string;
  close: string;
  closed?: boolean;
};

export type PopHours = {
  weekly: PopDayHours[];
  /** Shown to customers. Keep unfinished internal notes out of this string. */
  note?: string;
};

export type PopLocation = {
  id: string;
  code: string;
  name: string;
  areaLabel: string;
  phase: PopPhase;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  geo?: { lat: number; lng: number };
  hours: PopHours;
  collectionInstructions: string;
  contactPhone?: string;
  isActive: boolean;
  sortOrder: number;
};

export type PopStaffMembership = {
  userId: string;
  popId: string;
  active: boolean;
};

/**
 * POP fulfilment statuses. Orthogonal to PaymentStatus.
 * Cold-chain lock: no customer cancel/edit once dispatched_to_pop or later.
 */
export type PopFulfilmentStatus =
  | 'placed'
  | 'confirmed'
  | 'packing'
  | 'packed'
  | 'dispatched_to_pop'
  | 'ready_for_collection'
  | 'collected'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'returned_to_butchery';

/** Statuses at or after which the order has left the butchery. */
export const COLD_CHAIN_LOCKED_STATUSES: readonly PopFulfilmentStatus[] = [
  'dispatched_to_pop',
  'ready_for_collection',
  'collected',
  'completed',
  'returned_to_butchery',
  'no_show',
] as const;

/** Partner hand-over queue typically shows these. */
export const PARTNER_VISIBLE_STATUSES: readonly PopFulfilmentStatus[] = [
  'dispatched_to_pop',
  'ready_for_collection',
  'collected',
  'no_show',
] as const;

/** Thin DTO for POP partner UI — no prices / payment. */
export type PartnerHandOverOrder = {
  orderId: string;
  orderRef: string;
  collectionCode: string | null;
  fulfilmentStatus: PopFulfilmentStatus;
  customerDisplayName: string;
  customerPhoneMasked?: string;
  itemSummary: Array<{ title: string; quantity: number }>;
  readyAt?: string;
  notesForPickup?: string;
  popId: string;
  popName: string;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  /** Set for pop_partner; ignored for other roles. */
  popId?: string;
};
