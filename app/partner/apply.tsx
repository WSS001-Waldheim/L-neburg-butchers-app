import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { assertTransitionApplication } from '../../src/pop/applicationStatusMachine';
import type { PopPartnerApplication } from '../../src/pop/applicationTypes';
import { PARTNER_BENEFITS_COPY } from '../../src/pop/partnerBenefitsCopy';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/** In-memory pending applications for the pilot (also used by admin screen). */
export const pendingApplicationsStore: PopPartnerApplication[] = [];

export default function PartnerApplyScreen() {
  const [businessName, setBusinessName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('Mpumalanga');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = PARTNER_BENEFITS_COPY;

  const canSubmit = useMemo(
    () =>
      [
        businessName,
        addressLine1,
        city,
        region,
        contactName,
        contactPhone,
        contactEmail,
      ].every((s) => s.trim().length > 1),
    [
      businessName,
      addressLine1,
      city,
      region,
      contactName,
      contactPhone,
      contactEmail,
    ]
  );

  const onSubmit = () => {
    try {
      setError(null);
      const now = new Date().toISOString();
      const app: PopPartnerApplication = {
        id: `app-${Date.now().toString(36)}`,
        status: 'draft',
        businessName: businessName.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        region: region.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      assertTransitionApplication('draft', 'submitted', {
        kind: 'applicant',
        userId: 'applicant-demo',
      });
      app.status = 'submitted';
      assertTransitionApplication('submitted', 'pending_review', {
        kind: 'system',
      });
      app.status = 'pending_review';
      app.updatedAt = new Date().toISOString();
      pendingApplicationsStore.push(app);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    }
  };

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{copy.sectionTitle}</Text>
        <Text style={styles.heading}>{copy.headline}</Text>
        <Text style={styles.body}>{copy.intro}</Text>
        {copy.benefits.map((b) => (
          <View key={b.id} style={styles.benefit}>
            <Text style={styles.benefitTitle}>
              {b.title}
              {b.tbd ? ' (TBD)' : ''}
            </Text>
            <Text style={styles.benefitBody}>{b.body}</Text>
          </View>
        ))}
        <Text style={styles.note}>{copy.disclaimer}</Text>

        {done ? (
          <Text style={styles.done}>
            Application submitted — pending review by Karl, Ruben, father, or
            factory manager. No auto-approve.
          </Text>
        ) : (
          <>
            {(
              [
                ['Business name', businessName, setBusinessName],
                ['Street address', addressLine1, setAddressLine1],
                ['City', city, setCity],
                ['Region', region, setRegion],
                ['Contact name', contactName, setContactName],
                ['Contact phone', contactPhone, setContactPhone],
                ['Contact email', contactEmail, setContactEmail],
              ] as const
            ).map(([label, value, setter]) => (
              <View key={label}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={setter}
                  style={styles.input}
                  placeholderTextColor={colors.woodLight}
                />
              </View>
            ))}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, { minHeight: 72 }]}
              multiline
              placeholderTextColor={colors.woodLight}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={copy.ctaLabel}
              onPress={onSubmit}
              disabled={!canSubmit}
              style={{ marginTop: 16 }}
            />
          </>
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  kicker: { ...type.label, color: colors.goldMuted },
  heading: { ...type.section, color: colors.forestDeep, marginTop: 6 },
  body: { ...type.body, color: colors.ink, marginTop: 10 },
  benefit: { marginTop: 12 },
  benefitTitle: { ...type.bodyStrong, color: colors.forestDeep },
  benefitBody: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  note: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 14,
    marginBottom: 16,
  },
  label: {
    ...type.label,
    color: colors.goldMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    padding: 12,
    color: colors.ink,
  },
  done: { ...type.bodyStrong, color: colors.forest, marginTop: 20 },
  error: { ...type.caption, color: colors.danger, marginTop: 10 },
});
