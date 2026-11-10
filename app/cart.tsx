import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { StockMessage } from '../src/components/StockMessage';
import { WoodBackground } from '../src/components/WoodBackground';
import { useCart } from '../src/context/CartContext';
import { useCatalog } from '../src/context/CatalogContext';
import { formatPrice } from '../src/data/types';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function CartScreen() {
  const { items, setQuantity, removeItem, totalCents, clear } = useCart();
  const { getProduct } = useCatalog();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyTitle}>Cart is empty</Text>
        <Text style={styles.emptyBody}>
          Browse Premium VSP Steaks or Braai Boxes from the catalogue.
        </Text>
        <PrimaryButton
          label="Back to catalogue"
          onPress={() => router.push('/')}
          style={{ marginTop: 20 }}
        />
      </WoodBackground>
    );
  }

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          return (
            <View key={item.productId} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>
                  {formatPrice(product.priceCents)} · {product.unitLabel}
                </Text>
                <StockMessage product={product} compact />
              </View>
              <View style={styles.qtyCol}>
                <View style={styles.qtyControls}>
                  <Pressable
                    onPress={() =>
                      setQuantity(item.productId, item.quantity - 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <Pressable
                    onPress={() =>
                      setQuantity(item.productId, item.quantity + 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem(item.productId)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
        </View>

        <PrimaryButton
          label="Checkout"
          onPress={() => router.push('/checkout')}
          style={{ marginTop: 20 }}
        />
        <PrimaryButton
          label="Clear cart"
          variant="ghost"
          onPress={clear}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyTitle: {
    ...type.section,
    color: colors.forestDeep,
  },
  emptyBody: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107, 68, 35, 0.28)',
  },
  rowMain: {
    flex: 1,
  },
  name: {
    ...type.title,
    color: colors.forestDeep,
    fontSize: 20,
  },
  price: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  qtyCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
  },
  qtyBtnText: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 20,
  },
  qty: {
    ...type.bodyStrong,
    color: colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  remove: {
    ...type.caption,
    color: colors.danger,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  totalLabel: {
    ...type.section,
    color: colors.forestDeep,
  },
  totalValue: {
    ...type.hero,
    color: colors.wood,
  },
});
