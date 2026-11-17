import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WoodBackground } from '../src/components/WoodBackground';
import { ColdChainNotice, CollectionNotice } from '../src/components/OrderNotices';
import { FARM_PLACE } from '../src/data/place';
import { BUG_REPORT_EMAIL } from '../src/support/bugReport';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function HelpScreen() {
  return (
    <WoodBackground>
      <View style={styles.content}>
        <Text style={styles.heading}>Help / Support</Text>
        <CollectionNotice />
        <ColdChainNotice />
        <Text style={styles.body}>
          Lüneburg Country Butchery · {FARM_PLACE}. Your order is packed in a
          box and waiting for you at your pickup point — collect whenever suits
          you. No returns for an ordering mistake after the parcel leaves the
          butchery. Keep the packs cold.
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
