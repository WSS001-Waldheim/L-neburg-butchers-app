/**
 * Demo-safe dispatcher — no Expo Push API calls.
 * Keeps an in-memory inbox for UI previews.
 */

import type { NotificationIntent } from './mapStatusToNotifications';
import type { NotificationDispatchResult, RenderedNotification } from './types';

export type StubInboxItem = {
  id: string;
  idempotencyKey: string;
  userId?: string;
  rendered: RenderedNotification;
  createdAt: string;
};

const inbox: StubInboxItem[] = [];
const seenKeys = new Set<string>();

function newId(): string {
  return `stub-push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getStubInbox(): readonly StubInboxItem[] {
  return inbox;
}

export function clearStubInbox(): void {
  inbox.length = 0;
  seenKeys.clear();
}

export async function dispatchStub(
  intent: NotificationIntent,
  userId?: string,
): Promise<NotificationDispatchResult> {
  if (seenKeys.has(intent.idempotencyKey)) {
    return {
      id: intent.idempotencyKey,
      status: 'skipped',
      reason: 'idempotent_replay',
    };
  }
  seenKeys.add(intent.idempotencyKey);
  const id = newId();
  inbox.push({
    id,
    idempotencyKey: intent.idempotencyKey,
    userId,
    rendered: intent.rendered,
    createdAt: new Date().toISOString(),
  });
  if (typeof console !== 'undefined' && console.info) {
    console.info(
      '[notifications:stub]',
      intent.rendered.title,
      '—',
      intent.rendered.body,
    );
  }
  return { id, status: 'stubbed', providerId: id };
}

export async function dispatchAllStub(
  intents: NotificationIntent[],
  userIdByAudience?: Partial<Record<'customer' | 'pop_partner', string>>,
): Promise<NotificationDispatchResult[]> {
  const results: NotificationDispatchResult[] = [];
  for (const intent of intents) {
    const userId = userIdByAudience?.[intent.audience];
    results.push(await dispatchStub(intent, userId));
  }
  return results;
}
