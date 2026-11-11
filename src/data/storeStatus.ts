import type { PaymentStatus } from '../payments/types';
import type { AuthUser, PopFulfilmentStatus } from '../pop/types';
import type { StoreOrderStatus } from './types';

/**
 * Web-store order lifecycle. `paid` and `confirmed` are separate steps:
 * Yoco marks an order paid; the butchery then confirms it before it leaves.
 */
export const STORE_STATUSES: readonly StoreOrderStatus[] = [
  'pending_payment',
  'paid',
  'confirmed',
  'left_butchery',
  'at_pop',
  'collected',
  'cancelled',
] as const;

const NEXT: Record<StoreOrderStatus, readonly StoreOrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['left_butchery', 'cancelled'],
  left_butchery: ['at_pop'],
  at_pop: ['collected'],
  collected: [],
  cancelled: [],
};

export function nextStoreStatuses(
  from: StoreOrderStatus,
): readonly StoreOrderStatus[] {
  return NEXT[from];
}

export function canSetStoreStatus(
  from: StoreOrderStatus,
  to: StoreOrderStatus,
  actor: AuthUser | 'system',
): boolean {
  if (!NEXT[from].includes(to)) return false;
  if (actor === 'system') return to === 'paid' || to === 'cancelled';
  if (actor.role === 'admin') return true;
  if (actor.role === 'pop_partner' && from === 'at_pop' && to === 'collected') {
    return true;
  }
  if (actor.role === 'customer' && to === 'cancelled') {
    return from === 'pending_payment' || from === 'paid' || from === 'confirmed';
  }
  return false;
}

/** Coarse store status → the fulfilment state the existing timeline understands. */
export function fulfilmentForStoreStatus(
  status: StoreOrderStatus,
): PopFulfilmentStatus {
  switch (status) {
    case 'pending_payment':
      return 'placed';
    case 'paid':
    case 'confirmed':
      return 'confirmed';
    case 'left_butchery':
      return 'dispatched_to_pop';
    case 'at_pop':
      return 'ready_for_collection';
    case 'collected':
      return 'collected';
    case 'cancelled':
      return 'cancelled';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function storeStatusForFulfilment(
  status: PopFulfilmentStatus,
  paymentStatus: PaymentStatus,
): StoreOrderStatus {
  switch (status) {
    case 'placed':
      return paymentStatus === 'paid' || paymentStatus === 'authorized'
        ? 'paid'
        : 'pending_payment';
    case 'confirmed':
    case 'packing':
    case 'packed':
      return paymentStatus === 'paid' || paymentStatus === 'authorized'
        ? 'confirmed'
        : 'paid';
    case 'dispatched_to_pop':
    case 'returned_to_butchery':
      return 'left_butchery';
    case 'ready_for_collection':
    case 'no_show':
      return 'at_pop';
    case 'collected':
    case 'completed':
      return 'collected';
    case 'cancelled':
      return 'cancelled';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function storeStatusLabel(status: StoreOrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Awaiting payment';
    case 'paid':
      return 'Paid';
    case 'confirmed':
      return 'Paid / confirmed';
    case 'left_butchery':
      return 'Left the butchery';
    case 'at_pop':
      return 'At the pickup point';
    case 'collected':
      return 'Collected';
    case 'cancelled':
      return 'Cancelled';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function storeStatusActionLabel(status: StoreOrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Awaiting payment';
    case 'paid':
      return 'Mark paid';
    case 'confirmed':
      return 'Confirm order';
    case 'left_butchery':
      return 'Left the butchery';
    case 'at_pop':
      return 'Ready at pickup';
    case 'collected':
      return 'Mark collected';
    case 'cancelled':
      return 'Cancel order';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isStoreOrderStatus(value: string): value is StoreOrderStatus {
  return (STORE_STATUSES as readonly string[]).includes(value);
}
