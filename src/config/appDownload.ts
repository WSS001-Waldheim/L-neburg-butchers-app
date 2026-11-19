import { PRODUCTION_SITE_URL } from '../auth/adminUrls';

/**
 * Shop link for the share QR and the native share sheet.
 * Always the canonical domain, even when the page was opened on vercel.app.
 */
export const APP_DOWNLOAD_URL = PRODUCTION_SITE_URL;
