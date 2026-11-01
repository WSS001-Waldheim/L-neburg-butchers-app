import { SEED_POPS } from './seedPops';
import type { PopLocation } from './types';

/** Mutable POP list for the pilot (starts as seed). */
let pops: PopLocation[] = SEED_POPS.map((p) => ({ ...p }));

export function listPops(): PopLocation[] {
  return pops;
}

export function listActivePops(): PopLocation[] {
  return pops.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findPop(id: string): PopLocation | undefined {
  return pops.find((p) => p.id === id);
}

export function addOrActivatePop(pop: PopLocation): void {
  const idx = pops.findIndex((p) => p.id === pop.id);
  if (idx >= 0) {
    pops[idx] = { ...pops[idx]!, ...pop, isActive: true };
  } else {
    pops = [...pops, { ...pop, isActive: true }];
  }
}

export function setPopActive(id: string, isActive: boolean): void {
  pops = pops.map((p) => (p.id === id ? { ...p, isActive } : p));
}
