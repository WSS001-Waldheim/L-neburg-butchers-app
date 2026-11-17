import { Link, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StoreColumn } from '../../src/components/StoreColumn';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCart } from '../../src/context/CartContext';
import { useGuestOrder } from '../../src/data/useGuestOrder';
import { storeStatusLabel } from '../../src/data/storeStatus';
import { readGuestToken } from '../../src/payments/yocoCheckout';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}

/**
 * Yoco sends the browser here after the hosted page.
 * The webhook, not this page, marks the order paid.
 */
export default function CheckoutSuccessScreen() {
  const params = useLocalSearchParams<{ orderId?: string; token?: string }>();
  const orderId = one(params.orderId);
  const token = one(params.token) || (orderId ? readGuestToken(orderId) ?? '' : '');
  const { order, loading } = useGuestOrder(token, true);
  const { clear } = useCart();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    clear();
  }, [clear]);

  const paid =
    order?.paymentStatus === 'paid' ||
    order?.storeStatus === 'paid' ||
    order?.storeStatus === 'confirmed';
  const orderHref = order
    ? `/order/${order.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    : '/';

  return (
    <WoodBackground>
      <StoreColumn>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          {paid ? 'Payment received' : 'Payment submitted'}
        </Text>
        <Text style={styles.body}>
          {paid
            ? 'Yoco has confirmed this payment. Your order is packed in a box and waiting for you at your pickup point — collect whenever suits you.'
            : 'Yoco is confirming the payment. This page is not the receipt — the order is marked paid when Yoco confirms it, usually within a minute. Your order is packed in a box and waiting for you at your pickup point — collect whenever suits you.'}
        </Text>
        <Text style={styles.body}>
          Keep this confirmation link. Without an account, it is the only way
          to open the order.
        </Text>
        {loading && !order ? (
          <Text style={styles.meta}>Loading your order…</Text>
        ) : order ? (
          <Text style={styles.meta}>
            {order.orderRef} · {storeStatusLabel(order.storeStatus)}
          </Text>
        ) : orderId ? (
          <Text style={styles.meta}>Order {orderId}</Text>
        ) : (
          <Text style={styles.meta}>
            We could not open this order. Use the confirmation link from checkout.
          </Text>
        )}
        {order ? (
          <Link href={orderHref as '/'} asChild>
            <PrimaryButton label="View order" onPress={() => undefined} style={{ marginTop: 20 }} />
          </Link>
        ) : (
          <Link href="/" asChild>
            <PrimaryButton label="Back to the shop" onPress={() => undefined} style={{ marginTop: 20 }} />
          </Link>
        )}
      </ScrollView>
      </StoreColumn>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  heading: { ...type.section, color: colors.forestDeep },
  body: { ...type.body, color: colors.ink, marginTop: 12 },
  meta: { ...type.bodyStrong, color: colors.wood, marginTop: 16 },
});
