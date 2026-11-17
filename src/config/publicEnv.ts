/**
 * Expo inlines EXPO_PUBLIC_* only when the name is read as a direct literal
 * (`process.env.EXPO_PUBLIC_FOO`). A dynamic lookup such as `process.env[key]`
 * or passing `process.env` into a function stays empty in the web bundle.
 * Read every public variable here, then import PUBLIC_ENV everywhere else.
 */
export const PUBLIC_ENV: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_YOCO_PUBLIC_KEY: process.env.EXPO_PUBLIC_YOCO_PUBLIC_KEY,
  EXPO_PUBLIC_PAYMENTS_MODE: process.env.EXPO_PUBLIC_PAYMENTS_MODE,
  EXPO_PUBLIC_WEB_STORE_URL: process.env.EXPO_PUBLIC_WEB_STORE_URL,
  EXPO_PUBLIC_APPLE_MERCHANT_ID: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_NOTIFICATIONS_MODE: process.env.EXPO_PUBLIC_NOTIFICATIONS_MODE,
  EXPO_PUBLIC_ORDER_CUTOFF: process.env.EXPO_PUBLIC_ORDER_CUTOFF,
  EXPO_PUBLIC_DEMO: process.env.EXPO_PUBLIC_DEMO,
};
