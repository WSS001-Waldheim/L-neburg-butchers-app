/**
 * Expo-friendly checkout hook (stub-shaped).
 * Merge into app as `src/payments/useCheckoutPayment.ts`.
 *
 * Usage after pack-check checkbox:
 *   const { methods, pay, busy, error } = useCheckoutPayment();
 *   await pay({ orderId, amountEstimated, customer, method, returnUrl });
 *
 * Uses React state only — no live network. Swap createPaymentProviders
 * wiring when backend + SDKs land.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PaymentProvider } from './PaymentProvider';
import {
  createPaymentProviders,
  readPaymentsEnv,
  type PaymentsEnv,
} from './createPaymentProviders';
import type {
  CheckoutPayInput,
  PaymentMethodKind,
  PaymentResult,
} from './types';

export type UseCheckoutPaymentResult = {
  ready: boolean;
  busy: boolean;
  error: string | null;
  methods: PaymentMethodKind[];
  primaryMethod: PaymentMethodKind | null;
  pay: (input: CheckoutPayInput) => Promise<PaymentResult>;
  /** Clear last error when changing method / retrying. */
  clearError: () => void;
};

function detectPlatform(): PaymentsEnv['platform'] {
  // In app: import { Platform } from 'react-native'
  // Stub default for typecheck outside RN:
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as {
      Platform: { OS: string };
    };
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web';
  } catch {
    return 'web';
  }
}

export function useCheckoutPayment(
  envOverrides?: Partial<PaymentsEnv>,
): UseCheckoutPaymentResult {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [primary, setPrimary] = useState<PaymentProvider | undefined>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = readPaymentsEnv(
        typeof process !== 'undefined' ? process.env : {},
        detectPlatform(),
      );
      const env: PaymentsEnv = { ...base, ...envOverrides };
      const registry = await createPaymentProviders(env);
      if (cancelled) return;
      setProviders(registry.providers);
      setPrimary(registry.primary);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [envOverrides]);

  const methods = useMemo(
    () => providers.map((p) => p.id),
    [providers],
  );

  const pay = useCallback(
    async (input: CheckoutPayInput): Promise<PaymentResult> => {
      setBusy(true);
      setError(null);
      try {
        const provider =
          providers.find((p) => p.id === input.method) ?? primary;
        if (!provider) {
          const result: PaymentResult = {
            ok: false,
            method: input.method,
            status: 'failed',
            message: 'No payment provider available.',
            code: 'NO_PROVIDER',
          };
          setError(result.message);
          return result;
        }

        const session = await provider.createPayment({
          orderId: input.orderId,
          amountEstimated: input.amountEstimated,
          customer: input.customer,
          method: provider.id,
          returnUrl: input.returnUrl,
        });

        let result = await provider.presentPayment(session);
        if (result.ok === false && provider.reconcile) {
          // Deep-link return path may still succeed on reconcile.
          result = await provider.reconcile(session.sessionId);
        }
        if (!result.ok) setError(result.message);
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Payment failed.';
        setError(message);
        return {
          ok: false,
          method: input.method,
          status: 'failed',
          message,
          code: 'EXCEPTION',
        };
      } finally {
        setBusy(false);
      }
    },
    [providers, primary],
  );

  return {
    ready,
    busy,
    error,
    methods,
    primaryMethod: primary?.id ?? null,
    pay,
    clearError: () => setError(null),
  };
}
