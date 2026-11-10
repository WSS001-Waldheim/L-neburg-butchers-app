/**
 * Customer-visible POP lines. Internal notes that still say TBD/TBC stay off screen.
 */
export function customerVisibleLine(text?: string | null): string | null {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return null;
  if (/\bTBD\b/i.test(trimmed) || /\bTBC\b/i.test(trimmed)) return null;
  return trimmed;
}

export function customerHoursLine(note?: string | null): string {
  return (
    customerVisibleLine(note) ??
    'Collection hours are confirmed with your order.'
  );
}
