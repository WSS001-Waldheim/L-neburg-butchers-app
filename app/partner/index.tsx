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
import { isDemoMode } from '../../src/config/demo';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { storeStatusLabel } from '../../src/data/storeStatus';
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
          Approved pickup partners see the orders assigned here.
        </Text>
        {isDemoMode() ? (
          <PrimaryButton
            label="Login as POP partner"
            onPress={() => loginAs('pop_partner')}
          />
        ) : null}
      </WoodBackground>
    );
  }

  const pop = findPop(user.popId);
  const queue = partnerOrders(user.popId);

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{pop?.name ?? 'POP'} · assigned orders</Text>
        <Text style={styles.hint}>
          Orders assigned to this pickup point. When the customer arrives, enter
          the collection code from their order and mark it collected.
        </Text>

        {queue.length === 0 ? (
          <Text style={styles.emptyText}>
            No orders waiting for collection.
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
                Status: {storeStatusLabel(o.storeStatus)}
              </Text>
              <Text style={styles.meta}>
                Items:{' '}
                {o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}
              </Text>
              {o.storeStatus === 'left_butchery' ? (
                <Text style={styles.hint}>
                  On the way. Collection opens when the butchery marks it ready
                  at this pickup point.
                </Text>
              ) : null}

              {o.storeStatus === 'at_pop' ? (
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
                      void (async () => {
                        try {
                          setError(null);
                          await markCollected(
                            o.id,
                            user,
                            codeByOrder[o.id] ?? '',
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error ? e.message : 'Could not collect',
                          );
                        }
                      })();
                    }}
                    style={{ marginTop: 8 }}
                  />
                  <Pressable
                    onPress={() => {
                      void advanceFulfilment(o.id, 'no_show', user, 'No-show').catch(
                        () => undefined,
                      );
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
