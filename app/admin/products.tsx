import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StockMessage } from '../../src/components/StockMessage';
import { WoodBackground } from '../../src/components/WoodBackground';
import { isDemoMode } from '../../src/config/demo';
import { useCatalog } from '../../src/context/CatalogContext';
import { SECTION_META } from '../../src/data/seed';
import type { ProductSection } from '../../src/data/types';
import { formatPrice } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

const SECTIONS: ProductSection[] = [
  'premium-vsp',
  'braai-boxes',
  'sausages',
];

export default function AdminProductsScreen() {
  const { user, loginAs } = useAuth();
  const { products } = useCatalog();
  const router = useRouter();

  const bySection = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        items: products.filter((p) => p.section === section),
      })),
    [products]
  );

  if (!user || user.role !== 'admin') {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Admin only.</Text>
        {isDemoMode() ? (
          <PrimaryButton label="Login as admin" onPress={() => loginAs('admin')} />
        ) : null}
      </WoodBackground>
    );
  }

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Catalogue</Text>
        <Text style={styles.hint}>
          Edit price, photo hint/URL, stock, and next arrival. Low / OOS must keep
          a next-arrival date.
        </Text>
        <PrimaryButton
          label="Add product"
          onPress={() => router.push('/admin/product/new')}
          style={{ marginBottom: 18 }}
        />

        {bySection.map(({ section, items }) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{SECTION_META[section].title}</Text>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>No products in this section.</Text>
            ) : (
              items.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.row}
                  onPress={() => router.push(`/admin/product/${p.id}`)}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.price}>{formatPrice(p.priceCents)}</Text>
                  </View>
                  <Text style={styles.meta}>
                    Stock {p.stockLevel} · {p.unitLabel}
                    {p.photoUri ? ' · photo set' : ` · swatch ${p.imageHint}`}
                  </Text>
                  <StockMessage product={p} compact />
                </Pressable>
              ))
            )}
          </View>
        ))}
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
  emptyText: { ...type.body, color: colors.inkSoft },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  section: { marginTop: 18 },
  sectionTitle: {
    ...type.label,
    color: colors.goldMuted,
    marginBottom: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: { ...type.title, color: colors.forestDeep, fontSize: 20, flex: 1 },
  price: { ...type.bodyStrong, color: colors.wood },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
});
