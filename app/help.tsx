import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WoodBackground } from '../src/components/WoodBackground';
import { ColdChainNotice, OrderCutoffNotice } from '../src/components/OrderNotices';
import { FARM_PLACE } from '../src/data/place';
import { BUG_REPORT_EMAIL } from '../src/support/bugReport';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function HelpScreen() {
  return (
    <WoodBackground>
      <View style={styles.content}>
        <Text style={styles.heading}>Help / Support</Text>
        <OrderCutoffNotice />
        <ColdChainNotice />
        <Text style={styles.body}>
          Lüneburg Country Butchery · {FARM_PLACE}. Cold chain once packed is
          20–24 hours. Collect promptly once your order is marked ready. No
          returns for ordering errors after the parcel leaves the butchery.
        </Text>
        <Text style={styles.body}>Support: {BUG_REPORT_EMAIL}</Text>
      </View>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  heading: { ...type.section, color: colors.forestDeep, marginBottom: 12 },
  body: { ...type.body, color: colors.ink, marginBottom: 12 },
});
