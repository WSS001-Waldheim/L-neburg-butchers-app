import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  SEED_PARTNER_USER,
} from '../pop/seedPops';
import type { AuthUser, UserRole } from '../pop/types';

const SEED_CUSTOMER: AuthUser = {
  id: 'user-customer-demo',
  role: 'customer',
  name: 'Demo Customer',
  phone: '+27820000001',
  email: 'demo@luneburg.example',
};

const SEED_ADMIN: AuthUser = {
  id: 'user-admin-karl',
  role: 'admin',
  name: 'Karl (Admin)',
  phone: '+27820000002',
  email: 'karl@luneburg.example',
};

export const DEMO_USERS: AuthUser[] = [
  SEED_CUSTOMER,
  SEED_PARTNER_USER,
  SEED_ADMIN,
];

type AuthContextValue = {
  user: AuthUser | null,
  isLoggedIn: boolean,
  loginAs: (role: UserRole) => void;
  loginUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(SEED_CUSTOMER);

  const loginAs = useCallback((role: UserRole) => {
    const next = DEMO_USERS.find((u) => u.role === role) ?? SEED_CUSTOMER;
    setUser(next);
  }, []);

  const loginUser = useCallback((u: AuthUser) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      loginAs,
      loginUser,
      logout,
    }),
    [user, loginAs, loginUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
