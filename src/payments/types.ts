/**
 * Payment + order money fields for Lüneburg checkout.
 * Merge `OrderPaymentFields` into app `src/data/types.ts` Order type.
 * Currency is always ZAR for first release.
 */

export type MoneyZAR = {
  /** Integer cents to avoid float drift, e.g. R149.90 → 14990 */
  cents: number;
  currency: 'ZAR';
};

export type PaymentMethodKind = 'apple_pay' | 'yoco' | 'stub';

export type PaymentStatus =
  | 'none'
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'adjusted'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type CreatePaymentIntent = {
  orderId: string;
  /** Estimated total from cart (approx pack weights). */
  amountEstimated: MoneyZAR;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  method: PaymentMethodKind;
  /** Deep link / universal link back into Expo Router, e.g. luneburg://order/... */
  returnUrl: string;
  metadata?: Record<string, string>;
};

export type PaymentSession = {
  sessionId: string;
  method: PaymentMethodKind;
  /** Provider client secret / checkout URL / Apple Pay request payload */
  clientPayload: Record<string, unknown>;
  amount: MoneyZAR;
  expiresAt?: string;
};

export type PaymentResult =
  | {
      ok: true;
      sessionId: string;
      method: PaymentMethodKind;
      status: Extract<PaymentStatus, 'authorized' | 'paid'>;
      providerReference: string;
      amount: MoneyZAR;
    }
  | {
      ok: false;
      sessionId?: string;
      method: PaymentMethodKind;
      status: Extract<PaymentStatus, 'failed' | 'cancelled'>;
      message: string;
      code?: string;
    };

export type PaymentAvailabilityContext = {
  platform: 'ios' | 'android' | 'web';
  /** When false, only stub should report available (demo builds). */
  paymentsMode: 'stub' | 'sandbox' | 'live';
};

/** Fields to add on Order (scaffold currently has unpaid mock orders). */
export type OrderPaymentFields = {
  paymentMethod?: PaymentMethodKind;
  paymentStatus: PaymentStatus;
  amountEstimated: MoneyZAR;
  /** Set after pack weigh-in / final invoice. */
  amountFinal?: MoneyZAR;
  paymentSessionId?: string;
  paymentProviderReference?: string;
  paidAt?: string;
};

export type CheckoutPayInput = {
  orderId: string;
  amountEstimated: MoneyZAR;
  customer: CreatePaymentIntent['customer'];
  method: PaymentMethodKind;
  returnUrl: string;
};
