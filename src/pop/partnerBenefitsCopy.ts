/**
 * In-app “Become a POP partner” copy.
 * Commercial terms (discount / margin cut) are TBD — keep placeholders visible.
 */

export type PartnerBenefitItem = {
  id: string;
  title: string;
  body: string;
  /** When true, UI should show a TBD badge / muted style. */
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
 * Placeholder benefits for the app POP partner section.
 * Replace TBD items when Karl locks partner commercial terms.
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
      body: 'Partner purchase discount — details TBD.',
      tbd: true,
    },
    {
      id: 'margin-cut',
      title: 'Margin / commission',
      body: 'Margin cut or collection fee structure — details TBD.',
      tbd: true,
    },
  ],
  ctaLabel: 'Apply to become a partner',
  disclaimer:
    'Applications are reviewed manually by Lüneburg (Karl, Ruben, family, or factory manager). Approval is required before your location appears as a collection point. No automatic approval.',
};

/** Short blurb for POP info tab / marketing strip. */
export const PARTNER_BENEFITS_TEASER =
  'Own a store? Apply to host Lüneburg collections — partner terms (discount / margin) coming soon.';
