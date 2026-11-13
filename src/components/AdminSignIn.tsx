import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { isDemoMode } from '../config/demo';
import { isSupabaseConfigured } from '../data/supabaseClient';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';
import { StoreColumn } from './StoreColumn';
import { WoodBackground } from './WoodBackground';

type Mode = 'sign-in' | 'set-password';

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
  const { signIn, signUp, requestPasswordReset, loginAs, user, liveSession } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
        'If that email has an account, a link is on its way. Open it on this phone and choose a new password.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the email');
    } finally {
      setBusy(false);
    }
  };

  const choosePassword = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await signUp({
        name: 'Karl',
        phone: '',
        email,
        password,
      });
      if (result === 'confirm-email') {
        setMessage(
          'Check your email and confirm the address, then come back and sign in. Your password is the one you just chose.',
        );
        setPassword('');
        setConfirm('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set the password');
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
            Orders, prices, and stock. Sign in with the email and password you chose.
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

          {mode === 'sign-in' ? (
            <>
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
                disabled={email.trim().length < 5 || password.length < 8}
                style={{ marginTop: 16 }}
              />
              <PrimaryButton
                label="Set / forgot password"
                variant="ghost"
                onPress={() => {
                  setMode('set-password');
                  setError(null);
                  setMessage(null);
                  setPassword('');
                }}
                style={{ marginTop: 8 }}
              />
            </>
          ) : (
            <>
              <Text style={styles.body}>
                First time: choose a password below. It is saved only in Supabase, not in the app.
                Already have one: email yourself a link and set a new password on the next page.
              </Text>
              <Text style={styles.label}>New password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                autoComplete="new-password"
                placeholderTextColor={colors.woodLight}
              />
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                style={styles.input}
                secureTextEntry
                autoComplete="new-password"
                placeholderTextColor={colors.woodLight}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <PrimaryButton
                label="Set my password"
                onPress={() => {
                  void choosePassword();
                }}
                loading={busy}
                disabled={email.trim().length < 5 || password.length < 8}
                style={{ marginTop: 16 }}
              />
              <PrimaryButton
                label="Email me a reset link"
                variant="forest"
                onPress={() => {
                  void sendReset();
                }}
                loading={busy}
                disabled={email.trim().length < 5}
                style={{ marginTop: 8 }}
              />
              <PrimaryButton
                label="Back to sign in"
                variant="ghost"
                onPress={() => {
                  setMode('sign-in');
                  setError(null);
                  setMessage(null);
                }}
                style={{ marginTop: 8 }}
              />
            </>
          )}

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
