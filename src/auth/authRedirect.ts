export type AuthRedirect =
  | { kind: 'none' }
  | { kind: 'error'; message: string }
  | { kind: 'set-password' };

type Captured = {
  hash: URLSearchParams;
  query: URLSearchParams;
};

let captured: Captured | null = null;

/** Read the hash before the Supabase client can clear it. */
export function captureAuthUrl(): void {
  if (captured || typeof window === 'undefined') return;
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  captured = {
    hash: new URLSearchParams(rawHash),
    query: new URLSearchParams(window.location.search),
  };
}

captureAuthUrl();

function param(name: string): string | null {
  if (!captured) return null;
  return captured.hash.get(name) || captured.query.get(name);
}

function decodeMessage(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

export function readAuthRedirect(): AuthRedirect {
  captureAuthUrl();
  if (!captured) return { kind: 'none' };
  const error =
    param('error_description') || param('error_code') || param('error');
  if (error) return { kind: 'error', message: decodeMessage(error) };
  const type = (param('type') || '').toLowerCase();
  if (type === 'invite' || type === 'recovery' || type === 'signup') {
    return { kind: 'set-password' };
  }
  return { kind: 'none' };
}

function stripAuthParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('code');
  url.searchParams.delete('type');
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  const next = `${url.pathname}${url.search}`;
  window.history.replaceState({}, '', next);
}

/**
 * Invite emails from the Supabase dashboard return implicit hash tokens.
 * Password-reset emails may return those tokens or a PKCE ?code=.
 * Both become a session before the hash is removed.
 */
export async function establishSessionFromUrl(): Promise<AuthRedirect> {
  const redirect = readAuthRedirect();
  if (redirect.kind === 'none' || typeof window === 'undefined') return redirect;

  const { getSupabase, isSupabaseConfigured } = await import('../data/supabaseClient');
  if (!isSupabaseConfigured()) {
    stripAuthParams();
    return redirect;
  }
  const supabase = getSupabase();
  const access = captured?.hash.get('access_token');
  const refresh = captured?.hash.get('refresh_token');
  const code = captured?.query.get('code');

  if (redirect.kind === 'error') {
    stripAuthParams();
    return redirect;
  }

  if (access && refresh) {
    const { error } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    stripAuthParams();
    if (error) return { kind: 'error', message: error.message };
    return redirect;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    stripAuthParams();
    if (error) return { kind: 'error', message: error.message };
    return redirect;
  }

  const { data } = await supabase.auth.getSession();
  stripAuthParams();
  if (!data.session) {
    return {
      kind: 'error',
      message: 'The email link did not start a session. Request a new link.',
    };
  }
  return redirect;
}
