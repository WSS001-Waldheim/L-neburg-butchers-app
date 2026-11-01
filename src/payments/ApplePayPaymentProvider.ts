/**
 * Apple Pay adapter (iOS). Architecture stub — no live PassKit calls.
 *
 * When wiring for real builds:
 * - Add merchant ID capability + EXPO_PUBLIC_APPLE_MERCHANT_ID
 * - Implement presentPayment via native Apple Pay sheet (PassKit / payment SDK)
 * - createPayment should hit backend POST /payments/intents { method: 'apple_pay' }
 * - Never put processing certs or secret keys in the app
 *
 * Until keys + native module exist, isAvailable returns false so checkout hides the button.
 */

import type { PaymentProvider } from './PaymentProvider';
import type {
  CreatePaymentIntent,
  PaymentAvailabilityContext,
  PaymentResult,
  PaymentSession,
} from './types';

export type ApplePayPaymentProviderOptions = {
  merchantId: string | undefined;
  apiBaseUrl: string | undefined;
  /** Inject native present fn when SDK is installed. */
  presentApplePaySheet?: (session: PaymentSession) => Promise<PaymentResult>;
};

export function createApplePayPaymentProvider(
  options: ApplePayPaymentProviderOptions,
): PaymentProvider {
  const { merchantId, apiBaseUrl, presentApplePaySheet } = options;

  return {
    id: 'apple_pay',

    async isAvailable(ctx: PaymentAvailabilityContext): Promise<boolean> {
      if (ctx.platform !== 'ios') return false;
      if (ctx.paymentsMode === 'stub') return false;
      if (!merchantId) return false;
      // Real impl: also check device canMakePayments / active card.
      return typeof presentApplePaySheet === 'function';
    },

    async createPayment(intent: CreatePaymentIntent): Promise<PaymentSession> {
      if (!apiBaseUrl) {
        throw new Error(
          'Apple Pay: EXPO_PUBLIC_API_BASE_URL required to create payment intents.',
        );
      }
      // Placeholder — replace with fetch(`${apiBaseUrl}/payments/intents`, ...)
      const sessionId = `apple_pending_${intent.orderId}`;
      return {
        sessionId,
        method: 'apple_pay',
        amount: intent.amountEstimated,
        clientPayload: {
          merchantId,
          countryCode: 'ZA',
          currencyCode: 'ZAR',
          // label shown on sheet, e.g. "Lüneburg Country Butchery"
          merchantName: 'Lüneburg Country Butchery',
        },
      };
    },

    async presentPayment(session: PaymentSession): Promise<PaymentResult> {
      if (!presentApplePaySheet) {
        return {
          ok: false,
          sessionId: session.sessionId,
          method: 'apple_pay',
          status: 'failed',
          message: 'Apple Pay native module not wired yet.',
          code: 'APPLE_PAY_NOT_WIRED',
        };
      }
      return presentApplePaySheet(session);
    },
  };
}
