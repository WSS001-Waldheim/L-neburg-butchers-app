/**
 * Demo role switch and demo accounts.
 * On in development, or when EXPO_PUBLIC_DEMO is set to a truthy value.
 */
export function isDemoMode(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  const flag = process.env.EXPO_PUBLIC_DEMO;
  if (flag == null || flag.trim() === '') return false;
  const normalised = flag.trim().toLowerCase();
  return normalised !== '0' && normalised !== 'false' && normalised !== 'off';
}
