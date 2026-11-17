import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ColdChainNotice, CollectionNotice } from '../../src/components/OrderNotices';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { StoreColumn } from '../../src/components/StoreColumn';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCart } from '../../src/context/CartContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { isSupabaseConfigured } from '../../src/data/supabaseClient';
import { formatPrice } from '../../src/data/types';
import {
  createYocoCheckout,
  isYocoHostedCheckoutEnabled,
  openHostedCheckout,
  rememberGuestToken,
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
 * Checkout: name, mobile, email, pickup point, then Yoco.
 * An account is optional. Card and Apple Pay happen on Yoco’s page.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CheckoutScreen() {
  const { items, totalCents } = useCart();
  const { activePops, findPop, pops: allPops } = usePopLocations();
  const { user, loginAs } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [popId, setPopId] = useState<string>('ultimate-outdoor-piet-retief');
  const [gpsNote, setGpsNote] = useState(
    'Ultimate Outdoor, Piet Retief, is selected. Choose another pickup point if you prefer.',
  );
  const [packCheck, setPackCheck] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIds = useRef(new Map<string, string>());
  const yocoHosted = isYocoHostedCheckoutEnabled();
  const yocoTest = yocoIsTestMode();

  const pops = activePops;

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name);
    setPhone((current) => current || user.phone);
    setEmail((current) => current || user.email || '');
  }, [user]);

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
          allPops,
        );
        if (nearest) {
          setPopId(nearest.pop.id);
          setGpsNote(
            `Nearest pickup: ${nearest.pop.name} (${nearest.pop.areaLabel}). You can choose another.`,
          );
        }
      } catch {
        setGpsNote(
          Platform.OS === 'web'
            ? 'Ultimate Outdoor is selected. Choose another pickup point if you prefer.'
            : 'Could not read location — choose a pickup point.',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allPops]);

  const emailOk = EMAIL_PATTERN.test(email.trim());
  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (name.trim().length < 2 || phone.trim().length < 6) return false;
    if (!emailOk) return false;
    if (!packCheck) return false;
    if (!popId) return false;
    return true;
  }, [items.length, name, phone, emailOk, packCheck, popId]);

  if (items.length === 0) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>Nothing to check out.</Text>
        <PrimaryButton label="Catalogue" onPress={() => router.push('/')} />
      </WoodBackground>
    );
  }

  const onPlace = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!yocoHosted || !isSupabaseConfigured()) {
        setError(
          'Payment is not available right now. Please try again in a little while.',
        );
        setSubmitting(false);
        return;
      }
      const cartKey = `${popId}|${email.trim().toLowerCase()}|${items
        .map((item) => `${item.productId}:${item.quantity}`)
        .join(',')}`;
      let clientRequestId = requestIds.current.get(cartKey);
      if (!clientRequestId) {
        clientRequestId = newRequestId();
        requestIds.current.set(cartKey, clientRequestId);
      }
      const result = await createYocoCheckout({
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        popId,
        lines: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        clientRequestId,
      });
      if (result.guestToken) rememberGuestToken(result.orderId, result.guestToken);
      await openHostedCheckout(result.redirectUrl);
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
        <Text style={styles.hint}>
          No account needed. We use your email for the receipt.
          {user
            ? ` Signed in as ${user.name}. This order is also saved to your account.`
            : ' Returning customers can sign in.'}
        </Text>
        {!user && isSupabaseConfigured() ? (
          <Pressable
            onPress={() => setShowSignIn((open) => !open)}
            style={styles.signIn}
            accessibilityRole="button"
          >
            <Text style={styles.signInText}>
              {showSignIn ? 'Hide sign in' : 'Have an account? Sign in'}
            </Text>
          </Pressable>
        ) : null}
        {showSignIn && !user ? <AccountForm /> : null}
        {!user && isDemoMode() ? (
          <PrimaryButton
            label="Continue as demo customer"
            onPress={() => loginAs('customer')}
            variant="ghost"
            style={{ marginTop: 8 }}
          />
        ) : null}

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoComplete="name"
          placeholderTextColor={colors.woodLight}
        />
        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          autoComplete="tel"
          placeholderTextColor={colors.woodLight}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          autoComplete="email"
          placeholderTextColor={colors.woodLight}
        />

        <Text style={[styles.heading, { marginTop: 24 }]}>Pickup point</Text>
        <Text style={styles.hint}>
          The price you see is the full price. Choose where you will collect.
        </Text>
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
        ) : (
          <Text style={styles.hint}>No pickup point is open yet.</Text>
        )}

        <Text style={[styles.heading, { marginTop: 24 }]}>Before you pay</Text>
        <CollectionNotice compact />
        <ColdChainNotice />
        <Pressable
          onPress={() => setPackCheck((v) => !v)}
          style={[styles.option, packCheck && styles.optionSelected]}
        >
          <Text style={styles.optionTitle}>
            {packCheck ? '✓ ' : ''}I’ve checked this order
          </Text>
          <Text style={styles.optionDetail}>
            Once packed, we can’t take it back for an ordering mistake.
          </Text>
        </Pressable>

        <Text style={[styles.heading, { marginTop: 24 }]}>Pay with Yoco</Text>
        <Text style={styles.hint}>
          {yocoHosted
            ? `Card, or Apple Pay in Safari on iPhone. ${yocoTest ? 'Test mode.' : 'Live mode.'} Yoco’s page takes the payment. This screen is not the receipt — the order is marked paid when Yoco confirms it.`
            : 'Card, or Apple Pay in Safari on iPhone, on Yoco’s page. Payment starts when the shop’s test keys are set.'}
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total</Text>
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
  signIn: { minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  signInText: { ...type.bodyStrong, color: colors.forest },
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
