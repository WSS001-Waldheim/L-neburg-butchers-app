import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { SEED_PARTNER_USER } from '../pop/seedPops';
import type { AuthUser, UserRole } from '../pop/types';
import { fetchProfile } from '../data/remoteStore';
import { getSupabase, isSupabaseConfigured } from '../data/supabaseClient';

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

export function isDemoAccount(user: AuthUser | null): boolean {
  return Boolean(user && DEMO_USERS.some((account) => account.id === user.id));
}

type SignUpInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True once the seed user or the Supabase session has been resolved. */
  ready: boolean;
  /** Signed in against Supabase Auth. Demo role switches are not a live session. */
  liveSession: boolean;
  isLoggedIn: boolean;
  authError: string | null;
  loginAs: (role: UserRole) => void;
  loginUser: (user: AuthUser) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<'signed-in' | 'confirm-email'>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function userFromSession(session: Session | null): Promise<AuthUser | null> {
  if (!session) return null;
  const profile = await fetchProfile(session.user.id);
  if (profile) return profile;
  return {
    id: session.user.id,
    role: 'customer',
    name:
      (session.user.user_metadata?.full_name as string | undefined) ||
      session.user.email ||
      'Customer',
    phone: (session.user.user_metadata?.phone as string | undefined) || '',
    email: session.user.email ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const remote = isSupabaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(remote ? null : SEED_CUSTOMER);
  const [liveSession, setLiveSession] = useState(false);
  const [ready, setReady] = useState(!remote);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!remote) return;
    let cancelled = false;
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) setAuthError(error.message);
        const next = await userFromSession(data.session);
        if (cancelled) return;
        setUser(next);
        setLiveSession(Boolean(next));
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAuthError(error instanceof Error ? error.message : 'Could not restore session');
        setReady(true);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void userFromSession(session).then((next) => {
        if (cancelled) return;
        setUser(next);
        setLiveSession(Boolean(next));
      });
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [remote]);

  const loginAs = useCallback((role: UserRole) => {
    const next = DEMO_USERS.find((account) => account.role === role) ?? SEED_CUSTOMER;
    setLiveSession(false);
    setUser(next);
  }, []);

  const loginUser = useCallback((next: AuthUser) => {
    setLiveSession(false);
    setUser(next);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!remote) {
      throw new Error('Supabase is not configured. Use a demo account on this build.');
    }
    setAuthError(null);
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      throw new Error(error.message);
    }
    const next = await userFromSession(data.session);
    setUser(next);
    setLiveSession(Boolean(next));
  }, [remote]);

  const signUp = useCallback(async (input: SignUpInput) => {
    if (!remote) {
      throw new Error('Supabase is not configured. Use a demo account on this build.');
    }
    setAuthError(null);
    const { data, error } = await getSupabase().auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.name.trim(),
          phone: input.phone.trim(),
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      throw new Error(error.message);
    }
    if (!data.session) return 'confirm-email' as const;
    const next = await userFromSession(data.session);
    setUser(next);
    setLiveSession(Boolean(next));
    return 'signed-in' as const;
  }, [remote]);

  const logout = useCallback(async () => {
    if (remote && liveSession) {
      await getSupabase().auth.signOut();
    }
    setLiveSession(false);
    setUser(null);
  }, [remote, liveSession]);

  const value = useMemo(
    () => ({
      user,
      ready,
      liveSession,
      isLoggedIn: Boolean(user),
      authError,
      loginAs,
      loginUser,
      signIn,
      signUp,
      logout,
      clearAuthError: () => setAuthError(null),
    }),
    [user, ready, liveSession, authError, loginAs, loginUser, signIn, signUp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
