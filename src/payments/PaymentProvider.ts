/**
 * Canonical payment port for Lüneburg checkout.
 * Apple Pay + Yoco + Stub all implement this — checkout never imports SDKs directly.
 */

import type {
  CreatePaymentIntent,
  PaymentAvailabilityContext,
  PaymentMethodKind,
  PaymentResult,
  PaymentSession,
} from './types';

export interface PaymentProvider {
  readonly id: PaymentMethodKind;

  /** Whether this method should appear on the Pay step. */
  isAvailable(ctx: PaymentAvailabilityContext): Promise<boolean>;

  /** Server (or stub) creates a session / PaymentRequest / Yoco checkout. */
  createPayment(intent: CreatePaymentIntent): Promise<PaymentSession>;

  /** Present native sheet or open Yoco checkout; resolve when user finishes. */
  presentPayment(session: PaymentSession): Promise<PaymentResult>;

  /**
   * Optional: after browser/deep-link return, confirm final status with backend.
   * Yoco typically needs this; Apple Pay often completes inside presentPayment.
   */
  reconcile?(sessionId: string): Promise<PaymentResult>;
}

export type PaymentProviderRegistry = {
  providers: PaymentProvider[];
  /** Prefer for one-tap primary CTA when available. */
  primary?: PaymentProvider;
};
