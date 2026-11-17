import { Linking } from 'react-native';
import { PUBLIC_ENV } from '../config/publicEnv';
import { getSupabase, supabaseFunctionsUrl } from '../data/supabaseClient';

export type YocoCheckoutResponse = {
  redirectUrl: string;
  checkoutId: string;
  orderId: string;
  /** Present the first time this checkout is created. Null when a retry reuses it. */
  guestToken: string | null;
};

export type YocoCheckoutDraft = {
  customerName: string;
  phone: string;
  email: string;
  notes?: string;
  popId: string;
  lines: { productId: string; quantity: number }[];
  /** Same id retries the same order instead of creating another one. */
  clientRequestId: string;
};

const GUEST_TOKEN_PREFIX = 'lb-guest-token:';

/**
 * Public test or live key. Expo only inlines EXPO_PUBLIC_* into the client.
 * YOCO_PUBLIC_KEY is the same value when read outside the Metro bundle
 * (Edge Functions and local scripts).
 */
export function yocoPublicKey(
  env: Record<string, string | undefined> = PUBLIC_ENV,
): string {
  return (env.EXPO_PUBLIC_YOCO_PUBLIC_KEY || env.YOCO_PUBLIC_KEY || '').trim();
}

/**
 * Hosted checkout is the only payment path. It starts in test mode when the
 * public key is a pk_test_ key, or when EXPO_PUBLIC_PAYMENTS_MODE is sandbox.
 * The secret (YOCO_SECRET_KEY) stays in the Edge Function.
 */
export function isYocoHostedCheckoutEnabled(
  env: Record<string, string | undefined> = PUBLIC_ENV,
): boolean {
  return Boolean(
    yocoPublicKey(env) && env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
  );
}

export function yocoIsTestMode(
  env: Record<string, string | undefined> = PUBLIC_ENV,
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
  const configured = PUBLIC_ENV.EXPO_PUBLIC_WEB_STORE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  throw new Error(
    'Set EXPO_PUBLIC_WEB_STORE_URL so Yoco can return to the shop from the app.',
  );
}

export function rememberGuestToken(orderId: string, token: string): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(GUEST_TOKEN_PREFIX + orderId, token);
  } catch {
    /* private mode */
  }
}

export function readGuestToken(orderId: string): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(GUEST_TOKEN_PREFIX + orderId);
  } catch {
    return null;
  }
}

/**
 * Creates the order on the server (service role) and opens Yoco hosted checkout.
 * A signed-in customer is attached when a session exists. Guests pay with the
 * anon key and open the confirmation later with the order token only.
 */
export async function createYocoCheckout(
  draft: YocoCheckoutDraft,
): Promise<YocoCheckoutResponse> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const sessionToken = data.session?.access_token;
  const anonKey = PUBLIC_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!anonKey) {
    throw new Error('Payment is not available right now. Please try again in a little while.');
  }
  const origin = webStoreOrigin();
  const response = await fetch(supabaseFunctionsUrl('create-checkout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionToken || anonKey}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: draft.customerName,
      phone: draft.phone,
      email: draft.email,
      notes: draft.notes,
      popId: draft.popId,
      lines: draft.lines,
      clientRequestId: draft.clientRequestId,
      packCheck: true,
      successUrl: `${origin}/checkout/success`,
      cancelUrl: `${origin}/checkout/cancel`,
      failureUrl: `${origin}/checkout/failure`,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    redirectUrl?: string;
    checkoutId?: string;
    orderId?: string;
    guestToken?: string | null;
    error?: string;
  };
  if (!response.ok || !body.redirectUrl || !body.orderId) {
    throw new Error(body.error || 'Yoco checkout could not be started.');
  }
  return {
    redirectUrl: body.redirectUrl,
    checkoutId: body.checkoutId ?? '',
    orderId: body.orderId,
    guestToken: body.guestToken ?? null,
  };
}

export async function openHostedCheckout(redirectUrl: string): Promise<void> {
  if (typeof window !== 'undefined' && window.location) {
    window.location.assign(redirectUrl);
    return;
  }
  await Linking.openURL(redirectUrl);
}
