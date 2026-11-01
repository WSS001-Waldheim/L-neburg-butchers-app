import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { WoodBackground } from '../src/components/WoodBackground';
import { useOrders } from '../src/context/OrdersContext';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function NotificationsScreen() {
  const { inbox } = useOrders();

  return (
    <WoodBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Notifications</Text>
        <Text style={styles.hint}>
          Stub inbox (Expo push not live). Order milestones land here after
          status changes.
        </Text>
        {inbox.length === 0 ? (
          <Text style={styles.empty}>No stub pushes yet.</Text>
        ) : (
          [...inbox].reverse().map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>{item.rendered.title}</Text>
              <Text style={styles.body}>{item.rendered.body}</Text>
              <Text style={styles.meta}>
                {item.rendered.eventType} ·{' '}
                {new Date(item.createdAt).toLocaleString('en-ZA')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </WoodBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  heading: { ...type.section, color: colors.forestDeep },
  hint: { ...type.caption, color: colors.inkSoft, marginVertical: 10 },
  empty: { ...type.body, color: colors.inkSoft },
  card: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107,68,35,0.25)',
  },
  title: { ...type.bodyStrong, color: colors.forestDeep },
  body: { ...type.body, color: colors.ink, marginTop: 4 },
  meta: { ...type.caption, color: colors.woodLight, marginTop: 4 },
});
