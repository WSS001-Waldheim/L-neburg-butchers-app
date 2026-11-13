import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StoreColumn } from '../../src/components/StoreColumn';
import { WoodBackground } from '../../src/components/WoodBackground';
import { getSupabase, isSupabaseConfigured } from '../../src/data/supabaseClient';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/**
 * Landing page for the Supabase reset email.
 * Karl types a new password here. The link must be opened on this site.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, liveSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const save = async () => {
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
    try {
      await updatePassword(password);
      setSaved(true);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <WoodBackground>
      <StoreColumn>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>New password</Text>
          <Text style={styles.body}>
            Choose the password you will use to sign in at Admin. It is stored by Supabase, not in the shop code.
          </Text>
          {!isSupabaseConfigured() ? (
            <Text style={styles.error}>Supabase is not connected on this build.</Text>
          ) : null}
          {!ready && !liveSession ? (
            <Text style={styles.body}>
              Open the link in the email on this phone. If it has expired, request a new one from Admin.
            </Text>
          ) : null}
          {saved ? (
            <Text style={styles.ok}>Password saved. Sign in with it on the admin page.</Text>
          ) : (
            <>
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
              <PrimaryButton
                label="Save password"
                onPress={() => {
                  void save();
                }}
                loading={busy}
                disabled={!ready && !liveSession}
                style={{ marginTop: 16 }}
              />
            </>
          )}
          <PrimaryButton
            label="Back to admin"
            variant="ghost"
            onPress={() => router.replace('/admin')}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </StoreColumn>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  heading: { ...type.section, color: colors.forestDeep },
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
  ok: { ...type.body, color: colors.forest, marginTop: 16 },
});
