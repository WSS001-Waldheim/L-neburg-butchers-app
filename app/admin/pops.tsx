import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { isDemoMode } from '../../src/config/demo';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function AdminPopsScreen() {
  const { user, loginAs } = useAuth();
  const { pops, approvePop, setPopActive } = usePopLocations();
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== 'admin') {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Admin only.</Text>
        {isDemoMode() ? (
          <PrimaryButton label="Login as admin" onPress={() => loginAs('admin')} />
        ) : null}
      </WoodBackground>
    );
  }

  const sorted = [...pops].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>POP locations</Text>
        <Text style={styles.hint}>
          Every pickup point needs your approval. Customers only see points
          that are approved and active. Deactivating keeps the approval.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sorted.map((pop) => (
          <View key={pop.id} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{pop.name}</Text>
              <View
                style={[
                  styles.badge,
                  pop.status === 'active'
                    ? styles.badgeOn
                    : pop.status === 'approved'
                      ? styles.badgeApproved
                      : styles.badgeOff,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    pop.status === 'active'
                      ? styles.badgeTextOn
                      : styles.badgeTextOff,
                  ]}
                >
                  {pop.status === 'active'
                    ? 'Active'
                    : pop.status === 'approved'
                      ? 'Approved'
                      : 'Pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {pop.addressLine1}
              {pop.addressLine2 ? `, ${pop.addressLine2}` : ''} · {pop.city}
            </Text>
            <Text style={styles.meta}>
              Phase {pop.phase} · {pop.areaLabel}
              {pop.geo
                ? ` · ${pop.geo.lat.toFixed(2)}, ${pop.geo.lng.toFixed(2)}`
                : ' · geo TBD'}
            </Text>
            <Text style={styles.meta}>{pop.collectionInstructions}</Text>
            <View style={styles.actions}>
              {pop.status === 'pending' ? (
                <Pressable
                  style={[styles.toggle, styles.toggleOn]}
                  onPress={() => {
                    void approvePop(pop.id).catch((err: unknown) => {
                      setError(
                        err instanceof Error ? err.message : 'Could not approve',
                      );
                    });
                  }}
                >
                  <Text style={styles.toggleText}>Approve</Text>
                </Pressable>
              ) : null}
              {pop.status === 'approved' ? (
                <Pressable
                  style={[styles.toggle, styles.toggleOn]}
                  onPress={() => {
                    void setPopActive(pop.id, true).catch((err: unknown) => {
                      setError(
                        err instanceof Error ? err.message : 'Could not activate',
                      );
                    });
                  }}
                >
                  <Text style={styles.toggleText}>Activate</Text>
                </Pressable>
              ) : null}
              {pop.status === 'active' ? (
                <Pressable
                  style={[styles.toggle, styles.toggleOff]}
                  onPress={() => {
                    void setPopActive(pop.id, false).catch((err: unknown) => {
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Could not deactivate',
                      );
                    });
                  }}
                >
                  <Text style={styles.toggleText}>Deactivate</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: { ...type.body, color: colors.inkSoft },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  error: { ...type.caption, color: colors.danger, marginBottom: 8 },
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  name: { ...type.title, color: colors.forestDeep, fontSize: 20, flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeOn: {
    borderColor: colors.success,
    backgroundColor: 'rgba(47,93,58,0.12)',
  },
  badgeApproved: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(201,162,39,0.16)',
  },
  badgeOff: {
    borderColor: colors.woodLight,
    backgroundColor: 'rgba(107,68,35,0.08)',
  },
  badgeText: { ...type.caption },
  badgeTextOn: { color: colors.success },
  badgeTextOff: { color: colors.inkSoft },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  toggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleOn: { backgroundColor: colors.forest },
  toggleOff: { backgroundColor: colors.wood },
  toggleText: { ...type.bodyStrong, color: colors.white },
});
