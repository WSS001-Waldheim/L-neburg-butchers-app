import { Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMenuButton } from '../src/components/AppMenu';
import { BrandLogo } from '../src/components/BrandLogo';
import { HeritageBadge } from '../src/components/HeritageBadge';
import { ProductCard } from '../src/components/ProductCard';
import { WoodBackground } from '../src/components/WoodBackground';
import { useCart } from '../src/context/CartContext';
import { useCatalog } from '../src/context/CatalogContext';
import { SECTION_META } from '../src/data/seed';
import type { ProductSection } from '../src/data/types';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

const SECTION_ORDER: ProductSection[] = [
  'premium-vsp',
  'braai-boxes',
  'sausages',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const { products } = useCatalog();
  const sloganOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sloganOpacity, {
      toValue: 1,
      duration: 900,
      delay: 350,
      useNativeDriver: true,
    }).start();
  }, [sloganOpacity]);

  return (
    <WoodBackground>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 48 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            { paddingTop: insets.top + 28, paddingBottom: 36 },
          ]}
        >
          <View style={styles.heroGrain} pointerEvents="none" />
          <View style={styles.menuCorner}>
            <AppMenuButton light />
          </View>
          <BrandLogo size="hero" />
          <Animated.Text style={[styles.slogan, { opacity: sloganOpacity }]}>
            No Compromise on Quality
          </Animated.Text>
          <HeritageBadge />
          <Text style={styles.heroLine}>
            Premium steaks and braai packs from Ouderdam Farm.
          </Text>
          <View style={styles.ctaRow}>
            <Link href="/cart" asChild>
              <Pressable style={styles.cta}>
                <Text style={styles.ctaText}>
                  Cart{itemCount > 0 ? ` · ${itemCount}` : ''}
                </Text>
              </Pressable>
            </Link>
            <Link href="/qr/LC-2026-0142" asChild>
              <Pressable style={styles.ctaGhost}>
                <Text style={styles.ctaGhostText}>Pack story</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.catalogue}>
          {SECTION_ORDER.map((section) => {
            const meta = SECTION_META[section];
            const items = products.filter((p) => p.section === section);
            return (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{meta.title}</Text>
                <Text style={styles.sectionBlurb}>{meta.blurb}</Text>
                {items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.forestDeep,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  menuCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
  },
  heroGrain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.wood,
    opacity: 0.12,
  },
  slogan: {
    ...type.slogan,
    color: colors.gold,
    marginTop: 18,
    textAlign: 'center',
  },
  heroLine: {
    ...type.body,
    color: colors.parchment,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cta: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ctaText: {
    ...type.bodyStrong,
    color: colors.forestDeep,
  },
  ctaGhost: {
    borderWidth: 1.5,
    borderColor: colors.goldSoft,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  ctaGhostText: {
    ...type.bodyStrong,
    color: colors.goldSoft,
  },
  catalogue: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    ...type.section,
    color: colors.forestDeep,
  },
  sectionBlurb: {
    ...type.body,
    color: colors.inkSoft,
    marginBottom: 16,
    marginTop: 4,
  },
});
