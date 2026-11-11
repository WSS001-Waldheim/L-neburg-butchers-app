/**
 * Holiday web-store cut-off for the Piet Retief collection run.
 * Shown on the shop, cart, checkout, and help. This is a schedule, not a
 * stock claim — low and out-of-stock cuts still carry their own next-arrival date.
 */
export const ORDER_CUTOFF = {
  label: 'Order cut-off',
  when: 'Wednesday 12:00 SAST',
  short:
    'Order cut-off · Wednesday 12:00 SAST · Friday collection at Ultimate Outdoor, Piet Retief',
  detail:
    'Orders placed by Wednesday 12:00 (South Africa) are packed for Friday collection at Ultimate Outdoor, 18 Smit Street, Piet Retief. Orders after the cut-off go on the next run along the Joburg – Piet Retief – Sodwana / Kosi Bay route.',
} as const;

export const COLD_CHAIN_RULE = {
  title: 'Cold chain — no returns',
  detail:
    'Once this order leaves the butchery it cannot be returned or exchanged, including for an ordering mistake. Collect within 20–24 hours of it being marked ready, and keep the packs cold.',
} as const;
