import { Link, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BrandLogo } from '../../src/components/BrandLogo';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCatalog } from '../../src/context/CatalogContext';
import { getBatchByQr } from '../../src/data/seed';
import { formatPrice } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/**
 * Web-friendly QR landing — personal animal/batch story + carcass info.
 * Pack QR opens /qr/:code (e.g. /qr/LC-2026-0142).
 */
export default function QrLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { productsForBatch } = useCatalog();
  const batch = getBatchByQr(String(code ?? ''));
  const packs = batch ? productsForBatch(batch.id) : [];
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  if (!batch) {
    return (
      <WoodBackground style={styles.missing}>
        <Stack.Screen options={{ title: 'Pack story' }} />
        <Text style={styles.missingTitle}>We could not find this pack</Text>
        <Text style={styles.missingBody}>
          Code “{code}” is not linked to a carcass or batch yet.
        </Text>
        <Link href="/" asChild>
          <PrimaryButton label="Visit the butchery catalogue" onPress={() => undefined} />
        </Link>
      </WoodBackground>
    );
  }

  return (
    <WoodBackground>
      <Stack.Screen options={{ title: batch.carcassNumber }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
        ]}
      >
        <View style={styles.hero}>
          <BrandLogo size={wide ? 'hero' : 'compact'} />
          <Animated.Text style={[styles.slogan, { opacity: fade }]}>
            No Compromise on Quality
          </Animated.Text>
          <Text style={styles.heroTitle}>The animal behind this pack</Text>
          <Text style={styles.heroSub}>
            Father and brother Ruben — Ouderdam Farm, Lydenburg.
          </Text>
        </View>

        <View style={[styles.grid, wide && styles.gridWide]}>
          <View style={[styles.col, wide && styles.colWide]}>
            <Text style={styles.sectionTitle}>Story</Text>
            <Text style={styles.story}>{batch.story}</Text>
            <Text style={styles.butcherNote}>{batch.butchersNote}</Text>
          </View>

          <View style={[styles.col, wide && styles.colWide, styles.metaPanel]}>
            <Text style={styles.sectionTitle}>Carcass / batch</Text>
            <MetaRow label="Carcass" value={batch.carcassNumber} />
            <MetaRow label="Ear tag" value={batch.earTag} />
            <MetaRow label="QR" value={batch.qrCode} />
            <MetaRow label="Breed" value={batch.breed} />
            <MetaRow label="Born" value={batch.bornAt} />
            <MetaRow label="Raised" value={batch.raisedAt} />
            <MetaRow label="Finished" value={batch.finishedAt} />
            <MetaRow label="Processed" value={batch.processedAt} />
          </View>
        </View>

        {packs.length > 0 ? (
          <View style={styles.packs}>
            <Text style={styles.sectionTitle}>Packs from this carcass</Text>
            {packs.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} style={styles.packLink}>
                <Text style={styles.packName}>{p.name}</Text>
                <Text style={styles.packMeta}>
                  {formatPrice(p.priceCents)} · {p.unitLabel}
                </Text>
              </Link>
            ))}
          </View>
        ) : null}

        <Link href="/" asChild>
          <PrimaryButton
            label="Browse the catalogue"
            onPress={() => undefined}
            style={{ marginTop: 28 }}
          />
        </Link>
      </ScrollView>
    </WoodBackground>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 56,
  },
  contentWide: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    backgroundColor: colors.forestDeep,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  slogan: {
    ...type.slogan,
    color: colors.gold,
    marginTop: 16,
    textAlign: 'center',
  },
  heroTitle: {
    ...type.hero,
    color: colors.white,
    marginTop: 18,
    textAlign: 'center',
  },
  heroSub: {
    ...type.body,
    color: colors.parchment,
    marginTop: 8,
    textAlign: 'center',
  },
  grid: {
    padding: 20,
    gap: 24,
  },
  gridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  colWide: {
    flex: 1,
  },
  metaPanel: {
    padding: 16,
    backgroundColor: 'rgba(27, 61, 47, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  sectionTitle: {
    ...type.section,
    color: colors.forestDeep,
    marginBottom: 10,
  },
  story: {
    ...type.body,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 26,
  },
  butcherNote: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 14,
    fontStyle: 'italic',
  },
  metaRow: {
    marginBottom: 10,
  },
  metaLabel: {
    ...type.label,
    color: colors.goldMuted,
    fontSize: 10,
  },
  metaValue: {
    ...type.body,
    color: colors.forestDeep,
    marginTop: 2,
  },
  packs: {
    paddingHorizontal: 20,
  },
  packLink: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107, 68, 35, 0.25)',
  },
  packName: {
    ...type.title,
    color: colors.forestDeep,
    fontSize: 18,
  },
  packMeta: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  missingTitle: {
    ...type.section,
    color: colors.forestDeep,
    textAlign: 'center',
  },
  missingBody: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 8,
  },
});
