import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Live catalogue, orders, and auth when both public env vars are set.
 * Missing either value keeps the app on the in-memory seed (demo).
 * The anon key is public. The service role and Yoco secret never belong here.
 */
export function isSupabaseConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(
    env.EXPO_PUBLIC_SUPABASE_URL?.trim() &&
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      if (typeof localStorage === 'undefined') return Promise.resolve(null);
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {
      /* private mode */
    }
    return Promise.resolve();
  },
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: webStorage,
      },
    });
  }
  return client;
}

export function supabaseFunctionsUrl(name: string): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!url) throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set');
  return `${url}/functions/v1/${name}`;
}
