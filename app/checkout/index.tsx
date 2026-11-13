import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isDemoMode } from '../../src/config/demo';
import { useAuth } from '../../src/auth/AuthContext';
import { AccountForm } from '../../src/components/AccountForm';
import { ColdChainNotice, OrderCutoffNotice } from '../../src/components/OrderNotices';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StoreColumn } from '../../src/components/StoreColumn';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCart } from '../../src/context/CartContext';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { isSupabaseConfigured } from '../../src/data/supabaseClient';
import { LOCAL_DELIVERY_TOWNS } from '../../src/data/seed';
import type { FulfilmentMethod } from '../../src/data/types';
import { formatPrice } from '../../src/data/types';
import {
  isYocoHostedCheckoutEnabled,
  redirectToYoco,
  yocoIsTestMode,
} from '../../src/payments/yocoCheckout';
import {
  customerHoursLine,
  customerVisibleLine,
} from '../../src/pop/customerCopy';
import { findNearestActivePop } from '../../src/pop/nearestPop';
import type { PopLocation } from '../../src/pop/types';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

/**
 * Checkout: contact → pickup → pack-check → Yoco hosted checkout.
 * Cards and Apple Pay (Safari on iPhone) both happen on Yoco’s page.
 */

export default function CheckoutScreen() {
  const { items, totalCents, clear } = useCart();
  const { placeOrder } = useOrders();
  const { activePops, findPop, pops: allPops } = usePopLocations();
  const { user, loginAs, liveSession } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [notes, setNotes] = useState('');
  const [fulfilment, setFulfilment] =
    useState<FulfilmentMethod>('pop_collect');
  const [popId, setPopId] = useState<string>(
    'ultimate-outdoor-piet-retief'
  );
  const [gpsNote, setGpsNote] = useState(
    'Select a pickup point, or allow location to suggest the nearest one.'
  );
  const [packCheck, setPackCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const yocoHosted = isYocoHostedCheckoutEnabled();
  const yocoTest = yocoIsTestMode();

  const pops = activePops;

  useEffect(() => {
    if (!pops.some((p) => p.id === popId)) {
      setPopId(pops[0]?.id ?? '');
    }
  }, [pops, popId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Optional GPS — fails soft on web / denied
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Location = require('expo-location') as {
          requestForegroundPermissionsAsync: () => Promise<{
            status: string;
          }>;
          getCurrentPositionAsync: () => Promise<{
            coords: { latitude: number; longitude: number };
          }>;
        };
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setGpsNote('Location denied — choose a pickup point.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync();
        if (cancelled) return;
        const nearest = findNearestActivePop(
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          allPops
        );
        if (nearest) {
          setPopId(nearest.pop.id);
          setGpsNote(
            `Nearest pickup: ${nearest.pop.name} (${nearest.pop.areaLabel}). You can choose another.`
          );
        }
      } catch {
        setGpsNote(
          Platform.OS === 'web'
            ? 'Ultimate Outdoor is selected. Choose another pickup point if you prefer.'
            : 'Could not read location — choose a pickup point.'
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allPops]);

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (name.trim().length < 2 || phone.trim().length < 6) return false;
    if (!packCheck) return false;
    if (fulfilment === 'pop_collect' && !popId) return false;
    if (!user) return false;
    return true;
  }, [items.length, name, phone, packCheck, fulfilment, popId, user]);

  if (items.length === 0) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Nothing to check out.</Text>
        <PrimaryButton label="Catalogue" onPress={() => router.push('/')} />
      </WoodBackground>
    );
  }

  if (!user) {
    return (
      <WoodBackground>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emptyText}>Sign in to place an order.</Text>
          {isSupabaseConfigured() ? <AccountForm /> : null}
          {isDemoMode() ? (
            <PrimaryButton
              label="Continue as demo customer"
              onPress={() => loginAs('customer')}
              variant="ghost"
              style={{ marginTop: 12 }}
            />
          ) : null}
        </ScrollView>
      </WoodBackground>
    );
  }

  const onPlace = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const customer = {
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        fulfilment,
        popId: fulfilment === 'pop_collect' ? popId : undefined,
        packCheckAcceptedAt: new Date().toISOString(),
        actor: user,
      };

      if (!yocoHosted) {
        setError(
          'Yoco test checkout is not configured yet. Set EXPO_PUBLIC_YOCO_PUBLIC_KEY and the Supabase anon key. The secret stays on Supabase.',
        );
        setSubmitting(false);
        return;
      }
      if (isSupabaseConfigured() && !liveSession) {
        setError('Sign in with your shop account before paying with Yoco.');
        setSubmitting(false);
        return;
      }
      const orderId =
        pendingOrderId ??
        (
          await placeOrder({ ...customer, deferPayment: true }, items)
        ).id;
      setPendingOrderId(orderId);
      await redirectToYoco(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setSubmitting(false);
    }
  };

  const selectedPop: PopLocation | undefined = findPop(popId);

  const payBar = (
    <PrimaryButton
      label="Pay with Yoco"
      onPress={onPlace}
      disabled={!canSubmit || !yocoHosted}
      loading={submitting}
    />
  );

  return (
    <WoodBackground>
      <StoreColumn sticky={payBar}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Your details</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor={colors.woodLight}
        />
        <Text style={styles.label}>Phone / WhatsApp</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor={colors.woodLight}
        />
        <Text style={styles.label}>Email (optional)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor={colors.woodLight}
        />

        <Text style={[styles.heading, { marginTop: 24 }]}>Fulfilment</Text>
        <Pressable
          onPress={() => setFulfilment('pop_collect')}
          style={[
            styles.option,
            fulfilment === 'pop_collect' && styles.optionSelected,
          ]}
        >
          <Text style={styles.optionTitle}>Collect at Point of Pickup</Text>
          <Text style={styles.optionDetail}>
            Choose an active pickup point below.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFulfilment('local_delivery')}
          style={[
            styles.option,
            fulfilment === 'local_delivery' && styles.optionSelected,
          ]}
        >
          <Text style={styles.optionTitle}>Free local delivery</Text>
          <Text style={styles.optionDetail}>
            {LOCAL_DELIVERY_TOWNS.join(', ')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFulfilment('whatsapp_pickup')}
          style={[
            styles.option,
            fulfilment === 'whatsapp_pickup' && styles.optionSelected,
          ]}
        >
          <Text style={styles.optionTitle}>WhatsApp + Piet Retief pickup</Text>
          <Text style={styles.optionDetail}>
            Order by WhatsApp and collect in Piet Retief.
          </Text>
        </Pressable>

        {fulfilment === 'pop_collect' ? (
          <View style={styles.popBlock}>
            <Text style={styles.label}>Point of Pickup</Text>
            <Text style={styles.hint}>{gpsNote}</Text>
            {pops.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setPopId(p.id)}
                style={[styles.option, popId === p.id && styles.optionSelected]}
              >
                <Text style={styles.optionTitle}>
                  {p.name} · {p.areaLabel}
                </Text>
                <Text style={styles.optionDetail}>
                  {[
                    customerVisibleLine(p.addressLine1),
                    customerVisibleLine(p.addressLine2),
                    p.city,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={styles.optionDetail}>
                  {customerHoursLine(p.hours.note)}
                </Text>
                {customerVisibleLine(p.collectionInstructions) ? (
                  <Text style={styles.optionDetail}>
                    {customerVisibleLine(p.collectionInstructions)}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            {selectedPop ? (
              <Text style={styles.hint}>
                Collecting at {selectedPop.name}, {selectedPop.addressLine1}.
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.heading, { marginTop: 24 }]}>Before you pay</Text>
        <OrderCutoffNotice compact />
        <ColdChainNotice />
        <Pressable
          onPress={() => setPackCheck((v) => !v)}
          style={[styles.option, packCheck && styles.optionSelected]}
        >
          <Text style={styles.optionTitle}>
            {packCheck ? '✓ ' : ''}I’ve checked this order
          </Text>
          <Text style={styles.optionDetail}>
            Once packed, we can’t take it back for ordering mistakes.
          </Text>
        </Pressable>

        <Text style={[styles.heading, { marginTop: 24 }]}>Pay with Yoco</Text>
        <Text style={styles.hint}>
          {yocoHosted
            ? `Card, or Apple Pay in Safari on iPhone. ${yocoTest ? 'Test mode.' : 'Live mode.'} Yoco’s page takes the payment. This screen is not the receipt — the order is marked paid when Yoco confirms it.`
            : 'Card, or Apple Pay in Safari on iPhone, on Yoco’s secure page. Test mode starts when the public test key and the Supabase anon key are set. YOCO_SECRET_KEY and YOCO_WEBHOOK_SECRET stay on Supabase, not in the app.'}
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Estimated total</Text>
          <Text style={styles.summaryValue}>{formatPrice(totalCents)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      </StoreColumn>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  emptyText: { ...type.body, color: colors.ink },
  heading: { ...type.section, color: colors.forestDeep, marginBottom: 12 },
  label: {
    ...type.label,
    color: colors.goldMuted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
  },
  hint: { ...type.caption, color: colors.inkSoft, marginBottom: 10 },
  option: {
    minHeight: 52,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(27, 61, 47, 0.25)',
    backgroundColor: 'rgba(255, 251, 243, 0.55)',
  },
  optionSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  optionTitle: { ...type.bodyStrong, color: colors.forestDeep },
  optionDetail: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  popBlock: { marginTop: 8 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.woodWash,
  },
  summaryLabel: { ...type.bodyStrong, color: colors.ink },
  summaryValue: { ...type.hero, color: colors.wood },
  error: { ...type.caption, color: colors.danger, marginTop: 10 },
});
