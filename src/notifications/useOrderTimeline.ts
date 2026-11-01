/**
 * Courier-style in-app status history.
 * Builds timeline rows from order_status_events (or a local event list in demos).
 */

import { timelineLabelForStatus } from './templates';
import type { OrderTimelineEntry } from './types';

export type StatusEventInput = {
  id: string;
  orderId: string;
  fromStatus?: string | null;
  toStatus: string;
  createdAt: string;
  actorRole?: string;
  note?: string | null;
  collectionCode?: string | null;
};

/**
 * Map raw status events → UI timeline (chronological ascending).
 */
export function buildOrderTimeline(
  events: StatusEventInput[],
  popName?: string,
): OrderTimelineEntry[] {
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return sorted.map((ev) => {
    const label = timelineLabelForStatus(ev.toStatus, popName);
    let detail: string | undefined;
    if (ev.toStatus === 'ready_for_collection' && ev.collectionCode) {
      detail = `Collection code: ${ev.collectionCode}`;
    } else if (ev.note) {
      detail = ev.note;
    } else if (ev.toStatus === 'dispatched_to_pop' && popName) {
      detail = `Left butchery → ${popName}`;
    }
    return {
      id: ev.id,
      orderId: ev.orderId,
      fromStatus: ev.fromStatus ?? null,
      toStatus: ev.toStatus,
      label,
      detail,
      createdAt: ev.createdAt,
      actorRole: ev.actorRole,
    };
  });
}

/**
 * Hook sketch:
 *
 * export function useOrderTimeline(orderId: string, popName?: string) {
 *   const events = useOrderStatusEvents(orderId); // from API or local store
 *   return useMemo(
 *     () => buildOrderTimeline(events, popName),
 *     [events, popName],
 *   );
 * }
 */
export function useOrderTimelineSketch(
  events: StatusEventInput[],
  popName?: string,
): OrderTimelineEntry[] {
  return buildOrderTimeline(events, popName);
}
