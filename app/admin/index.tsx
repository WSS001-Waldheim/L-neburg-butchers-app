import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { WoodBackground } from '../../src/components/WoodBackground';
import { useCatalog } from '../../src/context/CatalogContext';
import { useOrders } from '../../src/context/OrdersContext';
import { usePopLocations } from '../../src/context/PopLocationsContext';
import { isDemoMode } from '../../src/config/demo';
import { usePartnerApplications } from '../../src/context/PartnerApplicationsContext';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

const LINKS = [
  {
    href: '/admin/products',
    title: 'Products',
    blurb: 'CRUD prices, photos, stock & next arrival',
  },
  {
    href: '/admin/orders',
    title: 'Orders',
    blurb: 'Paid, confirmed, left the butchery, at pickup, collected',
  },
  {
    href: '/admin/pops',
    title: 'POP locations',
    blurb: 'Approve, then activate. Only active points are on the shop',
  },
  {
    href: '/admin/applications',
    title: 'Partner applications',
    blurb: 'Manual approve / reject · no auto-approve',
  },
] as const;

export default function AdminHubScreen() {
  const { user, loginAs } = useAuth();
  const router = useRouter();
  const { products } = useCatalog();
  const { orders } = useOrders();
  const { pops, activePops } = usePopLocations();
  const { applications } = usePartnerApplications();
  const pending = applications.filter(
    (a) => a.status === 'pending_review'
  ).length;

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
        <Text style={styles.heading}>Admin</Text>
        <Text style={styles.hint}>
          Mobile ops for Lüneburg — catalogue, fulfilment, POPs, partner queue.
        </Text>

        <View style={styles.stats}>
          <Stat label="Products" value={String(products.length)} />
          <Stat label="Orders" value={String(orders.length)} />
          <Stat
            label="Active POPs"
            value={`${activePops.length}/${pops.length}`}
          />
          <Stat label="Pending apps" value={String(pending)} />
        </View>

        {LINKS.map((link) => (
          <Pressable
            key={link.href}
            style={styles.row}
            onPress={() => router.push(link.href)}
          >
            <Text style={styles.rowTitle}>{link.title}</Text>
            <Text style={styles.rowBlurb}>{link.blurb}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </WoodBackground>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  emptyText: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  heading: { ...type.hero, color: colors.forestDeep, fontSize: 36 },
  hint: { ...type.caption, color: colors.inkSoft, marginTop: 8, marginBottom: 18 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  stat: {
    minWidth: '45%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(27, 61, 47, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  statValue: { ...type.title, color: colors.forestDeep, fontSize: 22 },
  statLabel: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.28)',
  },
  rowTitle: { ...type.title, color: colors.forestDeep, fontSize: 22 },
  rowBlurb: { ...type.caption, color: colors.inkSoft, marginTop: 4 },
});
