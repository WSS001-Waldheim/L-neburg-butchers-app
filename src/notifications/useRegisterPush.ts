/**
 * Expo push registration sketch.
 * No live push — stub mode returns a fake token without calling native APIs.
 *
 * When merging into the app:
 *   import * as Notifications from 'expo-notifications';
 *   import * as Device from 'expo-device';
 *   import Constants from 'expo-constants';
 */

import type { DevicePushToken, NotificationsMode } from './types';

export type RegisterPushResult =
  | { ok: true; token: DevicePushToken; mode: NotificationsMode }
  | { ok: false; reason: 'stub' | 'denied' | 'not_device' | 'missing_project_id' };

function readMode(): NotificationsMode {
  const raw =
    (typeof process !== 'undefined' &&
      process.env?.EXPO_PUBLIC_NOTIFICATIONS_MODE) ||
    'stub';
  if (raw === 'sandbox' || raw === 'live') return raw;
  return 'stub';
}

/**
 * Request permission + obtain Expo push token.
 * Stub: never prompts; returns synthetic token for wiring tests.
 */
export async function registerForPushAsync(args: {
  userId: string;
  platform: 'ios' | 'android';
}): Promise<RegisterPushResult> {
  const mode = readMode();

  if (mode === 'stub') {
    return {
      ok: true,
      mode: 'stub',
      token: {
        userId: args.userId,
        expoPushToken: `ExponentPushToken[stub-${args.userId.slice(0, 8)}]`,
        platform: args.platform,
        active: true,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // --- Live / sandbox sketch (do not execute without expo-notifications installed) ---
  //
  // if (!Device.isDevice) return { ok: false, reason: 'not_device' };
  //
  // const { status: existing } = await Notifications.getPermissionsAsync();
  // let final = existing;
  // if (existing !== 'granted') {
  //   const req = await Notifications.requestPermissionsAsync();
  //   final = req.status;
  // }
  // if (final !== 'granted') return { ok: false, reason: 'denied' };
  //
  // const projectId =
  //   Constants.easConfig?.projectId ??
  //   process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  // if (!projectId) return { ok: false, reason: 'missing_project_id' };
  //
  // const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
  //   projectId,
  // });
  //
  // // Android channel
  // if (Platform.OS === 'android') {
  //   await Notifications.setNotificationChannelAsync('order_status', {
  //     name: 'Order status',
  //     importance: Notifications.AndroidImportance.HIGH,
  //   });
  // }
  //
  // await fetch(`${API}/devices/push-token`, {
  //   method: 'POST',
  //   body: JSON.stringify({ expoPushToken, platform: args.platform }),
  // });
  //
  // return { ok: true, mode, token: { … } };

  return { ok: false, reason: 'stub' };
}

/**
 * React hook sketch — replace with real useState/useEffect in app.
 *
 * export function useRegisterPush(userId: string | undefined) {
 *   const [token, setToken] = useState<DevicePushToken | null>(null);
 *   useEffect(() => {
 *     if (!userId) return;
 *     void registerForPushAsync({
 *       userId,
 *       platform: Platform.OS === 'ios' ? 'ios' : 'android',
 *     }).then((r) => { if (r.ok) setToken(r.token); });
 *   }, [userId]);
 *   return token;
 * }
 */
export function useRegisterPushSketch(): {
  register: typeof registerForPushAsync;
  mode: NotificationsMode;
} {
  return { register: registerForPushAsync, mode: readMode() };
}
