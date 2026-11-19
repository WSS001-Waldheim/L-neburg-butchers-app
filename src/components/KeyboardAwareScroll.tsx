import React from 'react';
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
 * Scroll container for screens with text fields.
 * minHeight 0 is required: a flex child otherwise refuses to shrink, the
 * wood background clips it (overflow hidden), and the keyboard hides the rest.
 */
export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
  style,
}: Props) {
  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
    paddingBottom: 32,
  },
});
