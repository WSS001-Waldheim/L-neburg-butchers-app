import 'react-native-gesture-handler';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/auth/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { OrdersProvider } from '../src/context/OrdersContext';
import { colors } from '../src/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_600SemiBold_Italic,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <OrdersProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.forestDeep },
                headerTintColor: colors.gold,
                headerTitleStyle: {
                  fontFamily: 'CormorantGaramond_600SemiBold',
                  fontSize: 20,
                  color: colors.white,
                },
                contentStyle: { backgroundColor: colors.parchment },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
              <Stack.Screen name="cart" options={{ title: 'Cart' }} />
              <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
              <Stack.Screen name="order/[id]" options={{ title: 'Order status' }} />
              <Stack.Screen name="qr/[code]" options={{ title: 'From the pack' }} />
              <Stack.Screen name="profile" options={{ title: 'Profile' }} />
              <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
              <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="help" options={{ title: 'Help / Support' }} />
              <Stack.Screen name="partner/index" options={{ title: 'POP dashboard' }} />
              <Stack.Screen name="partner/apply" options={{ title: 'Become a partner' }} />
              <Stack.Screen
                name="admin/applications"
                options={{ title: 'Partner applications' }}
              />
            </Stack>
          </OrdersProvider>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
