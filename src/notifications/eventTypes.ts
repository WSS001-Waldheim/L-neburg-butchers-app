/**
 * Push / notification event types for order fulfilment.
 * Subset of PopFulfilmentStatus transitions — see mapStatusToNotifications.ts.
 */

import type { PopFulfilmentStatus } from '../pop/types';

/** Canonical notification event ids (customer + partner). */
export type NotificationEventType =
  | 'order.confirmed'
  | 'order.left_butchery'
  | 'order.ready_at_pop'
  | 'order.collected'
  | 'partner.parcel_en_route'
  | 'partner.ready_for_handover';

export type NotificationAudience = 'customer' | 'pop_partner';

/** Statuses that may trigger at least one push. */
export const PUSHABLE_FULFILMENT_STATUSES: readonly PopFulfilmentStatus[] = [
  'confirmed',
  'dispatched_to_pop',
  'ready_for_collection',
  'collected',
] as const;

export function isPushableStatus(
  status: PopFulfilmentStatus,
): status is (typeof PUSHABLE_FULFILMENT_STATUSES)[number] {
  return (PUSHABLE_FULFILMENT_STATUSES as readonly string[]).includes(status);
}
