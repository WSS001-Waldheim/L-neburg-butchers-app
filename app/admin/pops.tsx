import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function AdminPopsScreen() {
  const { user, loginAs } = useAuth();
  const { pops, setPopActive } = usePopLocations();

  if (!user || user.role !== 'admin') {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Admin only.</Text>
        <PrimaryButton label="Login as admin" onPress={() => loginAs('admin')} />
      </WoodBackground>
    );
  }

  const sorted = [...pops].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>POP locations</Text>
        <Text style={styles.hint}>
          Only active POPs appear at checkout and in nearest-GPS suggestions.
          Deactivate without deleting history.
        </Text>

        {sorted.map((pop) => (
          <View key={pop.id} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{pop.name}</Text>
              <View
                style={[
                  styles.badge,
                  pop.isActive ? styles.badgeOn : styles.badgeOff,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    pop.isActive ? styles.badgeTextOn : styles.badgeTextOff,
                  ]}
                >
                  {pop.isActive ? 'Active' : 'Inactive'}
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
            <Pressable
              style={[
                styles.toggle,
                pop.isActive ? styles.toggleOff : styles.toggleOn,
              ]}
              onPress={() => setPopActive(pop.id, !pop.isActive)}
            >
              <Text style={styles.toggleText}>
                {pop.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </Pressable>
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
  badgeOff: {
    borderColor: colors.woodLight,
    backgroundColor: 'rgba(107,68,35,0.08)',
  },
  badgeText: { ...type.caption },
  badgeTextOn: { color: colors.success },
  badgeTextOff: { color: colors.inkSoft },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  toggle: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleOn: { backgroundColor: colors.forest },
  toggleOff: { backgroundColor: colors.wood },
  toggleText: { ...type.bodyStrong, color: colors.white },
});
