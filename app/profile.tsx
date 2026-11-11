import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DEMO_USERS, isDemoAccount, useAuth } from '../src/auth/AuthContext';
import { AccountForm } from '../src/components/AccountForm';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { WoodBackground } from '../src/components/WoodBackground';
import { isDemoMode } from '../src/config/demo';
import { isSupabaseConfigured } from '../src/data/supabaseClient';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function ProfileScreen() {
  const { user, loginAs, logout, liveSession } = useAuth();
  const showDemo = isDemoMode();
  const showAccountDetails = Boolean(user && (showDemo || !isDemoAccount(user)));

  return (
    <WoodBackground>
      <View style={styles.content}>
        {user ? (
          <>
            <Text style={styles.name}>
              {showAccountDetails ? user.name : 'Signed in'}
            </Text>
            {showAccountDetails ? (
              <>
                <Text style={styles.meta}>
                  Role: {user.role.replace('_', ' ')}
                </Text>
                <Text style={styles.meta}>{user.phone}</Text>
                {user.email ? (
                  <Text style={styles.meta}>{user.email}</Text>
                ) : null}
                {user.popId ? (
                  <Text style={styles.meta}>Assigned POP: {user.popId}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.meta}>
                Your orders and pickup details stay with this phone.
              </Text>
            )}
            <PrimaryButton
              label="Logout"
              variant="forest"
              onPress={() => {
                void logout();
              }}
              style={{ marginTop: 24 }}
            />
          </>
        ) : (
          <>
            <Text style={styles.name}>Signed out</Text>
            <Text style={styles.meta}>
              {isSupabaseConfigured()
                ? 'Sign in to order, or create a customer account.'
                : 'Continue from checkout when you are ready to order.'}
            </Text>
            {isSupabaseConfigured() ? <AccountForm /> : null}
          </>
        )}
        {liveSession ? (
          <Text style={styles.meta}>Shop account</Text>
        ) : null}
        {showDemo ? (
          <>
            <Text style={styles.demo}>Demo accounts</Text>
            {DEMO_USERS.map((u) => (
              <PrimaryButton
                key={u.id}
                label={`${u.name} (${u.role})`}
                variant="ghost"
                onPress={() => loginAs(u.role)}
                style={{ marginTop: 8 }}
              />
            ))}
          </>
        ) : null}
      </View>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  name: { ...type.hero, color: colors.forestDeep },
  meta: { ...type.body, color: colors.inkSoft, marginTop: 6 },
  demo: {
    ...type.label,
    color: colors.goldMuted,
    marginTop: 28,
    marginBottom: 4,
  },
});
