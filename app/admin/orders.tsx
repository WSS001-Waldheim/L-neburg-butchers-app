import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { formatPrice } from '../../src/data/types';
import { customerFulfilmentLabel } from '../../src/pop/orderPopFields';
import type { PopFulfilmentStatus } from '../../src/pop/types';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/** Mirrors statusMachine legal edges for admin UI. */
const NEXT_STEPS: Partial<Record<PopFulfilmentStatus, PopFulfilmentStatus[]>> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['packed', 'cancelled'],
  packed: ['dispatched_to_pop', 'cancelled'],
  dispatched_to_pop: ['ready_for_collection', 'returned_to_butchery'],
  ready_for_collection: ['collected', 'no_show', 'returned_to_butchery'],
  collected: ['completed'],
  no_show: ['returned_to_butchery'],
  returned_to_butchery: [],
  completed: [],
  cancelled: [],
};

export default function AdminOrdersScreen() {
  const { user, loginAs } = useAuth();
  const { orders, advanceFulfilment } = useOrders();
  const { findPop } = usePopLocations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  if (!user || user.role !== 'admin') {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Admin only.</Text>
        <PrimaryButton label="Login as admin" onPress={() => loginAs('admin')} />
      </WoodBackground>
    );
  }

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>All orders</Text>
        <Text style={styles.hint}>
          Advance fulfilment — each legal step fans out to the notification stub
          inbox (confirmed / left butchery / ready + code / collected).
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet.</Text>
        ) : (
          sorted.map((o) => {
            const pop = o.popId ? findPop(o.popId) : undefined;
            const label = customerFulfilmentLabel(
              o.fulfilmentStatus,
              pop?.name ?? 'POP'
            );
            const next = NEXT_STEPS[o.fulfilmentStatus] ?? [];
            return (
              <View key={o.id} style={styles.card}>
                <Pressable onPress={() => router.push(`/order/${o.id}`)}>
                  <Text style={styles.ref}>{o.orderRef}</Text>
                  <Text style={styles.meta}>
                    {o.customerName} · {o.phone}
                  </Text>
                  <Text style={styles.status}>{label}</Text>
                  <Text style={styles.meta}>
                    {formatPrice(o.totalCents)} · {o.paymentStatus}
                    {o.collectionCode ? ` · ${o.collectionCode}` : ''}
                  </Text>
                  {pop ? (
                    <Text style={styles.meta}>POP: {pop.name}</Text>
                  ) : null}
                </Pressable>

                {next.length > 0 ? (
                  <View style={styles.actions}>
                    {next.map((step) => (
                      <Pressable
                        key={step}
                        style={styles.actionBtn}
                        onPress={() => {
                          try {
                            setError(null);
                            advanceFulfilment(
                              o.id,
                              step,
                              user,
                              `Admin dashboard → ${step}`
                            );
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : 'Illegal transition'
                            );
                          }
                        }}
                      >
                        <Text style={styles.actionText}>
                          → {step.replace(/_/g, ' ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  error: { ...type.caption, color: colors.danger, marginBottom: 8 },
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  ref: { ...type.title, color: colors.forestDeep, fontSize: 20 },
  status: { ...type.bodyStrong, color: colors.forest, marginTop: 6 },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: {
    backgroundColor: colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: {
    ...type.caption,
    color: colors.white,
    textTransform: 'capitalize',
  },
});
