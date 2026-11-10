import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PopPartnerApplication } from '../pop/applicationTypes';

type PartnerApplicationsContextValue = {
  applications: PopPartnerApplication[];
  submitApplication: (application: PopPartnerApplication) => void;
  updateApplication: (
    id: string,
    patch: Partial<PopPartnerApplication>
  ) => void;
};

const PartnerApplicationsContext =
  createContext<PartnerApplicationsContextValue | null>(null);

export function PartnerApplicationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [applications, setApplications] = useState<PopPartnerApplication[]>(
    []
  );

  const submitApplication = useCallback(
    (application: PopPartnerApplication) => {
      setApplications((current) => [...current, application]);
    },
    []
  );

  const updateApplication = useCallback(
    (id: string, patch: Partial<PopPartnerApplication>) => {
      setApplications((current) =>
        current.map((application) =>
          application.id === id ? { ...application, ...patch } : application
        )
      );
    },
    []
  );

  const value = useMemo(
    () => ({ applications, submitApplication, updateApplication }),
    [applications, submitApplication, updateApplication]
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
      'usePartnerApplications must be used within PartnerApplicationsProvider'
    );
  }
  return ctx;
}
