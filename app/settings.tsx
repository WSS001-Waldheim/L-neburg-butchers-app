import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WoodBackground } from '../src/components/WoodBackground';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState({
    pushOrderConfirmed: true,
    pushLeftButchery: true,
    pushReadyForCollection: true,
    pushCollected: true,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <WoodBackground>
      <View style={styles.content}>
        <Text style={styles.heading}>Notification preferences</Text>
        <Text style={styles.hint}>
          Choose which order updates you want on this phone.
        </Text>
        {(
          [
            ['pushOrderConfirmed', 'Order confirmed'],
            ['pushLeftButchery', 'Parcel left the butchery'],
            ['pushReadyForCollection', 'Ready at pickup (with code)'],
            ['pushCollected', 'Collected'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={styles.row}
            onPress={() => toggle(key)}
          >
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowVal}>{prefs[key] ? 'On' : 'Off'}</Text>
          </Pressable>
        ))}
        <Text style={[styles.heading, { marginTop: 28 }]}>Payments</Text>
        <Text style={styles.hint}>Apple Pay and card payments through Yoco.</Text>
      </View>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.25)',
  },
  rowLabel: { ...type.body, color: colors.ink },
  rowVal: { ...type.bodyStrong, color: colors.forest },
});
