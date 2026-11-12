import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const LOGO = require('../../assets/brand/logo.png');

/** Width / height of assets/brand/logo.png (official oval, 2512×1153, about 2.18:1). */
const ASPECT = 2512 / 1153;

type Props = {
  size?: 'splash' | 'hero' | 'compact';
};

/**
 * Cap the oval so a phone column can shrink it and a wide web header
 * does not crop the script. The file is already the sharp source.
 */
const MAX_WIDTH = {
  splash: 440,
  hero: 480,
  compact: 300,
} as const;

/**
 * Official mark: green oval, cream field, script wordmark.
 * Sits on the dark green ground. Not recoloured.
 */
export function BrandLogo({ size = 'hero' }: Props) {
  const maxWidth = MAX_WIDTH[size];
  return (
    <View
      style={styles.wrap}
      accessibilityRole="image"
      accessibilityLabel="Lüneburg Country Butchery"
    >
      <View
        style={[
          styles.frame,
          { maxWidth, aspectRatio: ASPECT },
          size === 'hero' && styles.heroGap,
        ]}
      >
        <Image
          source={LOGO}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={styles.image}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '100%',
  },
  /** Clears the home menu button, which sits in the top-right of the hero. */
  heroGap: {
    marginTop: 22,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
