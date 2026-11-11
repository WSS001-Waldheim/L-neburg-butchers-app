import { Link, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCart } from '../../src/context/CartContext';
import { useOrders } from '../../src/context/OrdersContext';
import { storeStatusLabel } from '../../src/data/storeStatus';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/**
 * Yoco sends the browser here after the hosted page.
 * The webhook, not this page, marks the order paid.
 */
export default function CheckoutSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const id = String(orderId ?? '');
  const { getOrder, refresh } = useOrders();
  const { clear } = useCart();
  const order = id ? getOrder(id) : undefined;
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    clear();
    void refresh();
  }, [clear, refresh]);

  const paid =
    order?.paymentStatus === 'paid' ||
    order?.storeStatus === 'paid' ||
    order?.storeStatus === 'confirmed';

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          {paid ? 'Payment received' : 'Payment submitted'}
        </Text>
        <Text style={styles.body}>
          {paid
            ? 'Yoco has confirmed this payment. The butchery will pack the order for your pickup point.'
            : 'Yoco is confirming the payment. This page is not the receipt — the order is marked paid when the webhook arrives, usually within a minute. Refresh the order if it still says awaiting payment.'}
        </Text>
        {order ? (
          <Text style={styles.meta}>
            {order.orderRef} · {storeStatusLabel(order.storeStatus)}
          </Text>
        ) : id ? (
          <Text style={styles.meta}>Order {id}</Text>
        ) : (
          <Text style={styles.meta}>
            Demo checkout does not use this page. A simulated order opens its
            status straight away.
          </Text>
        )}
        {order ? (
          <Link href={`/order/${order.id}`} asChild>
            <PrimaryButton label="View order" onPress={() => undefined} style={{ marginTop: 20 }} />
          </Link>
        ) : (
          <Link href="/orders" asChild>
            <PrimaryButton label="My orders" onPress={() => undefined} style={{ marginTop: 20 }} />
          </Link>
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  heading: { ...type.section, color: colors.forestDeep },
  body: { ...type.body, color: colors.ink, marginTop: 12 },
  meta: { ...type.bodyStrong, color: colors.wood, marginTop: 16 },
});
