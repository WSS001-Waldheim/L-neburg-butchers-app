import { Linking } from 'react-native';
import { getSupabase, supabaseFunctionsUrl } from '../data/supabaseClient';

export type YocoCheckoutResponse = {
  redirectUrl: string;
  checkoutId: string;
};

/**
 * Public test or live key. Expo only inlines EXPO_PUBLIC_* into the client.
 * YOCO_PUBLIC_KEY is the same value when read outside the Metro bundle
 * (Edge Functions and local scripts).
 */
export function yocoPublicKey(
  env: Record<string, string | undefined> = process.env,
): string {
  return (env.EXPO_PUBLIC_YOCO_PUBLIC_KEY || env.YOCO_PUBLIC_KEY || '').trim();
}

/**
 * Hosted checkout is the only payment path. It starts in test mode when the
 * public key is a pk_test_ key. No separate on/off flag.
 * The secret (YOCO_SECRET_KEY) stays in the Edge Function.
 */
export function isYocoHostedCheckoutEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(
    yocoPublicKey(env) && env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
  );
}

export function yocoIsTestMode(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const mode = env.EXPO_PUBLIC_PAYMENTS_MODE?.trim();
  if (mode === 'live') return false;
  const key = yocoPublicKey(env);
  if (key.startsWith('pk_live_')) return false;
  return true;
}

export function webStoreOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const configured = process.env.EXPO_PUBLIC_WEB_STORE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  throw new Error(
    'Set EXPO_PUBLIC_WEB_STORE_URL so Yoco can return to the shop from the app.',
  );
}

export async function createYocoCheckout(orderId: string): Promise<YocoCheckoutResponse> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Sign in before paying.');
  }
  const origin = webStoreOrigin();
  const query = `orderId=${encodeURIComponent(orderId)}`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const response = await fetch(supabaseFunctionsUrl('create-checkout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      successUrl: `${origin}/checkout/success?${query}`,
      cancelUrl: `${origin}/checkout/cancel?${query}`,
      failureUrl: `${origin}/checkout/failure?${query}`,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    redirectUrl?: string;
    checkoutId?: string;
    error?: string;
  };
  if (!response.ok || !body.redirectUrl) {
    throw new Error(body.error || 'Yoco checkout could not be started.');
  }
  return { redirectUrl: body.redirectUrl, checkoutId: body.checkoutId ?? '' };
}

export async function redirectToYoco(orderId: string): Promise<void> {
  const { redirectUrl } = await createYocoCheckout(orderId);
  if (typeof window !== 'undefined' && window.location) {
    window.location.assign(redirectUrl);
    return;
  }
  await Linking.openURL(redirectUrl);
}
