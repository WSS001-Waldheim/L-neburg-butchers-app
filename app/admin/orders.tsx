import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { WoodBackground } from '../../src/components/WoodBackground';
import { AdminSignIn, canAccessAdmin } from '../../src/components/AdminSignIn';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { formatPrice } from '../../src/data/types';
import {
  nextStoreStatuses,
  storeStatusActionLabel,
  storeStatusLabel,
} from '../../src/data/storeStatus';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function AdminOrdersScreen() {
  const { user, liveSession } = useAuth();
  const { orders, setStoreStatus, loading, error: loadError } = useOrders();
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

  if (!canAccessAdmin(user, liveSession) || !user) {
    return <AdminSignIn />;
  }

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>All orders</Text>
        <Text style={styles.hint}>
          Awaiting payment, then paid, confirmed, left the butchery, at the
          pickup point (collection code), collected, or cancelled. Ready at
          pickup issues the collection code.
        </Text>
        {loading ? <Text style={styles.hint}>Loading orders…</Text> : null}
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet.</Text>
        ) : (
          sorted.map((o) => {
            const pop = o.popId ? findPop(o.popId) : undefined;
            const next = nextStoreStatuses(o.storeStatus);
            return (
              <View key={o.id} style={styles.card}>
                <Pressable onPress={() => router.push(`/order/${o.id}`)}>
                  <Text style={styles.ref}>{o.orderRef}</Text>
                  <Text style={styles.meta}>
                    {o.customerName} · {o.phone}
                  </Text>
                  <Text style={styles.status}>
                    {storeStatusLabel(o.storeStatus)}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPrice(o.totalCents)} · {o.paymentStatus}
                    {o.collectionCode ? ` · code ${o.collectionCode}` : ''}
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
                          void (async () => {
                            try {
                              setError(null);
                              await setStoreStatus(
                                o.id,
                                step,
                                user,
                                `Admin dashboard → ${step}`,
                              );
                            } catch (e) {
                              setError(
                                e instanceof Error
                                  ? e.message
                                  : 'Could not update the order',
                              );
                            }
                          })();
                        }}
                      >
                        <Text style={styles.actionText}>
                          {storeStatusActionLabel(step)}
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
