import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

/**
 * Email + password against Supabase Auth. Roles other than customer are
 * assigned in the database — signing up always creates a customer.
 */
export function AccountForm() {
  const { signIn, signUp, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    clearAuthError();
    try {
      if (mode === 'in') {
        await signIn(email, password);
      } else {
        const result = await signUp({ name, phone, email, password });
        if (result === 'confirm-email') {
          setMessage('Check your email to confirm the account, then sign in.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>
        {mode === 'in' ? 'Sign in' : 'Create an account'}
      </Text>
      {mode === 'up' ? (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoComplete="name"
            placeholderTextColor={colors.woodLight}
          />
          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
            placeholderTextColor={colors.woodLight}
          />
        </>
      ) : null}
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholderTextColor={colors.woodLight}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        placeholderTextColor={colors.woodLight}
      />
      {error || authError ? (
        <Text style={styles.error}>{error || authError}</Text>
      ) : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <PrimaryButton
        label={mode === 'in' ? 'Sign in' : 'Create account'}
        onPress={() => {
          void submit();
        }}
        loading={busy}
        disabled={email.trim().length < 3 || password.length < 6}
        style={{ marginTop: 16 }}
      />
      <PrimaryButton
        label={mode === 'in' ? 'Need an account?' : 'Already have an account?'}
        variant="ghost"
        onPress={() => {
          setMode(mode === 'in' ? 'up' : 'in');
          setError(null);
          setMessage(null);
        }}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 420 },
  heading: { ...type.section, color: colors.forestDeep, marginBottom: 8 },
  label: {
    ...type.label,
    color: colors.goldMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
  },
  error: { ...type.caption, color: colors.danger, marginTop: 10 },
  message: { ...type.caption, color: colors.forest, marginTop: 10 },
});
