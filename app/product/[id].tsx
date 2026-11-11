import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StockMessage } from '../../src/components/StockMessage';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCart } from '../../src/context/CartContext';
import { useCatalog } from '../../src/context/CatalogContext';
import { getBatch } from '../../src/data/seed';
import { formatPrice, getStockStatus } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct } = useCatalog();
  const product = getProduct(String(id));
  const batch = product?.carcassBatchId
    ? getBatch(product.carcassBatchId)
    : undefined;
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <WoodBackground style={styles.missing}>
        <Text style={styles.missingText}>Product not found.</Text>
        <Link href="/" style={styles.link}>
          Back to catalogue
        </Link>
      </WoodBackground>
    );
  }

  const status = getStockStatus(product);
  const canAdd = status !== 'out_of_stock';

  const onAdd = () => {
    const result = addItem(product.id);
    if (!result.ok) {
      Alert.alert('Unavailable', result.reason ?? 'Could not add to cart');
      return;
    }
    setAdded(true);
  };

  return (
    <WoodBackground>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerHint}>{product.imageHint}</Text>
          <Text style={styles.sectionTag}>
            {product.section === 'premium-vsp'
              ? 'Premium VSP'
              : product.section === 'braai-boxes'
                ? 'Braai Boxes'
                : 'Sausages'}
          </Text>
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          {formatPrice(product.priceCents)}{' '}
          <Text style={styles.unit}>{product.unitLabel}</Text>
        </Text>

        <StockMessage product={product} />

        <Text style={styles.description}>{product.description}</Text>
        {product.cutNotes ? (
          <Text style={styles.cutNotes}>{product.cutNotes}</Text>
        ) : null}

        {batch ? (
          <View style={styles.trace}>
            <Text style={styles.traceLabel}>Carcass / batch</Text>
            <Text style={styles.traceValue}>{batch.carcassNumber}</Text>
            <Text style={styles.traceMeta}>Ear tag {batch.earTag}</Text>
            <PrimaryButton
              label="Open pack story (QR)"
              variant="ghost"
              onPress={() => router.push(`/qr/${batch.qrCode}`)}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            label={
              canAdd
                ? added
                  ? 'Added to cart'
                  : 'Add to cart'
                : 'See next arrival above'
            }
            onPress={onAdd}
            disabled={!canAdd}
            variant="gold"
          />
          <PrimaryButton
            label="View cart"
            onPress={() => router.push('/cart')}
            variant="forest"
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  banner: {
    height: 160,
    backgroundColor: colors.wood,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    marginBottom: 18,
  },
  bannerHint: {
    ...type.label,
    color: colors.parchment,
  },
  sectionTag: {
    ...type.caption,
    color: colors.parchment,
    marginTop: 8,
  },
  name: {
    ...type.hero,
    color: colors.forestDeep,
  },
  price: {
    ...type.bodyStrong,
    color: colors.wood,
    fontSize: 20,
    marginTop: 8,
  },
  unit: {
    ...type.caption,
    color: colors.inkSoft,
  },
  description: {
    ...type.body,
    color: colors.ink,
    marginTop: 18,
  },
  cutNotes: {
    ...type.bodyStrong,
    color: colors.forestMid,
    marginTop: 10,
  },
  trace: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(30, 36, 23, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  traceLabel: {
    ...type.label,
    color: colors.forest,
    marginBottom: 6,
  },
  traceValue: {
    ...type.title,
    color: colors.forestDeep,
  },
  traceMeta: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 4,
  },
  actions: {
    marginTop: 28,
  },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    ...type.body,
    color: colors.ink,
  },
  link: {
    ...type.bodyStrong,
    color: colors.forest,
    marginTop: 12,
  },
});
