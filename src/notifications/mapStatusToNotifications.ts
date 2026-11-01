/**
 * Map a fulfilment status transition → zero or more notification intents.
 * Call after assertTransition succeeds. Does not send — returns work for dispatcher.
 */

import type { PopFulfilmentStatus } from '../pop/types';
import type { NotificationEventType } from './eventTypes';
import {
  renderCustomerNotification,
  renderPartnerNotification,
} from './templates';
import type {
  NotificationPreferences,
  PushRecipient,
  RenderedNotification,
  TemplateContext,
} from './types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './types';

export type NotificationIntent = {
  eventType: NotificationEventType;
  audience: 'customer' | 'pop_partner';
  rendered: RenderedNotification;
  idempotencyKey: string;
};

function prefAllows(
  eventType: NotificationEventType,
  prefs: NotificationPreferences,
): boolean {
  switch (eventType) {
    case 'order.confirmed':
      return prefs.pushOrderConfirmed;
    case 'order.left_butchery':
      return prefs.pushLeftButchery;
    case 'order.ready_at_pop':
      return prefs.pushReadyForCollection;
    case 'order.collected':
      return prefs.pushCollected;
    case 'partner.parcel_en_route':
    case 'partner.ready_for_handover':
      return true; // v1: partner milestones always on
    default:
      return false;
  }
}

/**
 * Build customer + partner intents for entering `toStatus`.
 * Partner intents only if partnerRecipients provided (same popId).
 */
export function mapStatusToNotifications(args: {
  toStatus: PopFulfilmentStatus,
  ctx: TemplateContext,
  customer: PushRecipient,
  partners?: PushRecipient[],
}): NotificationIntent[] {
  const { toStatus, ctx, customer, partners = [] } = args;
  const intents: NotificationIntent[] = [];

  const pushCustomer = (
    eventType: Parameters<typeof renderCustomerNotification>[0],
  ) => {
    const prefs = customer.prefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
    if (!prefAllows(eventType, prefs)) return;
    const rendered = renderCustomerNotification(eventType, ctx);
    intents.push({
      eventType,
      audience: 'customer',
      rendered,
      idempotencyKey: `${ctx.orderId}:${toStatus}:${customer.userId}:${eventType}`,
    });
  };

  const pushPartners = (
    eventType: Parameters<typeof renderPartnerNotification>[0],
  ) => {
    for (const partner of partners) {
      const prefs = partner.prefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
      if (!prefAllows(eventType, prefs)) continue;
      const rendered = renderPartnerNotification(eventType, ctx);
      intents.push({
        eventType,
        audience: 'pop_partner',
        rendered,
        idempotencyKey: `${ctx.orderId}:${toStatus}:${partner.userId}:${eventType}`,
      });
    }
  };

  switch (toStatus) {
    case 'confirmed':
      pushCustomer('order.confirmed');
      break;
    case 'dispatched_to_pop':
      pushCustomer('order.left_butchery');
      pushPartners('partner.parcel_en_route');
      break;
    case 'ready_for_collection':
      pushCustomer('order.ready_at_pop');
      pushPartners('partner.ready_for_handover');
      break;
    case 'collected':
      pushCustomer('order.collected');
      break;
    default:
      break;
  }

  return intents;
}
