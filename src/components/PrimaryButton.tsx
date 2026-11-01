import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

type Props = {
  label: string,
  onPress: () => void;
  disabled?: boolean,
  loading?: boolean,
  variant?: 'gold' | 'forest' | 'ghost',
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'gold',
  style,
}: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'gold' && styles.gold,
        variant === 'forest' && styles.forest,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.forest : colors.forestDeep} />
      ) : (
        <Text
          style={[
            styles.label,
            isGhost && styles.ghostLabel,
            variant === 'forest' && styles.forestLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  forest: {
    backgroundColor: colors.forest,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...type.bodyStrong,
    color: colors.forestDeep,
    letterSpacing: 0.6,
  },
  forestLabel: {
    color: colors.white,
  },
  ghostLabel: {
    color: colors.forest,
  },
});
