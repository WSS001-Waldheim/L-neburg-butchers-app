import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../../src/auth/AuthContext';
import { PrimaryButton } from '../../../src/components/PrimaryButton';
import { WoodBackground } from '../../../src/components/WoodBackground';
import { isDemoMode } from '../../../src/config/demo';
import { useCatalog } from '../../../src/context/CatalogContext';
import { BATCHES } from '../../../src/data/seed';
import type { ProductSection } from '../../../src/data/types';
import { getStockStatus } from '../../../src/data/types';
import { colors } from '../../../src/theme/colors';
import { type } from '../../../src/theme/typography';

const SECTIONS: { id: ProductSection; label: string }[] = [
  { id: 'premium-vsp', label: 'Premium VSP' },
  { id: 'braai-boxes', label: 'Braai Boxes' },
  { id: 'sausages', label: 'Sausages' },
];

function centsFromRandInput(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function randFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function AdminProductEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { user, loginAs } = useAuth();
  const { getProduct, upsertProduct, deleteProduct, loading } = useCatalog();
  const router = useRouter();
  const existing = !isNew ? getProduct(String(id)) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [section, setSection] = useState<ProductSection>(
    existing?.section ?? 'premium-vsp'
  );
  const [description, setDescription] = useState(existing?.description ?? '');
  const [priceRand, setPriceRand] = useState(
    existing ? randFromCents(existing.priceCents) : '0.00'
  );
  const [unitLabel, setUnitLabel] = useState(existing?.unitLabel ?? 'per pack');
  const [cutNotes, setCutNotes] = useState(existing?.cutNotes ?? '');
  const [imageHint, setImageHint] = useState(existing?.imageHint ?? 'cut');
  const [photoUri, setPhotoUri] = useState(existing?.photoUri ?? '');
  const [stockLevel, setStockLevel] = useState(
    String(existing?.stockLevel ?? 0)
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(existing?.lowStockThreshold ?? 4)
  );
  const [nextArrivalAt, setNextArrivalAt] = useState(
    existing?.nextArrivalAt
      ? existing.nextArrivalAt.slice(0, 16)
      : '2026-11-20T08:00'
  );
  const [carcassBatchId, setCarcassBatchId] = useState(
    existing?.carcassBatchId ?? ''
  );
  const [error, setError] = useState<string | null>(null);

  const previewStatus = useMemo(() => {
    const stock = Number(stockLevel) || 0;
    const low = Number(lowStockThreshold) || 0;
    return getStockStatus({
      id: 'preview',
      name: 'preview',
      section,
      description: '',
      priceCents: 0,
      unitLabel: '',
      imageHint: '',
      stockLevel: stock,
      lowStockThreshold: low,
      nextArrivalAt: nextArrivalAt ? new Date(nextArrivalAt).toISOString() : null,
      carcassBatchId: null,
    });
  }, [stockLevel, lowStockThreshold, nextArrivalAt, section]);

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

  if (!isNew && loading && !existing) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Loading product…</Text>
      </WoodBackground>
    );
  }

  if (!isNew && !existing) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Product not found.</Text>
        <PrimaryButton
          label="Back to products"
          onPress={() => router.replace('/admin/products')}
        />
      </WoodBackground>
    );
  }

  const save = async () => {
    try {
      setError(null);
      const stock = Math.max(0, Math.round(Number(stockLevel) || 0));
      const low = Math.max(0, Math.round(Number(lowStockThreshold) || 0));
      const arrivalIso = nextArrivalAt
        ? new Date(nextArrivalAt).toISOString()
        : null;
      if ((stock <= low || stock <= 0) && !arrivalIso) {
        setError('Low / out of stock products require a next arrival date.');
        return;
      }
      if (!name.trim()) {
        setError('Name is required.');
        return;
      }
      const saved = await upsertProduct({
        id: isNew ? undefined : existing!.id,
        name,
        section,
        description,
        priceCents: centsFromRandInput(priceRand),
        unitLabel,
        cutNotes: cutNotes || undefined,
        imageHint: imageHint || 'cut',
        photoUri: photoUri.trim() || null,
        stockLevel: stock,
        lowStockThreshold: low,
        nextArrivalAt: arrivalIso,
        carcassBatchId: carcassBatchId.trim() || null,
      });
      router.replace(`/admin/product/${saved.id}`);
      Alert.alert('Saved', `${saved.name} updated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete product?', existing.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteProduct(existing.id).then(() => {
            router.replace('/admin/products');
          });
        },
      },
    ]);
  };

  return (
    <WoodBackground>
      <Stack.Screen options={{ title: isNew ? 'New product' : 'Edit product' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Name" value={name} onChangeText={setName} />
        <Text style={styles.label}>Section</Text>
        <View style={styles.chips}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.chip, section === s.id && styles.chipOn]}
              onPress={() => setSection(s.id)}
            >
              <Text
                style={[styles.chipText, section === s.id && styles.chipTextOn]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label="Price (ZAR)"
          value={priceRand}
          onChangeText={setPriceRand}
          keyboardType="decimal-pad"
        />
        <Field label="Unit label" value={unitLabel} onChangeText={setUnitLabel} />
        <Field
          label="Cut notes"
          value={cutNotes}
          onChangeText={setCutNotes}
          placeholder="e.g. yellow fat · marbling"
        />
        <Field
          label="Photo swatch key"
          value={imageHint}
          onChangeText={setImageHint}
          placeholder="ribeye / braai-box / medwurst"
        />
        <Field
          label="Photo URL (optional)"
          value={photoUri}
          onChangeText={setPhotoUri}
          placeholder="https://… or leave blank for swatch"
          autoCapitalize="none"
        />
        <Field
          label="Stock level"
          value={stockLevel}
          onChangeText={setStockLevel}
          keyboardType="number-pad"
        />
        <Field
          label="Low-stock threshold"
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          keyboardType="number-pad"
        />
        <Field
          label="Next arrival (local datetime)"
          value={nextArrivalAt}
          onChangeText={setNextArrivalAt}
          placeholder="YYYY-MM-DDTHH:mm"
          autoCapitalize="none"
        />
        <Text style={styles.preview}>
          Stock status preview: {previewStatus.replace(/_/g, ' ')}
        </Text>

        <Text style={styles.label}>Carcass / batch (optional)</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !carcassBatchId && styles.chipOn]}
            onPress={() => setCarcassBatchId('')}
          >
            <Text
              style={[styles.chipText, !carcassBatchId && styles.chipTextOn]}
            >
              None
            </Text>
          </Pressable>
          {BATCHES.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.chip, carcassBatchId === b.id && styles.chipOn]}
              onPress={() => setCarcassBatchId(b.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  carcassBatchId === b.id && styles.chipTextOn,
                ]}
              >
                {b.carcassNumber}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Save product" onPress={save} style={{ marginTop: 16 }} />
        {!isNew ? (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete product</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </WoodBackground>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.woodLight}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 56 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: { ...type.body, color: colors.inkSoft },
  field: { marginBottom: 12 },
  label: { ...type.label, color: colors.goldMuted, marginBottom: 6, marginTop: 4 },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    padding: 12,
    color: colors.ink,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.forest },
  chipText: { ...type.caption, color: colors.forest },
  chipTextOn: { color: colors.white },
  preview: { ...type.caption, color: colors.inkSoft, marginBottom: 8 },
  error: { ...type.caption, color: colors.danger, marginTop: 8 },
  deleteBtn: { marginTop: 20, alignItems: 'center', padding: 12 },
  deleteText: { ...type.bodyStrong, color: colors.danger },
});
