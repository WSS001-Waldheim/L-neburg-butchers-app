# iOS capability placeholders (do not invent secrets)

Enable these in Apple Developer / App Store Connect **after** real IDs exist. Adding fake entitlements to `app.json` before the portal resources exist will fail EAS provisioning.

## Suggested identifiers

| Item | Suggested value | Where to create |
| --- | --- | --- |
| Bundle ID | `co.wssfarming.luneburg` | Apple Developer → Identifiers → App IDs |
| Merchant ID | `merchant.co.wssfarming.luneburg` | Apple Developer → Identifiers → Merchant IDs |
| Apple Team ID | *(10-character team id)* | [developer.apple.com/account](https://developer.apple.com/account) → Membership |
| ASC App ID | *(numeric Apple ID)* | App Store Connect → App → App Information → Apple ID |
| EAS project ID | *(UUID)* | `npx eas-cli@latest init` / expo.dev project |

## Apple Pay — add to `app.json` only after Merchant ID exists

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.developer.in-app-payments": [
          "merchant.co.wssfarming.luneburg"
        ]
      }
    }
  }
}
```

Also set `EXPO_PUBLIC_APPLE_MERCHANT_ID=merchant.co.wssfarming.luneburg` (already in `eas.json` build env for production/testflight). Payment adapters stay stubbed until PassKit / backend are wired.

## Push notifications — add when `expo-notifications` ships

```bash
npx expo install expo-notifications expo-device
```

Then add the `expo-notifications` config plugin and let EAS manage the push entitlement / APS environment. Keep `NSUserNotificationsUsageDescription` (already in `infoPlist`).

## Submit profile placeholders (`eas.json`)

Replace before non-interactive submit:

- `appleId` — Apple ID email for the Developer account
- `ascAppId` — App Store Connect numeric Apple ID
- `appleTeamId` — 10-character Team ID

Prefer an App Store Connect API key via `eas credentials` over app-specific passwords for CI.
