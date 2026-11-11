import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { heritageBadgeLabel, showHeritageBadge } from '../config/heritage';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

function Laurel({ mirror }: { mirror?: boolean }) {
  return (
    <View style={mirror ? styles.mirror : undefined}>
      <Svg width={22} height={30} viewBox="0 0 24 32">
        <Path
          d="M16.2 30.5C15.6 22.2 12.6 14.2 8.2 5.2"
          stroke={colors.gold}
          strokeWidth={1.05}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse cx={13.6} cy={25.2} rx={5.4} ry={2.05} fill={colors.gold} transform="rotate(-58 13.6 25.2)" />
        <Ellipse cx={11.6} cy={19.4} rx={5.5} ry={2.05} fill={colors.gold} transform="rotate(-64 11.6 19.4)" />
        <Ellipse cx={9.6} cy={13.8} rx={5.2} ry={1.95} fill={colors.gold} transform="rotate(-70 9.6 13.8)" />
        <Ellipse cx={7.8} cy={8.6} rx={4.6} ry={1.75} fill={colors.gold} transform="rotate(-76 7.8 8.6)" />
      </Svg>
    </View>
  );
}

/** Gold-on-green anniversary mark. Hidden when `showHeritageBadge` is false. */
export function HeritageBadge() {
  if (!showHeritageBadge) return null;

  return (
    <View style={styles.badge} accessibilityRole="text">
      <Laurel />
      <Text style={styles.label}>{heritageBadgeLabel}</Text>
      <Laurel mirror />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.forest,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.6,
    color: colors.gold,
  },
  mirror: {
    transform: [{ scaleX: -1 }],
  },
});
