import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { WoodBackground } from '../src/components/WoodBackground';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function HelpScreen() {
  const router = useRouter();
  return (
    <WoodBackground>
      <View style={styles.content}>
        <Text style={styles.heading}>Help / Support</Text>
        <Text style={styles.body}>
          Lüneburg Country Butchery · Ouderdam Farm, Lydenburg / Paulpietersburg
          region. Cold-chain: collect promptly once marked ready. No returns for
          ordering errors after the parcel leaves the butchery.
        </Text>
        <Text style={styles.body}>
          Support / TestFlight contact: Karl@Wssfarming.co.za. WhatsApp phone
          TBD — use demo contacts in Profile for now.
        </Text>
        <Text style={styles.reviewBox}>
          TestFlight review info (placeholder): stub payments — no live
          charges. Browse catalogue, cart, and checkout with stub pay. Location
          when-in-use only suggests the nearest Point of Pickup. Testers:
          invite via App Store Connect → TestFlight. Contact
          Karl@Wssfarming.co.za.
        </Text>
        <PrimaryButton
          label="Sample pack QR story"
          onPress={() => router.push('/qr/LC-2026-0142')}
          style={{ marginTop: 20 }}
        />
      </View>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  heading: { ...type.section, color: colors.forestDeep, marginBottom: 12 },
  body: { ...type.body, color: colors.ink, marginBottom: 12 },
  reviewBox: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    backgroundColor: 'rgba(27, 61, 47, 0.06)',
  },
});
