/**
 * Notification copy templates. Keep tone direct; always surface POP + code when ready.
 */

import type { NotificationEventType } from './eventTypes';
import type { RenderedNotification, TemplateContext } from './types';

type TemplateFn = (ctx: TemplateContext) => { title: string; body: string };

const CUSTOMER_TEMPLATES: Record<
  Extract<
    NotificationEventType,
    | 'order.confirmed'
    | 'order.left_butchery'
    | 'order.ready_at_pop'
    | 'order.collected'
  >,
  TemplateFn
> = {
  'order.confirmed': (ctx) => ({
    title: 'Order confirmed',
    body: `We've got order ${ctx.orderRef}. We'll pack it and send it to ${ctx.popName}.`,
  }),
  'order.left_butchery': (ctx) => ({
    title: 'Parcel left the butchery',
    body: `Order ${ctx.orderRef} is on the way to ${ctx.popName}.`,
  }),
  'order.ready_at_pop': (ctx) => {
    const code = ctx.collectionCode?.trim();
    if (!code) {
      throw new Error('order.ready_at_pop requires collectionCode');
    }
    return {
      title: 'Ready for collection',
      body: `Collect at ${ctx.popName}. Code: ${code}.`,
    };
  },
  'order.collected': (ctx) => ({
    title: 'Collected',
    body: `Order ${ctx.orderRef} was collected at ${ctx.popName}. Thanks.`,
  }),
};

const PARTNER_TEMPLATES: Record<
  Extract<
    NotificationEventType,
    'partner.parcel_en_route' | 'partner.ready_for_handover'
  >,
  TemplateFn
> = {
  'partner.parcel_en_route': (ctx) => ({
    title: 'Parcel en route',
    body: `${ctx.orderRef} is on the way to ${ctx.popName}.`,
  }),
  'partner.ready_for_handover': (ctx) => {
    const code = ctx.collectionCode?.trim();
    if (!code) {
      throw new Error('partner.ready_for_handover requires collectionCode');
    }
    const items =
      ctx.itemCount != null ? ` · ${ctx.itemCount} item(s)` : '';
    return {
      title: 'Ready for hand-over',
      body: `${ctx.orderRef} · code ${code}${items}.`,
    };
  },
};

export function renderCustomerNotification(
  eventType: keyof typeof CUSTOMER_TEMPLATES,
  ctx: TemplateContext,
): RenderedNotification {
  const { title, body } = CUSTOMER_TEMPLATES[eventType](ctx);
  return {
    eventType,
    audience: 'customer',
    title,
    body,
    data: {
      type: 'order_status',
      orderId: ctx.orderId,
      orderRef: ctx.orderRef,
      event: eventType,
      popId: ctx.popId,
    },
  };
}

export function renderPartnerNotification(
  eventType: keyof typeof PARTNER_TEMPLATES,
  ctx: TemplateContext,
): RenderedNotification {
  const { title, body } = PARTNER_TEMPLATES[eventType](ctx);
  return {
    eventType,
    audience: 'pop_partner',
    title,
    body,
    data: {
      type: 'order_status',
      orderId: ctx.orderId,
      orderRef: ctx.orderRef,
      event: eventType,
      popId: ctx.popId,
    },
  };
}

/** Customer-visible timeline labels (align with pop-roles architecture). */
export function timelineLabelForStatus(
  status: string,
  popName?: string,
): string {
  switch (status) {
    case 'placed':
    case 'confirmed':
      return 'Order received';
    case 'packing':
    case 'packed':
      return 'Being prepared';
    case 'dispatched_to_pop':
      return popName ? `On the way to ${popName}` : 'On the way to pickup';
    case 'ready_for_collection':
      return popName
        ? `Ready for collection at ${popName}`
        : 'Ready for collection';
    case 'collected':
    case 'completed':
      return 'Collected';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'Missed collection — contact butchery';
    case 'returned_to_butchery':
      return 'Returned to butchery';
    default:
      return status;
  }
}
