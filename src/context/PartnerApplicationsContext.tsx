import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchApplications, saveApplication } from '../data/remoteStore';
import { isSupabaseConfigured } from '../data/supabaseClient';
import type { PopPartnerApplication } from '../pop/applicationTypes';

type PartnerApplicationsContextValue = {
  applications: PopPartnerApplication[];
  submitApplication: (application: PopPartnerApplication) => Promise<void>;
  updateApplication: (
    id: string,
    patch: Partial<PopPartnerApplication>,
  ) => Promise<void>;
};

const PartnerApplicationsContext =
  createContext<PartnerApplicationsContextValue | null>(null);

export function PartnerApplicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const remote = isSupabaseConfigured();
  const { ready } = useAuth();
  const [applications, setApplications] = useState<PopPartnerApplication[]>([]);

  useEffect(() => {
    if (!remote || !ready) return;
    let cancelled = false;
    fetchApplications()
      .then((rows) => {
        if (!cancelled) setApplications(rows);
      })
      .catch(() => {
        /* applications stay local if the table is not reachable yet */
      });
    return () => {
      cancelled = true;
    };
  }, [remote, ready]);

  const submitApplication = useCallback(
    async (application: PopPartnerApplication) => {
      if (remote) await saveApplication(application);
      setApplications((current) => [...current, application]);
    },
    [remote],
  );

  const updateApplication = useCallback(
    async (id: string, patch: Partial<PopPartnerApplication>) => {
      let next: PopPartnerApplication | undefined;
      setApplications((current) =>
        current.map((application) => {
          if (application.id !== id) return application;
          next = { ...application, ...patch };
          return next;
        }),
      );
      if (remote && next) await saveApplication(next);
    },
    [remote],
  );

  const value = useMemo(
    () => ({ applications, submitApplication, updateApplication }),
    [applications, submitApplication, updateApplication],
  );

  return (
    <PartnerApplicationsContext.Provider value={value}>
      {children}
    </PartnerApplicationsContext.Provider>
  );
}

export function usePartnerApplications(): PartnerApplicationsContextValue {
  const ctx = useContext(PartnerApplicationsContext);
  if (!ctx) {
    throw new Error(
      'usePartnerApplications must be used within PartnerApplicationsProvider',
    );
  }
  return ctx;
}
