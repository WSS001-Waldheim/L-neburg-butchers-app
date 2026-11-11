import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useOrders } from '../../src/context/OrdersContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function CheckoutFailureScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { getOrder } = useOrders();
  const order = orderId ? getOrder(String(orderId)) : undefined;

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Payment failed</Text>
        <Text style={styles.body}>
          Yoco could not take payment. Nothing has been marked paid. You can
          return to checkout and try another card. Apple Pay is available in
          Safari on iPhone.
        </Text>
        {order ? (
          <Text style={styles.meta}>{order.orderRef} · not paid</Text>
        ) : null}
        <Link href="/checkout" asChild>
          <PrimaryButton label="Try checkout again" onPress={() => undefined} style={{ marginTop: 20 }} />
        </Link>
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
