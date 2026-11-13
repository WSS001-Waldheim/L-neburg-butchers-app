import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  /** Thumb-reach bar. Stays under the scrolling column on a phone. */
  sticky?: React.ReactNode;
};

/**
 * Phone column (about 375–430px) centred on a wider desktop window.
 * The page itself never grows wider than the column, so nothing scrolls sideways.
 */
export function StoreColumn({ children, sticky }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <View style={styles.column}>
        <View style={styles.body}>{children}</View>
        {sticky ? (
          <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {sticky}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
  },
  body: {
    flex: 1,
  },
  sticky: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.parchment,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 36, 23, 0.18)',
  },
});
