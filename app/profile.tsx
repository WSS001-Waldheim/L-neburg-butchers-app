import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth, DEMO_USERS } from '../src/auth/AuthContext';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { WoodBackground } from '../src/components/WoodBackground';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function ProfileScreen() {
  const { user, loginAs, logout } = useAuth();

  return (
    <WoodBackground>
      <View style={styles.content}>
        {user ? (
          <>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>Role: {user.role.replace('_', ' ')}</Text>
            <Text style={styles.meta}>{user.phone}</Text>
            {user.email ? <Text style={styles.meta}>{user.email}</Text> : null}
            {user.popId ? (
              <Text style={styles.meta}>Assigned POP: {user.popId}</Text>
            ) : null}
            <PrimaryButton
              label="Logout"
              variant="forest"
              onPress={logout}
              style={{ marginTop: 24 }}
            />
          </>
        ) : (
          <>
            <Text style={styles.name}>Signed out</Text>
            <Text style={styles.meta}>Pick a demo role to continue.</Text>
          </>
        )}
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
