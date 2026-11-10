import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function PartnerDashboardScreen() {
  const { user, loginAs } = useAuth();
  const { partnerOrders, markCollected, advanceFulfilment } = useOrders();
  const { findPop } = usePopLocations();
  const router = useRouter();
  const [codeByOrder, setCodeByOrder] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== 'pop_partner' || !user.popId) {
    return (
      <WoodBackground style={styles.empty}>
        <Text style={styles.emptyText}>
          Switch to the POP partner demo role to see assigned orders.
        </Text>
        <PrimaryButton
          label="Login as POP partner"
          onPress={() => loginAs('pop_partner')}
        />
      </WoodBackground>
    );
  }

  const pop = findPop(user.popId);
  const queue = partnerOrders(user.popId);

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{pop?.name ?? 'POP'} dashboard</Text>
        <Text style={styles.hint}>
          Hand-over only — no prices. Mark collected with the customer’s code.
        </Text>

        {queue.length === 0 ? (
          <Text style={styles.emptyText}>
            No assigned orders in hand-over states. As admin, advance a POP order
            to dispatched / ready first.
          </Text>
        ) : (
          queue.map((o) => (
            <View key={o.id} style={styles.card}>
              <Text style={styles.ref}>{o.orderRef}</Text>
              <Text style={styles.meta}>
                {o.customerName.split(' ')[0]}{' '}
                {(o.customerName.split(' ')[1] ?? '').slice(0, 1)}.
              </Text>
              <Text style={styles.meta}>
                Status: {o.fulfilmentStatus.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.meta}>
                Items:{' '}
                {o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}
              </Text>
              {o.collectionCode ? (
                <Text style={styles.code}>Code on order: {o.collectionCode}</Text>
              ) : null}

              {o.fulfilmentStatus === 'dispatched_to_pop' && user.role === 'pop_partner' ? (
                <Text style={styles.hint}>
                  Waiting for admin to mark ready_for_collection (v1).
                </Text>
              ) : null}

              {o.fulfilmentStatus === 'ready_for_collection' ? (
                <>
                  <TextInput
                    placeholder="Enter collection code"
                    placeholderTextColor={colors.woodLight}
                    value={codeByOrder[o.id] ?? ''}
                    onChangeText={(t) =>
                      setCodeByOrder((m) => ({ ...m, [o.id]: t }))
                    }
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                  <PrimaryButton
                    label="Mark collected"
                    onPress={() => {
                      try {
                        setError(null);
                        markCollected(
                          o.id,
                          user,
                          codeByOrder[o.id] ?? o.collectionCode ?? ''
                        );
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : 'Could not collect'
                        );
                      }
                    }}
                    style={{ marginTop: 8 }}
                  />
                  <Pressable
                    onPress={() => {
                      try {
                        advanceFulfilment(o.id, 'no_show', user, 'No-show');
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    <Text style={styles.noshow}>Mark no-show</Text>
                  </Pressable>
                </>
              ) : null}

              <Pressable onPress={() => router.push(`/order/${o.id}`)}>
                <Text style={styles.link}>View order</Text>
              </Pressable>
            </View>
          ))
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  ref: { ...type.title, color: colors.forestDeep, fontSize: 20 },
  meta: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
  code: { ...type.bodyStrong, color: colors.wood, marginTop: 8 },
  input: {
    ...type.body,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.woodWash,
    padding: 10,
    marginTop: 10,
    color: colors.ink,
  },
  noshow: {
    ...type.caption,
    color: colors.danger,
    marginTop: 10,
  },
  link: { ...type.bodyStrong, color: colors.forest, marginTop: 10 },
  error: { ...type.caption, color: colors.danger, marginTop: 12 },
});
