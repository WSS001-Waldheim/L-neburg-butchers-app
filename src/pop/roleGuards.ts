/**
 * Permission guards for POP fulfilment.
 * Server must re-check the same rules; client guards are UX only.
 */

import {
  COLD_CHAIN_LOCKED_STATUSES,
  PARTNER_VISIBLE_STATUSES,
  type AuthUser,
  type PartnerHandOverOrder,
  type PopFulfilmentStatus,
  type PopLocation,
  type UserRole,
} from './types';

export class PopPermissionError extends Error {
  readonly code = 'POP_PERMISSION_DENIED';
  constructor(message: string) {
    super(message);
    this.name = 'PopPermissionError';
  }
}

export function isRole(user: AuthUser, role: UserRole): boolean {
  return user.role === role;
}

export function assertAdmin(user: AuthUser): void {
  if (user.role !== 'admin') {
    throw new PopPermissionError('Admin role required');
  }
}

export function assertPartnerForPop(user: AuthUser, popId: string): void {
  if (user.role !== 'pop_partner' || user.popId !== popId) {
    throw new PopPermissionError('Not the assigned POP partner for this location');
  }
}

export function canListActivePops(user: AuthUser | null): boolean {
  // Guests may browse active POPs at checkout before register in some flows;
  // tighten to customers-only if product requires auth before fulfilment step.
  return user === null || user.role === 'customer' || user.role === 'admin';
}

export function canPlaceOrderWithPop(
  user: AuthUser,
  pop: PopLocation,
): boolean {
  return user.role === 'customer' && pop.isActive;
}

export function canCustomerCancel(
  user: AuthUser,
  orderCustomerId: string,
  status: PopFulfilmentStatus,
): boolean {
  if (user.role !== 'customer' || user.id !== orderCustomerId) return false;
  return !COLD_CHAIN_LOCKED_STATUSES.includes(status) && status !== 'cancelled';
}

export function canActivatePop(user: AuthUser): boolean {
  return user.role === 'admin';
}

/** Karl / Ruben / father / factory manager — all use admin role in v1. */
export function canReviewPartnerApplication(user: AuthUser): boolean {
  return user.role === 'admin';
}

export function canSubmitPartnerApplication(user: AuthUser | null): boolean {
  // Guests or customers may apply; partners already assigned do not re-apply here.
  if (user === null) return true;
  return user.role === 'customer';
}

export function canAssignOrderPop(user: AuthUser): boolean {
  return user.role === 'admin';
}

export function canAdvanceButcheryFulfilment(user: AuthUser): boolean {
  return user.role === 'admin';
}

export function canPartnerSeeOrder(
  user: AuthUser,
  orderPopId: string,
  status: PopFulfilmentStatus,
): boolean {
  if (user.role === 'admin') return true;
  if (user.role !== 'pop_partner' || user.popId !== orderPopId) return false;
  return PARTNER_VISIBLE_STATUSES.includes(status);
}

export function canMarkCollected(
  user: AuthUser,
  orderPopId: string,
  status: PopFulfilmentStatus,
): boolean {
  if (status !== 'ready_for_collection') return false;
  if (user.role === 'admin') return true;
  return user.role === 'pop_partner' && user.popId === orderPopId;
}

export function canMarkNoShow(
  user: AuthUser,
  orderPopId: string,
  status: PopFulfilmentStatus,
): boolean {
  if (status !== 'ready_for_collection') return false;
  if (user.role === 'admin') return true;
  return user.role === 'pop_partner' && user.popId === orderPopId;
}

/**
 * Strip payment and full PII before partner UI.
 * Call on every partner order read — never send raw Order rows.
 */
export function toPartnerHandOverOrder(input: {
  orderId: string,
  orderRef: string,
  collectionCode?: string,
  fulfilmentStatus: PopFulfilmentStatus,
  customerFirstName: string,
  customerLastName: string,
  customerPhone?: string,
  items: Array<{ title: string; quantity: number }>,
  readyAt?: string,
  notesForPickup?: string,
  popId: string,
  popName: string,
}): PartnerHandOverOrder {
  const lastInitial = input.customerLastName.trim().charAt(0).toUpperCase();
  const display =
    lastInitial.length > 0
      ? `${input.customerFirstName} ${lastInitial}.`
      : input.customerFirstName;

  return {
    orderId: input.orderId,
    orderRef: input.orderRef,
    collectionCode: input.collectionCode ?? null,
    fulfilmentStatus: input.fulfilmentStatus,
    customerDisplayName: display,
    customerPhoneMasked: input.customerPhone
      ? maskPhone(input.customerPhone)
      : undefined,
    itemSummary: input.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
    })),
    readyAt: input.readyAt,
    notesForPickup: input.notesForPickup,
    popId: input.popId,
    popName: input.popName,
  };
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}
