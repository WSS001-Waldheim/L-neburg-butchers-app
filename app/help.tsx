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
          WhatsApp / phone support TBD — use the demo contacts in Profile for
          now.
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
});
