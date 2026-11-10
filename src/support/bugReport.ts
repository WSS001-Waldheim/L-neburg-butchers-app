import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const BUG_REPORT_EMAIL = 'Karl@Wssfarming.co.za';
export const BUG_REPORT_SUBJECT = 'Lüneburg app bug report';

/** mailto with version, platform, OS, and device model already filled in. */
export function buildBugReportMailto(): string {
  const version =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    'unknown';
  const build = Application.nativeBuildVersion;
  const versionLine = build ? `${version} (${build})` : version;
  const body = [
    'Please describe what went wrong:',
    '',
    '',
    '---',
    `App version: ${versionLine}`,
    `Platform: ${Platform.OS}`,
    `OS version: ${Device.osVersion ?? 'unknown'}`,
    `Device model: ${Device.modelName ?? 'unknown'}`,
  ].join('\n');

  return `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(
    BUG_REPORT_SUBJECT
  )}&body=${encodeURIComponent(body)}`;
}
