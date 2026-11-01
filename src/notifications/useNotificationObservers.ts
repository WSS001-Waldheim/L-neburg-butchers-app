/**
 * Foreground + tap handlers for Expo Notifications.
 * Stub: no native listeners. Merge sketch shows intended wiring.
 *
 * Deep link target: /order/[orderId] (Expo Router).
 */

import type { OrderStatusPushData } from './types';

export type NotificationNavigation = {
  /** e.g. router.push(`/order/${orderId}`) */
  openOrder: (orderId: string) => void;
};

export function parseOrderStatusData(
  data: unknown,
): OrderStatusPushData | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.type !== 'order_status' || typeof d.orderId !== 'string') return null;
  if (typeof d.orderRef !== 'string' || typeof d.event !== 'string') return null;
  return {
    type: 'order_status',
    orderId: d.orderId,
    orderRef: d.orderRef,
    event: d.event as OrderStatusPushData['event'],
    popId: typeof d.popId === 'string' ? d.popId : undefined,
  };
}

/**
 * Handle a notification response (user tapped the banner).
 * Safe to call from stub inbox “Open” buttons in demos.
 */
export function handleNotificationNavigation(
  data: unknown,
  nav: NotificationNavigation,
): boolean {
  const parsed = parseOrderStatusData(data);
  if (!parsed) return false;
  nav.openOrder(parsed.orderId);
  return true;
}

/**
 * React hook sketch (app merge):
 *
 * import * as Notifications from 'expo-notifications';
 * import { useRouter } from 'expo-router';
 * import { useEffect } from 'react';
 *
 * Notifications.setNotificationHandler({
 *   handleNotification: async () => ({
 *     shouldShowAlert: true,
 *     shouldPlaySound: true,
 *     shouldSetBadge: false,
 *   }),
 * });
 *
 * export function useNotificationObservers() {
 *   const router = useRouter();
 *   useEffect(() => {
 *     const sub = Notifications.addNotificationResponseReceivedListener((r) => {
 *       handleNotificationNavigation(r.notification.request.content.data, {
 *         openOrder: (id) => router.push(`/order/${id}`),
 *       });
 *     });
 *     return () => sub.remove();
 *   }, [router]);
 * }
 */
export function useNotificationObserversSketch(
  nav: NotificationNavigation,
): {
  onTapData: (data: unknown) => void;
} {
  return {
    onTapData: (data) => {
      handleNotificationNavigation(data, nav);
    },
  };
}
