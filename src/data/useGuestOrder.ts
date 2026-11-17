import { useEffect, useState } from 'react';
import { fetchOrderByGuestToken } from './remoteStore';
import { isSupabaseConfigured } from './supabaseClient';
import type { Order } from './types';

/**
 * Loads the single order a guest token opens. Polls twice so the Yoco
 * webhook can move it to paid after the browser returns.
 */
export function useGuestOrder(
  token: string | null | undefined,
  poll = false,
): { order: Order | null; loading: boolean } {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(token && isSupabaseConfigured()));

  useEffect(() => {
    const trimmed = token?.trim() ?? '';
    if (trimmed.length < 32 || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const row = await fetchOrderByGuestToken(trimmed);
        if (!cancelled) setOrder(row);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    if (!poll) {
      return () => {
        cancelled = true;
      };
    }
    const timers = [3000, 8000].map((ms) => setTimeout(() => void load(), ms));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [token, poll]);

  return { order, loading };
}
