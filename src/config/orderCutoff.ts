/**
 * Collection note for the Piet Retief run.
 * Leave EXPO_PUBLIC_ORDER_CUTOFF empty until Karl confirms the real cut-off.
 * When it is set (for example "Wednesday 12:00 SAST"), that text is shown.
 */

export type OrderCutoffCopy = {
  label: string;
  when: string;
  short: string;
  detail: string;
  /** True only when Karl has supplied EXPO_PUBLIC_ORDER_CUTOFF. */
  confirmed: boolean;
};

const GENERIC: OrderCutoffCopy = {
  label: 'Collection',
  when: 'Order ahead',
  short: 'Order ahead for collection at Ultimate Outdoor, Piet Retief',
  detail:
    'Order ahead for collection at Ultimate Outdoor, 18 Smit Street, Piet Retief. The order cut-off will be shown here once it is confirmed.',
  confirmed: false,
};

export function readOrderCutoff(
  env: Record<string, string | undefined> = process.env,
): OrderCutoffCopy {
  const when = env.EXPO_PUBLIC_ORDER_CUTOFF?.trim();
  if (!when) return GENERIC;
  return {
    label: 'Order cut-off',
    when,
    short: `Order cut-off · ${when} · Collection at Ultimate Outdoor, Piet Retief`,
    detail: `Orders placed by ${when} are packed for collection at Ultimate Outdoor, 18 Smit Street, Piet Retief.`,
    confirmed: true,
  };
}

export const ORDER_CUTOFF = readOrderCutoff();

export const COLD_CHAIN_RULE = {
  title: 'Cold chain — no returns',
  detail:
    'Once this order leaves the butchery it cannot be returned or exchanged, including for an ordering mistake. Collect within 20–24 hours of it being marked ready, and keep the packs cold.',
} as const;
