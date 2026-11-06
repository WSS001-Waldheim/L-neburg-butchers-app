import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  addOrActivatePop as storeAdd,
  findPop as storeFind,
  listActivePops as storeListActive,
  listPops as storeList,
  setPopActive as storeSetActive,
} from '../pop/popStore';
import type { PopLocation } from '../pop/types';

type PopLocationsContextValue = {
  pops: PopLocation[];
  activePops: PopLocation[];
  findPop: (id: string) => PopLocation | undefined;
  setPopActive: (id: string, isActive: boolean) => void;
  addOrActivatePop: (pop: PopLocation) => void;
  refresh: () => void;
};

const PopLocationsContext = createContext<PopLocationsContextValue | null>(
  null
);

export function PopLocationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const pops = useMemo(() => {
    void version;
    return storeList().map((p) => ({ ...p }));
  }, [version]);

  const activePops = useMemo(() => {
    void version;
    return storeListActive().map((p) => ({ ...p }));
  }, [version]);

  const findPop = useCallback(
    (id: string) => {
      void version;
      return storeFind(id);
    },
    [version]
  );

  const setPopActive = useCallback(
    (id: string, isActive: boolean) => {
      storeSetActive(id, isActive);
      refresh();
    },
    [refresh]
  );

  const addOrActivatePop = useCallback(
    (pop: PopLocation) => {
      storeAdd(pop);
      refresh();
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      pops,
      activePops,
      findPop,
      setPopActive,
      addOrActivatePop,
      refresh,
    }),
    [pops, activePops, findPop, setPopActive, addOrActivatePop, refresh]
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
