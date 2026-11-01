import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children?: React.ReactNode,
  style?: ViewStyle,
  variant?: 'page' | 'hero' | 'panel';
};

/** Atmospheric wood wash — layered bands, not a flat clinical fill. */
export function WoodBackground({ children, style, variant = 'page' }: Props) {
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      <View style={styles.grainA} pointerEvents="none" />
      <View style={styles.grainB} pointerEvents="none" />
      <View style={styles.grainC} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.parchment,
  },
  grainA: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.woodWash,
    opacity: 0.22,
    transform: [{ scaleX: 1.2 }, { rotate: '-3deg' }],
  },
  grainB: {
    position: 'absolute',
    top: '18%',
    left: '-10%',
    right: '-10%',
    height: '28%',
    backgroundColor: colors.forest,
    opacity: 0.06,
    transform: [{ rotate: '2deg' }],
  },
  grainC: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: colors.gold,
    opacity: 0.07,
  },
});

const variantStyles = StyleSheet.create({
  page: {},
  hero: {
    backgroundColor: colors.forestDeep,
  },
  panel: {
    backgroundColor: colors.mist,
  },
});
