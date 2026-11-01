/**
 * Factory: pick providers from env. Missing keys → stub only (demo-safe).
 *
 * Env (client-safe):
 *   EXPO_PUBLIC_PAYMENTS_MODE = stub | sandbox | live
 *   EXPO_PUBLIC_APPLE_MERCHANT_ID
 *   EXPO_PUBLIC_YOCO_PUBLIC_KEY
 *   EXPO_PUBLIC_API_BASE_URL
 */

import type { PaymentProvider, PaymentProviderRegistry } from './PaymentProvider';
import { createApplePayPaymentProvider } from './ApplePayPaymentProvider';
import { createStubPaymentProvider } from './StubPaymentProvider';
import { createYocoPaymentProvider } from './YocoPaymentProvider';
import type { PaymentAvailabilityContext } from './types';

export type PaymentsEnv = {
  paymentsMode: PaymentAvailabilityContext['paymentsMode'];
  appleMerchantId?: string;
  yocoPublicKey?: string;
  apiBaseUrl?: string;
  platform: PaymentAvailabilityContext['platform'];
};

export function readPaymentsEnv(
  env: Record<string, string | undefined> = {},
  platform: PaymentAvailabilityContext['platform'] = 'ios',
): PaymentsEnv {
  const mode = (env.EXPO_PUBLIC_PAYMENTS_MODE ?? 'stub') as PaymentsEnv['paymentsMode'];
  return {
    paymentsMode: mode === 'sandbox' || mode === 'live' ? mode : 'stub',
    appleMerchantId: env.EXPO_PUBLIC_APPLE_MERCHANT_ID,
    yocoPublicKey: env.EXPO_PUBLIC_YOCO_PUBLIC_KEY,
    apiBaseUrl: env.EXPO_PUBLIC_API_BASE_URL,
    platform,
  };
}

export async function createPaymentProviders(
  env: PaymentsEnv,
): Promise<PaymentProviderRegistry> {
  const stub = createStubPaymentProvider();
  const apple = createApplePayPaymentProvider({
    merchantId: env.appleMerchantId,
    apiBaseUrl: env.apiBaseUrl,
  });
  const yoco = createYocoPaymentProvider({
    publicKey: env.yocoPublicKey,
    apiBaseUrl: env.apiBaseUrl,
  });

  const ctx: PaymentAvailabilityContext = {
    platform: env.platform,
    paymentsMode: env.paymentsMode,
  };

  const candidates: PaymentProvider[] = [apple, yoco, stub];
  const available: PaymentProvider[] = [];
  for (const p of candidates) {
    if (await p.isAvailable(ctx)) available.push(p);
  }

  // Always ensure at least stub so place-order never dead-ends.
  if (available.length === 0) available.push(stub);

  const primary =
    available.find((p) => p.id === 'apple_pay') ??
    available.find((p) => p.id === 'yoco') ??
    available.find((p) => p.id === 'stub');

  return { providers: available, primary };
}
