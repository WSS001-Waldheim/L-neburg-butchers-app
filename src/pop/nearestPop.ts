/**
 * Nearest active POP from a GPS fix (haversine).
 * Pair at checkout with expo-location foreground permission + getCurrentPositionAsync.
 * Phase 1: one active POP → always that suggestion when location is granted.
 */

import type { PopLocation } from './types';
import { SEED_POPS } from './seedPops';

export type LatLng = { lat: number; lng: number };

export type NearestPopResult = {
  pop: PopLocation;
  distanceKm: number;
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in km (WGS84 sphere). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Nearest **active** POP that has `geo`. Inactive / geo-less POPs are ignored.
 * Returns null when there are no rankable candidates (caller falls back to manual pick).
 */
export function findNearestActivePop(
  user: LatLng,
  pops: readonly PopLocation[] = SEED_POPS,
): NearestPopResult | null {
  const candidates = pops.filter(
    (p) => p.status === 'active' && p.isActive && p.geo != null,
  );
  if (candidates.length === 0) return null;

  let best: NearestPopResult | null = null;
  for (const pop of candidates) {
    const distanceKm = haversineKm(user, pop.geo!);
    if (
      !best ||
      distanceKm < best.distanceKm ||
      (distanceKm === best.distanceKm &&
        (pop.sortOrder < best.pop.sortOrder ||
          (pop.sortOrder === best.pop.sortOrder && pop.id < best.pop.id)))
    ) {
      best = { pop, distanceKm };
    }
  }
  return best;
}

/**
 * Default `popId` for checkout draft after a successful location read.
 * Caller: if permission denied, skip this and require manual selection.
 */
export function suggestedPopIdFromLocation(
  user: LatLng,
  pops: readonly PopLocation[] = SEED_POPS,
): string | null {
  return findNearestActivePop(user, pops)?.pop.id ?? null;
}
