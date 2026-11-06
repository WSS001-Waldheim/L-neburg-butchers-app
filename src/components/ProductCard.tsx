import { Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../data/types';
import { formatPrice, getStockStatus } from '../data/types';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { StockMessage } from './StockMessage';

type Props = {
  product: Product,
  index?: number;
};

const CUT_TONES: Record<string, string> = {
  ribeye: '#5C2E1F',
  sirloin: '#6B3A28',
  fillet: '#4A2A22',
  rump: '#7A4030',
  'braai-box': '#3D4A2E',
  'braai-weekend': '#455232',
  boerewors: '#5A3C28',
  medwurst: '#4E3A2C',
  bratwurst: '#554032',
  buddhawurst: '#483628',
};

export function ProductCard({ product, index = 0 }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const status = getStockStatus(product);
  const muted = status === 'out_of_stock';

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index * 70, 420),
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: fade,
          transform: [
            {
              translateY: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Link href={`/product/${product.id}`} asChild>
        <Pressable
          style={({ pressed }) => [
            styles.press,
            pressed && styles.pressed,
            muted && styles.muted,
          ]}
        >
          <View
            style={[
              styles.swatch,
              {
                backgroundColor:
                  CUT_TONES[product.imageHint] ?? colors.wood,
              },
            ]}
          >
            <Text style={styles.swatchLabel}>
              {product.photoUri ? 'photo' : product.imageHint}
            </Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {product.unitLabel}
              {product.cutNotes ? ` · ${product.cutNotes}` : ''}
            </Text>
            <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
            <StockMessage product={product} compact />
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  press: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  muted: {
    opacity: 0.72,
  },
  swatch: {
    width: 88,
    minHeight: 96,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  swatchLabel: {
    ...type.label,
    color: colors.parchment,
    fontSize: 9,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107, 68, 35, 0.25)',
    paddingBottom: 12,
  },
  name: {
    ...type.title,
    color: colors.forestDeep,
    fontSize: 20,
  },
  meta: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  price: {
    ...type.bodyStrong,
    color: colors.wood,
    marginTop: 6,
  },
});
