import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLD_CHAIN_RULE, ORDER_CUTOFF } from '../config/orderCutoff';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

export function OrderCutoffNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Text style={styles.kicker}>{ORDER_CUTOFF.label}</Text>
      <Text style={styles.when}>{ORDER_CUTOFF.when}</Text>
      {compact ? null : <Text style={styles.detail}>{ORDER_CUTOFF.detail}</Text>}
    </View>
  );
}

export function ColdChainNotice() {
  return (
    <View style={styles.cold}>
      <Text style={styles.coldTitle}>{COLD_CHAIN_RULE.title}</Text>
      <Text style={styles.detail}>{COLD_CHAIN_RULE.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(201, 162, 39, 0.16)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  boxCompact: {
    marginTop: 0,
    marginBottom: 16,
  },
  kicker: {
    ...type.label,
    color: colors.goldMuted,
  },
  when: {
    ...type.bodyStrong,
    color: colors.forestDeep,
    marginTop: 2,
  },
  detail: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 6,
  },
  cold: {
    marginTop: 8,
    padding: 14,
    backgroundColor: 'rgba(27, 61, 47, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.forest,
  },
  coldTitle: {
    ...type.bodyStrong,
    color: colors.forestDeep,
  },
});
