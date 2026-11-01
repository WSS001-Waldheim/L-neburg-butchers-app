/**
 * Notification domain types. Merge prefs onto user profile when wiring auth.
 */

import type { NotificationAudience, NotificationEventType } from './eventTypes';

export type NotificationsMode = 'stub' | 'sandbox' | 'live';

export type NotificationPreferences = {
  pushOrderConfirmed: boolean;
  pushLeftButchery: boolean;
  pushReadyForCollection: boolean;
  /** Karl: collected is optional — default true, user may disable. */
  pushCollected: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushOrderConfirmed: true,
  pushLeftButchery: true,
  pushReadyForCollection: true,
  pushCollected: true,
};

export type TemplateContext = {
  orderId: string;
  orderRef: string;
  popName: string;
  popId: string;
  /** Required for ready_at_pop / partner ready; omit otherwise. */
  collectionCode?: string | null;
  itemCount?: number;
};

export type RenderedNotification = {
  eventType: NotificationEventType;
  audience: NotificationAudience;
  title: string;
  body: string;
  data: OrderStatusPushData;
};

export type OrderStatusPushData = {
  type: 'order_status';
  orderId: string;
  orderRef: string;
  event: NotificationEventType;
  popId?: string;
};

export type PushRecipient = {
  userId: string;
  audience: NotificationAudience;
  /** Expo push token when registered; stub may omit. */
  expoPushToken?: string;
  prefs: NotificationPreferences;
};

export type NotificationDispatchRequest = {
  orderId: string;
  eventType: NotificationEventType;
  recipient: PushRecipient;
  rendered: RenderedNotification;
  /** Idempotency: orderId + toStatus + userId + eventType */
  idempotencyKey: string;
};

export type NotificationDispatchResult = {
  id: string;
  status: 'stubbed' | 'queued' | 'sent' | 'skipped' | 'failed';
  reason?: string;
  providerId?: string;
};

/** One row on the in-app courier timeline (all statuses, not only pushable). */
export type OrderTimelineEntry = {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  label: string;
  detail?: string;
  createdAt: string; // ISO
  actorRole?: string;
};

export type DevicePushToken = {
  userId: string;
  expoPushToken: string;
  platform: 'ios' | 'android';
  active: boolean;
  updatedAt: string;
};
