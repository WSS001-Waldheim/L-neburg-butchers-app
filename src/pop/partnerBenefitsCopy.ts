/**
 * In-app “Become a POP partner” copy.
 * Commercial terms stay general until Karl locks the partner offer.
 */

export type PartnerBenefitItem = {
  id: string;
  title: string;
  body: string;
  /** Kept for older callers. Do not render this as customer-facing copy. */
  tbd?: boolean;
};

export type PartnerBenefitsCopy = {
  sectionTitle: string;
  headline: string;
  intro: string;
  benefits: PartnerBenefitItem[];
  ctaLabel: string;
  disclaimer: string;
};

/**
 * Benefits of becoming a POP. Commercial detail is confirmed after approval.
 */
export const PARTNER_BENEFITS_COPY: PartnerBenefitsCopy = {
  sectionTitle: 'Become a collection partner',
  headline: 'Host Lüneburg pickup at your store',
  intro:
    'Join the Point of Pickup network. Customers order premium steaks and sausages in the app and collect from your location — you handle hand-over only.',
  benefits: [
    {
      id: 'footfall',
      title: 'Extra footfall',
      body: 'Customers visit your store to collect orders, with a short collection code and clear instructions.',
    },
    {
      id: 'simple-handover',
      title: 'Simple hand-over tools',
      body: 'See only the orders assigned to your location. Mark collected or no-show — no pricing or full admin access.',
    },
    {
      id: 'partner-discount',
      title: 'Partner discount',
      body: 'Partner purchase terms are confirmed when your application is approved.',
    },
    {
      id: 'margin-cut',
      title: 'Margin / commission',
      body: 'Any collection arrangement is agreed with you after approval.',
    },
  ],
  ctaLabel: 'Apply to become a partner',
  disclaimer:
    'Applications are reviewed manually by Lüneburg (Karl, Ruben, family, or factory manager). Approval is required before your location appears as a collection point. No automatic approval.',
};

/** Short blurb for POP info tab / marketing strip. */
export const PARTNER_BENEFITS_TEASER =
  'Own a store? Apply to host Lüneburg collections — partner terms (discount / margin) coming soon.';
