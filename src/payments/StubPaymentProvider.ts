/**
 * Demo / CI / missing-keys provider. Always place-order capable.
 * No network. No secrets. Simulates success after a short delay.
 */

import type { PaymentProvider } from './PaymentProvider';
import type {
  CreatePaymentIntent,
  PaymentAvailabilityContext,
  PaymentResult,
  PaymentSession,
} from './types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type StubPaymentProviderOptions = {
  /** Force failure for UI testing. Default false. */
  shouldFail?: boolean;
  /** Simulated sheet delay. Default 400ms. */
  latencyMs?: number;
};

export function createStubPaymentProvider(
  options: StubPaymentProviderOptions = {},
): PaymentProvider {
  const { shouldFail = false, latencyMs = 400 } = options;

  return {
    id: 'stub',

    async isAvailable(ctx: PaymentAvailabilityContext): Promise<boolean> {
      return ctx.paymentsMode === 'stub';
    },

    async createPayment(intent: CreatePaymentIntent): Promise<PaymentSession> {
      return {
        sessionId: `stub_${intent.orderId}_${Date.now()}`,
        method: 'stub',
        amount: intent.amountEstimated,
        clientPayload: { demo: true },
      };
    },

    async presentPayment(session: PaymentSession): Promise<PaymentResult> {
      await delay(latencyMs);
      if (shouldFail) {
        return {
          ok: false,
          sessionId: session.sessionId,
          method: 'stub',
          status: 'failed',
          message: 'Stub payment failed (test flag).',
          code: 'STUB_FAIL',
        };
      }
      return {
        ok: true,
        sessionId: session.sessionId,
        method: 'stub',
        status: 'paid',
        providerReference: `stub_ref_${session.sessionId}`,
        amount: session.amount,
      };
    },

    async reconcile(sessionId: string): Promise<PaymentResult> {
      return {
        ok: true,
        sessionId,
        method: 'stub',
        status: 'paid',
        providerReference: `stub_ref_${sessionId}`,
        amount: { cents: 0, currency: 'ZAR' },
      };
    },
  };
}
