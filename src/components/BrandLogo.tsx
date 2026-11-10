import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { FARM_PLACE_SHORT } from '../data/place';
import { colors } from '../theme/colors';
import { fonts, type } from '../theme/typography';

type Props = {
  size?: 'hero' | 'compact';
};

/** Oval Est. 1946 placeholder until the PDF logo is supplied. */
export function BrandLogo({ size = 'hero' }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  const isHero = size === 'hero';

  return (
    <View style={[styles.wrap, isHero ? styles.wrapHero : styles.wrapCompact]}>
      <Animated.View
        style={[
          styles.outerRing,
          isHero ? styles.outerHero : styles.outerCompact,
          { opacity: ringOpacity, borderColor: colors.gold },
        ]}
      />
      <View
        style={[
          styles.oval,
          isHero ? styles.ovalHero : styles.ovalCompact,
          { backgroundColor: colors.forest, borderColor: colors.gold },
        ]}
      >
        <Text style={[styles.est, isHero ? styles.estHero : styles.estCompact]}>
          EST. 1946
        </Text>
        <Text
          style={[
            styles.name,
            isHero ? styles.nameHero : styles.nameCompact,
          ]}
          numberOfLines={2}
        >
          Lüneburg{'\n'}Country Butchery
        </Text>
        <View style={[styles.rule, { backgroundColor: colors.gold }]} />
        <Text style={[styles.place, isHero ? undefined : styles.placeCompact]}>
          {FARM_PLACE_SHORT}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapHero: {
    marginBottom: 8,
  },
  wrapCompact: {
    marginBottom: 0,
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 999,
  },
  outerHero: {
    width: 236,
    height: 168,
  },
  outerCompact: {
    width: 148,
    height: 108,
  },
  oval: {
    borderWidth: 3,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ovalHero: {
    width: 220,
    height: 152,
  },
  ovalCompact: {
    width: 136,
    height: 96,
    paddingHorizontal: 10,
  },
  est: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
    letterSpacing: 2.5,
  },
  estHero: {
    fontSize: 11,
    marginBottom: 4,
  },
  estCompact: {
    fontSize: 8,
    marginBottom: 2,
  },
  name: {
    fontFamily: fonts.displayBold,
    color: colors.white,
    textAlign: 'center',
  },
  nameHero: {
    fontSize: 26,
    lineHeight: 28,
  },
  nameCompact: {
    fontSize: 14,
    lineHeight: 16,
  },
  rule: {
    height: 1,
    width: '55%',
    marginVertical: 6,
  },
  place: {
    ...type.caption,
    color: colors.parchment,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  placeCompact: {
    fontSize: 8,
    marginTop: -2,
  },
});
