/**
 * Yoco adapter (SA cards, iOS + Android). Architecture stub — no live API calls.
 *
 * When wiring for real builds:
 * - EXPO_PUBLIC_YOCO_PUBLIC_KEY in client; YOCO_SECRET_KEY only on backend
 * - createPayment → backend creates Yoco checkout / payment; returns redirect URL or SDK token
 * - presentPayment → open checkout URL (WebBrowser / SDK) then deep-link return
 * - reconcile → GET backend session status after return
 * - Webhooks update Order.paymentStatus (source of truth)
 */

import type { PaymentProvider } from './PaymentProvider';
import type {
  CreatePaymentIntent,
  PaymentAvailabilityContext,
  PaymentResult,
  PaymentSession,
} from './types';

export type YocoPaymentProviderOptions = {
  publicKey: string | undefined;
  apiBaseUrl: string | undefined;
  /** Open Yoco hosted checkout or native SDK UI. */
  presentYocoCheckout?: (session: PaymentSession) => Promise<PaymentResult>;
  /** Confirm after deep link. */
  fetchSessionStatus?: (sessionId: string) => Promise<PaymentResult>;
};

export function createYocoPaymentProvider(
  options: YocoPaymentProviderOptions,
): PaymentProvider {
  const {
    publicKey,
    apiBaseUrl,
    presentYocoCheckout,
    fetchSessionStatus,
  } = options;

  return {
    id: 'yoco',

    async isAvailable(ctx: PaymentAvailabilityContext): Promise<boolean> {
      if (ctx.paymentsMode === 'stub') return false;
      if (!publicKey) return false;
      // Web can use hosted checkout later; first release focuses on native stores.
      if (ctx.platform === 'web') return false;
      return typeof presentYocoCheckout === 'function' || Boolean(apiBaseUrl);
    },

    async createPayment(intent: CreatePaymentIntent): Promise<PaymentSession> {
      if (!apiBaseUrl) {
        throw new Error(
          'Yoco: EXPO_PUBLIC_API_BASE_URL required to create checkout sessions.',
        );
      }
      // Placeholder — replace with authenticated backend create.
      const sessionId = `yoco_pending_${intent.orderId}`;
      return {
        sessionId,
        method: 'yoco',
        amount: intent.amountEstimated,
        clientPayload: {
          publicKey,
          returnUrl: intent.returnUrl,
          // checkoutUrl filled by real API response
          checkoutUrl: null,
        },
      };
    },

    async presentPayment(session: PaymentSession): Promise<PaymentResult> {
      if (!presentYocoCheckout) {
        return {
          ok: false,
          sessionId: session.sessionId,
          method: 'yoco',
          status: 'failed',
          message: 'Yoco checkout UI not wired yet.',
          code: 'YOCO_NOT_WIRED',
        };
      }
      return presentYocoCheckout(session);
    },

    async reconcile(sessionId: string): Promise<PaymentResult> {
      if (!fetchSessionStatus) {
        return {
          ok: false,
          sessionId,
          method: 'yoco',
          status: 'failed',
          message: 'Yoco reconcile not wired yet.',
          code: 'YOCO_RECONCILE_NOT_WIRED',
        };
      }
      return fetchSessionStatus(sessionId);
    },
  };
}
