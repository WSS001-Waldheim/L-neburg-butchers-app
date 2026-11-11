import { Linking } from 'react-native';
import { getSupabase, supabaseFunctionsUrl } from '../data/supabaseClient';

export type YocoCheckoutResponse = {
  redirectUrl: string;
  checkoutId: string;
};

/**
 * Hosted Yoco Checkout is on when the public test/live key, Supabase URL,
 * and payments mode sandbox|live are all set. The secret stays in the Edge Function.
 */
export function isYocoHostedCheckoutEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const mode = env.EXPO_PUBLIC_PAYMENTS_MODE;
  const sandboxOrLive = mode === 'sandbox' || mode === 'live';
  return Boolean(
    sandboxOrLive &&
      env.EXPO_PUBLIC_YOCO_PUBLIC_KEY?.trim() &&
      env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
  );
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
