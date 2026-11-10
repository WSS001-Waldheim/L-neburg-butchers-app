/**
 * Phase 1 seed: Ultimate Outdoor (Piet Retief) active;
 * Brooks in the Park + Heidelberg partner inactive until P2/P3.
 * Addresses from Karl (2026-11-01). Collection hours are confirmed with each order.
 * Approx lat/lng for nearest-POP suggestions — refine when Maps pins are confirmed.
 * Heidelberg geo intentionally omitted until the partner is confirmed.
 * Butchery base (not a POP): Ouderdam Farm, Lüneburg, near Paulpietersburg.
 */

import type { AuthUser, PopLocation, PopStaffMembership } from './types';

const COLLECTION_HOURS = {
  weekly: [
    { day: 0 as const, open: '00:00', close: '00:00', closed: true },
    { day: 1 as const, open: '09:00', close: '17:00' },
    { day: 2 as const, open: '09:00', close: '17:00' },
    { day: 3 as const, open: '09:00', close: '17:00' },
    { day: 4 as const, open: '09:00', close: '17:00' },
    { day: 5 as const, open: '09:00', close: '17:00' },
    { day: 6 as const, open: '09:00', close: '13:00' },
  ],
  note: 'Collection hours are confirmed with your order.',
};

/** Origin only — not listed in checkout POP picker. Exact Maps pin still open. */
export const BUTCHERY_BASE = {
  label: 'Lüneburg Country Butchery (base)',
  areaLabel: 'Paulpietersburg / Lüneburg region',
  mapsPinUrl: null as string | null, // exact Google Maps pin URL not yet provided
} as const;

export const SEED_POPS: readonly PopLocation[] = [
  {
    id: 'ultimate-outdoor-piet-retief',
    code: 'UO-PR',
    name: 'Ultimate Outdoor',
    areaLabel: 'Piet Retief',
    phase: 'P1',
    addressLine1: '18 Smit Street',
    addressLine2: 'ex-Foggerful Megaworld',
    city: 'Piet Retief',
    region: 'Mpumalanga',
    // Approx Piet Retief CBD / Smit St — refine with exact pin later
    geo: { lat: -27.0035, lng: 30.8132 },
    hours: COLLECTION_HOURS,
    collectionInstructions:
      'Bring your collection code and ID. Keep packs cold — collect promptly once marked ready. Site formerly Foggerful Megaworld.',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'brooks-in-the-park-pretoria',
    code: 'BIP-PTA',
    name: 'Brooks in the Park',
    areaLabel: 'Waterkloof, Pretoria',
    phase: 'P2',
    addressLine1: '291 Main Street',
    city: 'Pretoria',
    region: 'Gauteng',
    // Approx Waterkloof / Main St — refine with exact pin later
    geo: { lat: -25.7786, lng: 28.2406 },
    hours: COLLECTION_HOURS,
    collectionInstructions:
      'Bring your collection code and collect promptly once the order is marked ready.',
    isActive: false,
    sortOrder: 2,
  },
  {
    id: 'heidelberg-partner-tbd',
    code: 'HDB-TBD',
    name: 'Heidelberg',
    areaLabel: 'Heidelberg',
    phase: 'P3',
    addressLine1: 'Address TBC',
    city: 'Heidelberg',
    region: 'Gauteng',
    // geo set when the Heidelberg partner and street address are locked
    hours: COLLECTION_HOURS,
    collectionInstructions:
      'Bring your collection code and collect promptly once the order is marked ready.',
    isActive: false,
    sortOrder: 3,
  },
] as const;

/** Demo partner wired to Ultimate Outdoor for UI stubs. */
export const SEED_PARTNER_USER: AuthUser = {
  id: 'user-partner-uo-demo',
  role: 'pop_partner',
  name: 'Demo POP Partner',
  phone: '+27000000000',
  popId: 'ultimate-outdoor-piet-retief',
};

export const SEED_POP_STAFF: readonly PopStaffMembership[] = [
  {
    userId: SEED_PARTNER_USER.id,
    popId: 'ultimate-outdoor-piet-retief',
    active: true,
  },
];

export function activePops(
  pops: readonly PopLocation[] = SEED_POPS,
): PopLocation[] {
  return pops.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPopById(
  id: string,
  pops: readonly PopLocation[] = SEED_POPS,
): PopLocation | undefined {
  return pops.find((p) => p.id === id);
}
