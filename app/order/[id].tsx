import { Link, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useOrders } from '../../src/context/OrdersContext';
import {
  nextStoreStatuses,
  storeStatusActionLabel,
  storeStatusLabel,
} from '../../src/data/storeStatus';
import { formatPrice } from '../../src/data/types';
import { buildOrderTimeline } from '../../src/notifications/useOrderTimeline';
import { customerVisibleLine } from '../../src/pop/customerCopy';
import { customerFulfilmentLabel } from '../../src/pop/orderPopFields';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function OrderStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder, setStoreStatus } = useOrders();
  const { findPop } = usePopLocations();
  const { user } = useAuth();
  const order = getOrder(String(id));
  const pop = order?.popId ? findPop(order.popId) : undefined;

  const timeline = useMemo(
    () => (order ? buildOrderTimeline(order.statusEvents, pop?.name) : []),
    [order, pop?.name]
  );

  if (!order) {
    return (
      <WoodBackground style={styles.missing}>
        <Text style={styles.missingText}>Order not found.</Text>
        <Link href="/" asChild>
          <PrimaryButton label="Catalogue" onPress={() => undefined} />
        </Link>
      </WoodBackground>
    );
  }

  const label = customerFulfilmentLabel(
    order.fulfilmentStatus,
    pop?.name ?? 'POP'
  );

  return (
    <WoodBackground>
      <Stack.Screen options={{ title: order.orderRef }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.status}>{storeStatusLabel(order.storeStatus)}</Text>
        <Text style={styles.payNote}>{label}</Text>
        <Text style={styles.payNote}>
          {order.paymentStatus === 'paid' || order.paymentStatus === 'authorized'
            ? 'Payment received'
            : order.paymentStatus === 'failed'
              ? 'Payment did not go through'
              : 'Payment pending'}
        </Text>

        {(order.storeStatus === 'at_pop' ||
          order.fulfilmentStatus === 'ready_for_collection') &&
        pop ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Ready for collection at</Text>
            <Text style={styles.codePop}>{pop.name}</Text>
            <Text style={styles.codeValue}>{order.collectionCode}</Text>
            <Text style={styles.codeMeta}>
              {pop.addressLine1}, {pop.city}
            </Text>
            {customerVisibleLine(pop.collectionInstructions) ? (
              <Text style={styles.codeMeta}>
                {customerVisibleLine(pop.collectionInstructions)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {pop && order.fulfilment === 'pop_collect' ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Point of Pickup</Text>
            <Text style={styles.blockValue}>{pop.name}</Text>
            <Text style={styles.blockMeta}>
              {pop.addressLine1}
              {pop.addressLine2 ? ` · ${pop.addressLine2}` : ''} · {pop.city}
            </Text>
          </View>
        ) : null}

        <Text style={styles.linesHeading}>Courier timeline</Text>
        {timeline.map((row, idx) => {
          const current = idx === timeline.length - 1;
          return (
            <View key={row.id} style={styles.timelineRow}>
              <View
                style={[styles.dot, current && styles.dotCurrent]}
              />
              <View style={styles.timelineBody}>
                <Text style={[styles.timelineLabel, current && styles.current]}>
                  {row.label}
                </Text>
                {row.detail ? (
                  <Text style={styles.timelineDetail}>{row.detail}</Text>
                ) : null}
                <Text style={styles.timelineTime}>
                  {new Date(row.createdAt).toLocaleString('en-ZA')}
                </Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.linesHeading}>Lines</Text>
        {order.lines.map((line) => (
          <View key={line.productId} style={styles.line}>
            <Text style={styles.lineName}>
              {line.quantity}× {line.productName}
            </Text>
            <Text style={styles.linePrice}>
              {formatPrice(line.unitPriceCents * line.quantity)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.totalCents)}</Text>
        </View>

        {user?.role === 'admin' ? (
          <View style={styles.adminBox}>
            <Text style={styles.blockLabel}>Update order</Text>
            {nextStoreStatuses(order.storeStatus).map((step) => (
              <Pressable
                key={step}
                style={styles.adminBtn}
                onPress={() => {
                  void setStoreStatus(order.id, step, user, `Admin → ${step}`);
                }}
              >
                <Text style={styles.adminBtnText}>
                  {storeStatusActionLabel(step)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Link href="/" asChild>
          <PrimaryButton
            label="Back to catalogue"
            onPress={() => undefined}
            style={{ marginTop: 20 }}
          />
        </Link>
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  missingText: { ...type.body, color: colors.ink },
  statusLabel: { ...type.label, color: colors.goldMuted },
  status: { ...type.hero, color: colors.forestDeep, marginTop: 4 },
  payNote: { ...type.caption, color: colors.inkSoft, marginTop: 8 },
  codeCard: {
    marginTop: 18,
    padding: 16,
    backgroundColor: colors.forestDeep,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  codeLabel: { ...type.caption, color: colors.parchment },
  codePop: { ...type.title, color: colors.white, marginTop: 4 },
  codeValue: {
    ...type.hero,
    color: colors.gold,
    fontSize: 32,
    marginTop: 10,
    letterSpacing: 2,
  },
  codeMeta: { ...type.caption, color: colors.parchment, marginTop: 6 },
  block: {
    marginTop: 18,
    padding: 14,
    backgroundColor: 'rgba(27, 61, 47, 0.07)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  blockLabel: { ...type.label, color: colors.goldMuted, marginBottom: 6 },
  blockValue: { ...type.bodyStrong, color: colors.forestDeep },
  blockMeta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  linesHeading: {
    ...type.section,
    color: colors.forestDeep,
    marginTop: 28,
    marginBottom: 8,
  },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.woodWash,
    marginTop: 4,
  },
  dotCurrent: { backgroundColor: colors.gold },
  timelineBody: { flex: 1 },
  timelineLabel: { ...type.bodyStrong, color: colors.inkSoft },
  current: { color: colors.forestDeep },
  timelineDetail: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  timelineTime: { ...type.caption, color: colors.woodLight, marginTop: 2 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107, 68, 35, 0.25)',
  },
  lineName: { ...type.body, color: colors.ink, flex: 1 },
  linePrice: { ...type.bodyStrong, color: colors.wood },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  totalLabel: { ...type.bodyStrong, color: colors.ink },
  totalValue: { ...type.hero, color: colors.wood },
  adminBox: { marginTop: 24, gap: 8 },
  adminBtn: {
    backgroundColor: colors.forest,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  adminBtnText: {
    ...type.caption,
    color: colors.white,
    textTransform: 'capitalize',
  },
});
