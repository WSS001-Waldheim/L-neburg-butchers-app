import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { BrandLogo } from './BrandLogo';

/**
 * Same treatment as the expo-splash-screen config: label badge centred
 * on the label green. Shown while fonts load, including on web where the
 * native splash does not paint.
 */
export function OpeningSplash() {
  return (
    <View style={styles.screen}>
      <BrandLogo size="splash" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
