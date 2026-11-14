import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { isDemoMode } from '../config/demo';
import { isSupabaseConfigured } from '../data/supabaseClient';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';
import { StoreColumn } from './StoreColumn';
import { WoodBackground } from './WoodBackground';

/**
 * Live admin access is a Supabase session whose profile role is admin.
 * The demo role switch only works when Supabase is not configured.
 */
export function canAccessAdmin(
  user: { role: string } | null,
  liveSession: boolean,
): boolean {
  if (isSupabaseConfigured()) {
    return liveSession && user?.role === 'admin';
  }
  return user?.role === 'admin';
}

export function AdminSignIn() {
  const { signIn, requestPasswordReset, loginAs, user, liveSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signedInButNotAdmin = Boolean(
    isSupabaseConfigured() && liveSession && user && user.role !== 'admin',
  );

  const sendReset = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setMessage(
        'Check your email. Open the link on this phone. It brings you back here to choose a password. Supabase’s own mail is slow and rate-limited, so wait a minute before trying again.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the email');
    } finally {
      setBusy(false);
    }
  };

  const submitSignIn = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <WoodBackground>
      <StoreColumn>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>Lüneburg</Text>
          <Text style={styles.heading}>Admin</Text>
          <Text style={styles.body}>
            Orders, prices, and stock. Sign in with your email and password, or email yourself a link to set one.
          </Text>

          {signedInButNotAdmin ? (
            <Text style={styles.error}>
              {user?.email ?? 'This account'} is signed in, but it is not an admin.
            </Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="karl@wssfarming.co.za"
            placeholderTextColor={colors.woodLight}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            autoComplete="current-password"
            placeholderTextColor={colors.woodLight}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PrimaryButton
            label="Sign in"
            onPress={() => {
              void submitSignIn();
            }}
            loading={busy}
            disabled={email.trim().length < 5 || password.length < 6}
            style={{ marginTop: 16 }}
          />
          <PrimaryButton
            label="Email me a link to set/reset my password"
            variant="forest"
            onPress={() => {
              void sendReset();
            }}
            loading={busy}
            disabled={email.trim().length < 5}
            style={{ marginTop: 8 }}
          />

          {!isSupabaseConfigured() && isDemoMode() ? (
            <PrimaryButton
              label="Demo admin (this device only)"
              variant="ghost"
              onPress={() => loginAs('admin')}
              style={{ marginTop: 20 }}
            />
          ) : null}
        </ScrollView>
      </StoreColumn>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  kicker: { ...type.label, color: colors.goldMuted },
  heading: { ...type.hero, color: colors.forestDeep, fontSize: 36, marginTop: 4 },
  body: { ...type.body, color: colors.inkSoft, marginTop: 8 },
  label: {
    ...type.label,
    color: colors.goldMuted,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    ...type.body,
    minHeight: 48,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
  },
  error: { ...type.caption, color: colors.danger, marginTop: 12 },
  message: { ...type.caption, color: colors.forest, marginTop: 12 },
});
