import type { PopApprovalStatus, PopLocation } from './types';
import { SEED_POPS } from './seedPops';

/** Mutable POP list for the pilot (starts as seed, replaced when Supabase loads). */
let pops: PopLocation[] = SEED_POPS.map((p) => normalizePop(p));

export function normalizePop(pop: PopLocation): PopLocation {
  const status: PopApprovalStatus = pop.status;
  return { ...pop, status, isActive: status === 'active' };
}

export function listPops(): PopLocation[] {
  return pops;
}

export function listActivePops(): PopLocation[] {
  return pops
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findPop(id: string): PopLocation | undefined {
  return pops.find((p) => p.id === id);
}

export function replacePops(next: PopLocation[]): void {
  pops = next.map((p) => normalizePop(p));
}

/**
 * Insert or update a POP. Does not force it live — callers pass `status`.
 * Approving a partner application should pass status `approved`.
 */
export function addOrActivatePop(pop: PopLocation): void {
  const next = normalizePop(pop);
  const idx = pops.findIndex((p) => p.id === next.id);
  if (idx >= 0) {
    pops[idx] = { ...pops[idx]!, ...next };
  } else {
    pops = [...pops, next];
  }
}

export function approvePop(id: string): PopLocation {
  const current = pops.find((p) => p.id === id);
  if (!current) throw new Error('Pickup point not found');
  if (current.status === 'pending') {
    const next = normalizePop({ ...current, status: 'approved' });
    pops = pops.map((p) => (p.id === id ? next : p));
    return next;
  }
  return current;
}

/**
 * Activate only after approval. Deactivate returns an active POP to `approved`
 * so it stays approved but disappears from checkout.
 */
export function setPopActive(id: string, isActive: boolean): PopLocation {
  const current = pops.find((p) => p.id === id);
  if (!current) throw new Error('Pickup point not found');
  if (isActive && current.status === 'pending') {
    throw new Error('Approve this pickup point before it can go live.');
  }
  const status: PopApprovalStatus = isActive
    ? 'active'
    : current.status === 'active'
      ? 'approved'
      : current.status;
  const next = normalizePop({ ...current, status });
  pops = pops.map((p) => (p.id === id ? next : p));
  return next;
}
