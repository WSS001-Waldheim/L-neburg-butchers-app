/**
 * Canonical shop. luneburg-shop.vercel.app still opens the same deployment.
 * Supabase Auth must allow both origins. See docs/WEB_STORE.md.
 */
export const PRODUCTION_SITE_URL = 'https://butchery.wssfarming.co.za';

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
