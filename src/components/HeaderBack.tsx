import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * Top-left back control for every screen that has the shop header.
 * A direct link or a refresh has no history, so admin pages return to
 * the admin dashboard and every other page returns to the shop.
 */
export function HeaderBack() {
  const router = useRouter();
  const segments = useSegments();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (segments[0] === 'admin' && segments.length > 1) {
      router.replace('/admin');
      return;
    }
    router.replace('/');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: 48,
    minHeight: 48,
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  chevron: {
    color: colors.gold,
    fontSize: 34,
    lineHeight: 36,
    marginTop: -4,
  },
  label: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
});
