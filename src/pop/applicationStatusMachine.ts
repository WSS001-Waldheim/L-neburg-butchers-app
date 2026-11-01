/**
 * POP partner application transitions.
 * Manual approval only — system never approves.
 */

import type { AuthUser } from './types';
import { PopPermissionError } from './roleGuards';
import type { PopPartnerApplicationStatus } from './applicationTypes';

type ApplicationTransition = {
  from: PopPartnerApplicationStatus;
  to: PopPartnerApplicationStatus;
  /** Who may fire this edge. system = post-submit bump only. */
  actors: Array<'applicant' | 'admin' | 'system'>;
};

const TRANSITIONS: readonly ApplicationTransition[] = [
  { from: 'draft', to: 'submitted', actors: ['applicant'] },
  { from: 'submitted', to: 'pending_review', actors: ['system'] },
  { from: 'pending_review', to: 'approved', actors: ['admin'] },
  { from: 'pending_review', to: 'rejected', actors: ['admin'] },
  { from: 'pending_review', to: 'withdrawn', actors: ['applicant'] },
];

export type ApplicationActor =
  | { kind: 'applicant'; userId: string }
  | { kind: 'admin'; user: AuthUser }
  | { kind: 'system' };

function actorKey(actor: ApplicationActor): 'applicant' | 'admin' | 'system' {
  return actor.kind;
}

export function canTransitionApplication(
  from: PopPartnerApplicationStatus,
  to: PopPartnerApplicationStatus,
  actor: ApplicationActor,
): boolean {
  const edge = TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!edge) return false;
  if (actor.kind === 'admin' && actor.user.role !== 'admin') return false;
  return edge.actors.includes(actorKey(actor));
}

export function assertTransitionApplication(
  from: PopPartnerApplicationStatus,
  to: PopPartnerApplicationStatus,
  actor: ApplicationActor,
): void {
  if (!canTransitionApplication(from, to, actor)) {
    throw new PopPermissionError(
      `Illegal partner application transition ${from} → ${to}`,
    );
  }
}

/**
 * Submit helper: draft|submitted → pending_review.
 * Never skips to approved.
 */
export function transitionAfterSubmit(
  current: PopPartnerApplicationStatus,
): PopPartnerApplicationStatus {
  if (current === 'draft') {
    assertTransitionApplication('draft', 'submitted', {
      kind: 'applicant',
      userId: 'self',
    });
    assertTransitionApplication('submitted', 'pending_review', {
      kind: 'system',
    });
    return 'pending_review';
  }
  if (current === 'submitted') {
    assertTransitionApplication('submitted', 'pending_review', {
      kind: 'system',
    });
    return 'pending_review';
  }
  throw new PopPermissionError(`Cannot submit from status ${current}`);
}

/**
 * Approve: pending_review → approved. Caller must set PopLocation.isActive = true.
 * No system actor allowed.
 */
export function assertApprove(
  current: PopPartnerApplicationStatus,
  admin: AuthUser,
): void {
  assertTransitionApplication(current, 'approved', {
    kind: 'admin',
    user: admin,
  });
}

/**
 * Reject: pending_review → rejected. reviewNote required at call site.
 */
export function assertReject(
  current: PopPartnerApplicationStatus,
  admin: AuthUser,
  reviewNote: string,
): void {
  if (!reviewNote.trim()) {
    throw new PopPermissionError('Reject requires a review note');
  }
  assertTransitionApplication(current, 'rejected', {
    kind: 'admin',
    user: admin,
  });
}

/** There is no auto-approve path — exported for tests / docs. */
export const AUTO_APPROVE_ENABLED = false as const;
