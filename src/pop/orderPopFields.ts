/**
 * Fields to merge into the app Order type for POP fulfilment.
 */

import type { PopFulfilmentStatus } from './types';

export type OrderPopFields = {
  /** Preferred / assigned Point of Pickup. */
  popId: string;
  fulfilmentStatus: PopFulfilmentStatus;
  /** Short spoken code, e.g. LB-7K2M — set when ready_for_collection. */
  collectionCode?: string;
  collectionCodeExpiresAt?: string;
  assignedAt?: string;
  dispatchedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  collectedByUserId?: string;
  collectorNote?: string;
  /** Pack-check / cold-chain acknowledgement at checkout. */
  packCheckAcceptedAt: string;
  /** Usually set at packed or dispatched_to_pop. */
  coldChainClockStartedAt?: string;
};

/** Customer-facing status line helpers. */
export function customerFulfilmentLabel(
  status: PopFulfilmentStatus,
  popName: string,
): string {
  switch (status) {
    case 'placed':
    case 'confirmed':
      return 'Order received';
    case 'packing':
    case 'packed':
      return 'Being prepared';
    case 'dispatched_to_pop':
      return `On the way to ${popName}`;
    case 'ready_for_collection':
      return `Packed and waiting at ${popName}`;
    case 'collected':
    case 'completed':
      return 'Collected';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'Still at the pickup point — collect whenever suits you';
    case 'returned_to_butchery':
      return 'Returned to butchery';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
