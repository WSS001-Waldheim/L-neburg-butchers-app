/**
 * POP fulfilment transitions. Illegal moves throw — wire to API 409.
 */

import type { AuthUser, PopFulfilmentStatus, UserRole } from './types';
import { PopPermissionError } from './roleGuards';

type Transition = {
  from: PopFulfilmentStatus;
  to: PopFulfilmentStatus;
  roles: UserRole[];
  /** system = payment webhook / auto-close; still recorded as actorRole when known */
  allowSystem?: boolean;
};

const TRANSITIONS: readonly Transition[] = [
  { from: 'placed', to: 'confirmed', roles: ['admin'], allowSystem: true },
  { from: 'confirmed', to: 'packing', roles: ['admin'] },
  { from: 'packing', to: 'packed', roles: ['admin'] },
  { from: 'packed', to: 'dispatched_to_pop', roles: ['admin'] },
  { from: 'dispatched_to_pop', to: 'ready_for_collection', roles: ['admin'] },
  {
    from: 'ready_for_collection',
    to: 'collected',
    roles: ['admin', 'pop_partner'],
  },
  { from: 'collected', to: 'completed', roles: ['admin'], allowSystem: true },
  {
    from: 'ready_for_collection',
    to: 'no_show',
    roles: ['admin', 'pop_partner'],
  },
  {
    from: 'dispatched_to_pop',
    to: 'returned_to_butchery',
    roles: ['admin'],
  },
  {
    from: 'ready_for_collection',
    to: 'returned_to_butchery',
    roles: ['admin'],
  },
  { from: 'no_show', to: 'returned_to_butchery', roles: ['admin'] },
  // cancel: any pre-dispatch status
  { from: 'placed', to: 'cancelled', roles: ['admin', 'customer'] },
  { from: 'confirmed', to: 'cancelled', roles: ['admin', 'customer'] },
  { from: 'packing', to: 'cancelled', roles: ['admin', 'customer'] },
  { from: 'packed', to: 'cancelled', roles: ['admin', 'customer'] },
];

export function canTransition(
  from: PopFulfilmentStatus,
  to: PopFulfilmentStatus,
  actor: AuthUser | 'system',
): boolean {
  const edge = TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!edge) return false;
  if (actor === 'system') return Boolean(edge.allowSystem);
  return edge.roles.includes(actor.role);
}

export function assertTransition(
  from: PopFulfilmentStatus,
  to: PopFulfilmentStatus,
  actor: AuthUser | 'system',
): void {
  if (!canTransition(from, to, actor)) {
    throw new PopPermissionError(
      `Illegal fulfilment transition ${from} → ${to}`,
    );
  }
}

/** True once order left butchery — customer cancel/edit blocked. */
export function isColdChainLocked(status: PopFulfilmentStatus): boolean {
  return (
    status === 'dispatched_to_pop' ||
    status === 'ready_for_collection' ||
    status === 'collected' ||
    status === 'completed' ||
    status === 'returned_to_butchery' ||
    status === 'no_show'
  );
}
