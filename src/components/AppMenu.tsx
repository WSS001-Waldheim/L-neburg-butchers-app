import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isDemoAccount, useAuth } from '../auth/AuthContext';
import { isDemoMode } from '../config/demo';
import { buildBugReportMailto } from '../support/bugReport';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

type Props = {
  /** Light icon on dark hero backgrounds */
  light?: boolean;
};

export function AppMenuButton({ light }: Props) {
  const [open, setOpen] = useState(false);
  const { user, logout, loginAs } = useAuth();
  const router = useRouter();

  const showDemo = isDemoMode();
  const go = (href: string) => {
    setOpen(false);
    router.push(href as `/`);
  };
  const reportBug = () => {
    setOpen(false);
    Linking.openURL(buildBugReportMailto()).catch(() => undefined);
  };
  const identity = !user
    ? 'Signed out'
    : showDemo || !isDemoAccount(user)
      ? `${user.name} · ${user.role.replace('_', ' ')}`
      : 'Signed in';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.burger}
        accessibilityLabel="Open menu"
      >
        <View style={[styles.bar, light && styles.barLight]} />
        <View style={[styles.bar, light && styles.barLight]} />
        <View style={[styles.bar, light && styles.barLight]} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Menu</Text>
            <Text style={styles.roleLine}>{identity}</Text>

            <MenuItem label="Profile" onPress={() => go('/profile')} />
            <MenuItem label="My Orders" onPress={() => go('/orders')} />
            <MenuItem
              label="Notifications"
              onPress={() => go('/notifications')}
            />
            <MenuItem label="Settings" onPress={() => go('/settings')} />
            <MenuItem label="Help / Support" onPress={() => go('/help')} />
            <MenuItem label="Report a bug" onPress={reportBug} />
            <MenuItem label="Share app" onPress={() => go('/share')} />

            {user?.role === 'pop_partner' ? (
              <MenuItem
                label="POP dashboard"
                onPress={() => go('/partner')}
              />
            ) : null}
            {user?.role === 'admin' ? (
              <MenuItem
                label="Admin dashboard"
                onPress={() => go('/admin')}
              />
            ) : null}
            {user?.role === 'customer' || !user ? (
              <MenuItem
                label="Become a POP partner"
                onPress={() => go('/partner/apply')}
              />
            ) : null}

            {showDemo ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.demoLabel}>Demo role switch</Text>
                <View style={styles.roleRow}>
                  {(['customer', 'pop_partner', 'admin'] as const).map((r) => (
                    <Pressable
                      key={r}
                      style={[
                        styles.roleChip,
                        user?.role === r && styles.roleChipOn,
                      ]}
                      onPress={() => loginAs(r)}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          user?.role === r && styles.roleChipTextOn,
                        ]}
                      >
                        {r === 'pop_partner' ? 'POP' : r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Pressable
              style={styles.logout}
              onPress={() => {
                logout();
                setOpen(false);
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>

            <Link href="/" asChild>
              <Pressable onPress={() => setOpen(false)} style={styles.close}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </Link>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({
  label,
  onPress,
}: {
  label: string,
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  burger: {
    padding: 10,
    gap: 5,
    zIndex: 20,
  },
  bar: {
    width: 22,
    height: 2,
    backgroundColor: colors.forestDeep,
  },
  barLight: {
    backgroundColor: colors.gold,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 36, 23, 0.55)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 48,
    paddingRight: 12,
  },
  sheet: {
    width: 300,
    maxWidth: '92%',
    backgroundColor: colors.mist,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  sheetTitle: {
    ...type.section,
    color: colors.forestDeep,
  },
  roleLine: {
    ...type.caption,
    color: colors.inkSoft,
    marginBottom: 12,
    marginTop: 4,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.25)',
  },
  itemText: {
    ...type.bodyStrong,
    color: colors.forestDeep,
  },
  divider: {
    height: 1,
    backgroundColor: colors.woodWash,
    marginVertical: 12,
  },
  demoLabel: {
    ...type.label,
    color: colors.forest,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleChipOn: {
    backgroundColor: colors.forest,
  },
  roleChipText: {
    ...type.caption,
    color: colors.forest,
    textTransform: 'capitalize',
  },
  roleChipTextOn: {
    color: colors.white,
  },
  logout: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
  },
  logoutText: {
    ...type.bodyStrong,
    color: colors.white,
  },
  close: {
    marginTop: 10,
    alignItems: 'center',
    padding: 8,
  },
  closeText: {
    ...type.caption,
    color: colors.inkSoft,
  },
});
