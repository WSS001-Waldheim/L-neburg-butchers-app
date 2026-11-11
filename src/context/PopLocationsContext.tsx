import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchPops, savePop } from '../data/remoteStore';
import { isSupabaseConfigured } from '../data/supabaseClient';
import {
  addOrActivatePop as storeAdd,
  approvePop as storeApprove,
  findPop as storeFind,
  listActivePops as storeListActive,
  listPops as storeList,
  replacePops,
  setPopActive as storeSetActive,
} from '../pop/popStore';
import type { PopLocation } from '../pop/types';

type PopLocationsContextValue = {
  pops: PopLocation[];
  activePops: PopLocation[];
  mode: 'seed' | 'supabase';
  loading: boolean;
  error: string | null;
  findPop: (id: string) => PopLocation | undefined;
  approvePop: (id: string) => Promise<void>;
  setPopActive: (id: string, isActive: boolean) => Promise<void>;
  addOrActivatePop: (pop: PopLocation) => Promise<void>;
  refresh: () => Promise<void>;
};

const PopLocationsContext = createContext<PopLocationsContextValue | null>(null);

export function PopLocationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode: 'seed' | 'supabase' = isSupabaseConfigured() ? 'supabase' : 'seed';
  const { ready: authReady } = useAuth();
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(mode === 'supabase');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (mode !== 'supabase') {
      setVersion((value) => value + 1);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchPops();
      replacePops(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pickup points');
    } finally {
      setLoading(false);
      setVersion((value) => value + 1);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'supabase' && !authReady) return;
    void refresh();
  }, [mode, authReady, refresh]);

  const pops = useMemo(() => {
    void version;
    return storeList().map((pop) => ({ ...pop }));
  }, [version]);

  const activePops = useMemo(() => {
    void version;
    return storeListActive().map((pop) => ({ ...pop }));
  }, [version]);

  const findPop = useCallback(
    (id: string) => {
      void version;
      return storeFind(id);
    },
    [version],
  );

  const approvePop = useCallback(
    async (id: string) => {
      const next = storeApprove(id);
      if (mode === 'supabase') {
        try {
          await savePop(next);
        } catch (err) {
          await refresh();
          throw err;
        }
      }
      setVersion((value) => value + 1);
    },
    [mode, refresh],
  );

  const setPopActive = useCallback(
    async (id: string, isActive: boolean) => {
      const next = storeSetActive(id, isActive);
      if (mode === 'supabase') {
        try {
          await savePop(next);
        } catch (err) {
          await refresh();
          throw err;
        }
      }
      setVersion((value) => value + 1);
    },
    [mode, refresh],
  );

  const addOrActivatePop = useCallback(
    async (pop: PopLocation) => {
      storeAdd(pop);
      if (mode === 'supabase') {
        const saved = storeFind(pop.id);
        if (saved) {
          try {
            await savePop(saved);
          } catch (err) {
            await refresh();
            throw err;
          }
        }
      }
      setVersion((value) => value + 1);
    },
    [mode, refresh],
  );

  const value = useMemo(
    () => ({
      pops,
      activePops,
      mode,
      loading,
      error,
      findPop,
      approvePop,
      setPopActive,
      addOrActivatePop,
      refresh,
    }),
    [
      pops,
      activePops,
      mode,
      loading,
      error,
      findPop,
      approvePop,
      setPopActive,
      addOrActivatePop,
      refresh,
    ],
  );

  return (
    <PopLocationsContext.Provider value={value}>
      {children}
    </PopLocationsContext.Provider>
  );
}

export function usePopLocations(): PopLocationsContextValue {
  const ctx = useContext(PopLocationsContext);
  if (!ctx) {
    throw new Error('usePopLocations must be used within PopLocationsProvider');
  }
  return ctx;
}
