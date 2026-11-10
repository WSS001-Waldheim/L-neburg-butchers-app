import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { usePartnerApplications } from '../../src/context/PartnerApplicationsContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { isDemoMode } from '../../src/config/demo';
import { assertTransitionApplication } from '../../src/pop/applicationStatusMachine';
import type { PopPartnerApplication } from '../../src/pop/applicationTypes';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function AdminApplicationsScreen() {
  const { user, loginAs } = useAuth();
  const { addOrActivatePop } = usePopLocations();
  const { applications, updateApplication } = usePartnerApplications();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

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

  const pending = applications.filter((a) => a.status === 'pending_review');

  const approve = (app: PopPartnerApplication) => {
    assertTransitionApplication(app.status, 'approved', {
      kind: 'admin',
      user,
    });
    const reviewedAt = new Date().toISOString();
    const newId = `pop-${app.id}`;
    updateApplication(app.id, {
      status: 'approved',
      reviewedByUserId: user.id,
      reviewedAt,
      updatedAt: reviewedAt,
      linkedPopId: newId,
    });
    addOrActivatePop({
      id: newId,
      code: `NEW-${app.city.slice(0, 3).toUpperCase()}`,
      name: app.businessName,
      areaLabel: app.city,
      phase: 'P2',
      addressLine1: app.addressLine1,
      city: app.city,
      region: app.region,
      hours: {
        weekly: [],
        note: 'Collection hours are confirmed with your order.',
      },
      collectionInstructions:
        'Bring your collection code. Collect promptly once the order is marked ready.',
      isActive: true,
      sortOrder: 50 + applications.length,
      contactPhone: app.contactPhone,
    });
  };

  const reject = (app: PopPartnerApplication) => {
    const note = rejectNotes[app.id]?.trim();
    if (!note) return;
    assertTransitionApplication(app.status, 'rejected', {
      kind: 'admin',
      user,
    });
    const reviewedAt = new Date().toISOString();
    updateApplication(app.id, {
      status: 'rejected',
      reviewNote: note,
      reviewedByUserId: user.id,
      reviewedAt,
      updatedAt: reviewedAt,
    });
  };

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Partner applications</Text>
        <Text style={styles.hint}>
          Manual approval only (Karl, Ruben, father, factory manager). Approve →
          PopLocation.isActive.
        </Text>
        {pending.length === 0 ? (
          <Text style={styles.emptyText}>
            No pending applications. Submit one via Become a POP partner.
          </Text>
        ) : (
          pending.map((app) => (
            <View key={app.id} style={styles.card}>
              <Text style={styles.name}>{app.businessName}</Text>
              <Text style={styles.meta}>
                {app.addressLine1}, {app.city}, {app.region}
              </Text>
              <Text style={styles.meta}>
                {app.contactName} · {app.contactPhone} · {app.contactEmail}
              </Text>
              {app.notes ? (
                <Text style={styles.meta}>Notes: {app.notes}</Text>
              ) : null}
              <PrimaryButton
                label="Approve → activate POP"
                onPress={() => approve(app)}
                style={{ marginTop: 12 }}
              />
              <TextInput
                placeholder="Reject reason (required)"
                placeholderTextColor={colors.woodLight}
                value={rejectNotes[app.id] ?? ''}
                onChangeText={(t) =>
                  setRejectNotes((m) => ({ ...m, [app.id]: t }))
                }
                style={styles.input}
              />
              <Pressable onPress={() => reject(app)}>
                <Text style={styles.reject}>Reject</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  name: { ...type.title, color: colors.forestDeep, fontSize: 20 },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    padding: 10,
    marginTop: 10,
    color: colors.ink,
  },
  reject: { ...type.caption, color: colors.danger, marginTop: 10 },
});
