/**
 * Short spoken collection codes: LB-XXXX (no ambiguous 0/O, 1/I).
 * Default: generate when entering ready_for_collection.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCollectionCode(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? defaultRandom(4);
  let body = '';
  for (let i = 0; i < 4; i++) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `LB-${body}`;
}

export function normalizeCollectionCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export function collectionCodesMatch(
  expected: string | undefined | null,
  provided: string,
): boolean {
  if (!expected) return false;
  return normalizeCollectionCode(expected) === normalizeCollectionCode(provided);
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(out);
    return out;
  }
  for (let i = 0; i < n; i++) {
    out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}
