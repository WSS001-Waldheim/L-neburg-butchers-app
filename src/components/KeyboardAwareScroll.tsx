import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

/**
 * Room to drag the last button above an on-screen keyboard.
 * Set once. Changing it when a field focuses makes iPhone Safari drop the
 * keyboard, especially on password fields.
 */
function keyboardClearance(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 32;
  }
  return window.matchMedia('(pointer: coarse)').matches ? 360 : 32;
}

/**
 * Scroll container for screens with text fields.
 * minHeight 0 lets it shrink inside the full-height shell (body overflow is
 * hidden). Do not dismiss the keyboard on scroll: iOS fires a scroll when a
 * lower field, such as password, is tapped, and blurring it stops the keyboard.
 */
export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
  style,
}: Props) {
  const [clearance] = useState(keyboardClearance);
  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
        { paddingBottom: clearance },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  content: {
    flexGrow: 1,
  },
});
