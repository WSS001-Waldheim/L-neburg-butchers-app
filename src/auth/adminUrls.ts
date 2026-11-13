/** Production shop. Also allow this origin under Supabase Auth redirect URLs. */
export const PRODUCTION_SITE_URL = 'https://luneburg-shop.vercel.app';

export function siteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return PRODUCTION_SITE_URL;
}

/** Page where the reset email asks Karl to type a new password. */
export function adminResetUrl(): string {
  return `${siteOrigin()}/admin/reset-password`;
}
