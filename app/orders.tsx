import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { WoodBackground } from '../src/components/WoodBackground';
import { useOrders } from '../src/context/OrdersContext';
import { formatPrice } from '../src/data/types';
import { customerFulfilmentLabel } from '../src/pop/orderPopFields';
import { findPop } from '../src/pop/popStore';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function MyOrdersScreen() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const mine = orders; // demo: all local orders for current session

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          {user ? `${user.name}'s orders` : 'Orders'}
        </Text>
        {mine.length === 0 ? (
          <Text style={styles.empty}>No orders yet — place one from the catalogue.</Text>
        ) : (
          mine.map((o) => {
            const pop = o.popId ? findPop(o.popId) : undefined;
            return (
              <Link key={o.id} href={`/order/${o.id}`} asChild>
                <Pressable style={styles.card}>
                  <Text style={styles.ref}>{o.orderRef}</Text>
                  <Text style={styles.status}>
                    {customerFulfilmentLabel(
                      o.fulfilmentStatus,
                      pop?.name ?? 'POP'
                    )}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPrice(o.totalCents)} · {o.lines.length} line(s)
                    {o.collectionCode ? ` · ${o.collectionCode}` : ''}
                  </Text>
                </Pressable>
              </Link>
            );
          })
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  heading: { ...type.section, color: colors.forestDeep, marginBottom: 16 },
  empty: { ...type.body, color: colors.inkSoft },
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  ref: { ...type.title, color: colors.forestDeep, fontSize: 20 },
  status: { ...type.bodyStrong, color: colors.wood, marginTop: 4 },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
});
