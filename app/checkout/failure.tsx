import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StoreColumn } from '../../src/components/StoreColumn';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useGuestOrder } from '../../src/data/useGuestOrder';
import { readGuestToken } from '../../src/payments/yocoCheckout';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}

export default function CheckoutFailureScreen() {
  const params = useLocalSearchParams<{ orderId?: string; token?: string }>();
  const orderId = one(params.orderId);
  const token = one(params.token) || (orderId ? readGuestToken(orderId) ?? '' : '');
  const { order } = useGuestOrder(token);

  return (
    <WoodBackground>
      <StoreColumn>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Payment failed</Text>
        <Text style={styles.body}>
          Yoco could not take the payment. Nothing has been marked paid. You
          can return to checkout and try another card. Apple Pay is available
          in Safari on iPhone.
        </Text>
        {order ? (
          <Text style={styles.meta}>{order.orderRef} · not paid</Text>
        ) : null}
        <Link href="/checkout" asChild>
          <PrimaryButton label="Try checkout again" onPress={() => undefined} style={{ marginTop: 20 }} />
        </Link>
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
