/**
 * Helpers to merge payment results into scaffold Order records.
 * CartContext currently stores in-memory unpaid orders — call applyPaymentResult
 * after successful pay() before navigating to order/[id].
 */

import type { OrderPaymentFields, PaymentResult, MoneyZAR } from './types';

export function unpaidPaymentFields(amountEstimated: MoneyZAR): OrderPaymentFields {
  return {
    paymentStatus: 'none',
    amountEstimated,
  };
}

export function applyPaymentResult(
  current: OrderPaymentFields,
  result: PaymentResult,
): OrderPaymentFields {
  if (!result.ok) {
    return {
      ...current,
      paymentMethod: result.method,
      paymentStatus: result.status,
      paymentSessionId: result.sessionId,
    };
  }
  return {
    ...current,
    paymentMethod: result.method,
    paymentStatus: result.status,
    paymentSessionId: result.sessionId,
    paymentProviderReference: result.providerReference,
    amountEstimated: result.amount,
    paidAt: new Date().toISOString(),
  };
}

/** After yard weigh-in (backend later). */
export function applyFinalAmount(
  current: OrderPaymentFields,
  amountFinal: MoneyZAR,
): OrderPaymentFields {
  const same = amountFinal.cents === current.amountEstimated.cents;
  return {
    ...current,
    amountFinal,
    paymentStatus: same
      ? current.paymentStatus === 'authorized'
        ? 'paid'
        : current.paymentStatus
      : 'adjusted',
  };
}
