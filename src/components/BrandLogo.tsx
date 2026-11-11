import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const LOGO = require('../../assets/brand/logo.png');

/** Width / height of assets/brand/logo.png (KP label badge). */
const ASPECT = 1500 / 735;

type Props = {
  size?: 'splash' | 'hero' | 'compact';
};

const WIDTH = {
  splash: 280,
  hero: 300,
  compact: 210,
} as const;

/**
 * Official badge: gold oval, script wordmark, and the quality ribbon.
 * Cut from the KP 80-year label. Transparent outside the gold edge.
 */
export function BrandLogo({ size = 'hero' }: Props) {
  const width = WIDTH[size];
  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="Lüneburg Country Butchery">
      <Image
        source={LOGO}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width, height: width / ASPECT }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
});
