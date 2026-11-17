/**
 * Pickup copy. There is no order cut-off: the box waits at the pickup point.
 * EXPO_PUBLIC_ORDER_CUTOFF is still listed on PUBLIC_ENV so a leftover host
 * value is inlined, and it is not shown.
 */

export const COLLECTION = {
  label: 'Pickup',
  when: 'Packed in a box — collect whenever suits you',
  short:
    'Your order is packed in a box and waiting for you at your pickup point — collect whenever suits you.',
  detail:
    'Your order is packed in a box and waiting for you at your pickup point — collect whenever suits you.',
} as const;

export const COLD_CHAIN_RULE = {
  title: 'Cold chain — no returns',
  detail:
    'Once this order leaves the butchery it cannot be returned or exchanged, including for an ordering mistake. Keep the packs cold.',
} as const;
