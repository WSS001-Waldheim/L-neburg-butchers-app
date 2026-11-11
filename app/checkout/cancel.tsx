import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useOrders } from '../../src/context/OrdersContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function CheckoutCancelScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { getOrder } = useOrders();
  const order = orderId ? getOrder(String(orderId)) : undefined;

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Payment cancelled</Text>
        <Text style={styles.body}>
          No charge was made. The order stays awaiting payment and your cart is
          still here if you want to try again.
        </Text>
        {order ? (
          <Text style={styles.meta}>{order.orderRef} · awaiting payment</Text>
        ) : null}
        <Link href="/checkout" asChild>
          <PrimaryButton label="Back to checkout" onPress={() => undefined} style={{ marginTop: 20 }} />
        </Link>
        <Link href="/cart" asChild>
          <PrimaryButton
            label="Review cart"
            variant="ghost"
            onPress={() => undefined}
            style={{ marginTop: 8 }}
          />
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
