import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Product } from '../data/types';
import {
  formatArrivalDate,
  getStockStatus,
  requireNextArrival,
} from '../data/types';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

type Props = {
  product: Product,
  compact?: boolean;
};

/**
 * Hard rule: low / OOS always show expected next arrival.
 * Tone: confident, direct — never announce scarcity.
 */
export function StockMessage({ product, compact }: Props) {
  const status = getStockStatus(product);

  if (status === 'in_stock') {
    return (
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
        <Text style={[styles.text, compact && styles.textCompact]}>
          Available
        </Text>
      </View>
    );
  }

  const arrival = requireNextArrival(product);
  const dateLabel = formatArrivalDate(arrival);

  if (status === 'low') {
    return (
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={[styles.dot, { backgroundColor: colors.wood }]} />
        <Text style={[styles.text, compact && styles.textCompact]}>
          Limited packs left · next cut {dateLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.block, compact && styles.blockCompact]}>
      <Text style={[styles.oosTitle, compact && styles.textCompact]}>
        Next available {dateLabel}
      </Text>
      {!compact && (
        <Text style={styles.oosBody}>
          This cut is between carcasses. The date above is when we expect the
          next packs from the yard.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rowCompact: {
    marginTop: 4,
  },
  block: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(30, 36, 23, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  blockCompact: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...type.caption,
    color: colors.inkSoft,
    flex: 1,
  },
  textCompact: {
    fontSize: 12,
  },
  oosTitle: {
    ...type.bodyStrong,
    color: colors.forest,
    fontSize: 14,
  },
  oosBody: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 4,
  },
});
