# TestFlight — first iOS build

Contact for testers / review: **Karl@Wssfarming.co.za**

## Placeholders (fill before / during first run)

| Placeholder | Suggested / notes |
| --- | --- |
| Bundle ID | `co.wssfarming.luneburg` (set in `app.json`; register same ID in Apple Developer) |
| Version | `1.0.0` |
| iOS build number | `1` (EAS `production` / `testflight` profiles use `autoIncrement`) |
| Apple Team ID | `REPLACE_WITH_APPLE_TEAM_ID` in `eas.json` submit profile |
| ASC App ID | `REPLACE_WITH_ASC_APP_ID` (App Store Connect → App Information → Apple ID) |
| Apple ID email | `REPLACE_WITH_APPLE_ID_EMAIL` |
| Merchant ID | `merchant.co.wssfarming.luneburg` — create in portal, then enable entitlement (see [ios-capabilities.placeholders.md](./ios-capabilities.placeholders.md)) |
| EAS project ID | Created by `npx eas-cli@latest init` — do not invent |

**No real Apple secrets belong in this repo.** Use EAS credentials / App Store Connect API keys locally or in Expo Secrets.

## Prerequisites

1. Apple Developer Program ($99/yr) for the WSS Farming / Lüneburg org (or individual).
2. Expo account that will own the EAS project (farm-owned, not a throwaway).
3. Node.js + repo clone; run `npm install`.
4. Register App ID `co.wssfarming.luneburg` in Apple Developer (or let EAS create it on first build when logged in).

## One-shot (recommended)

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init          # once — links Expo project, writes projectId into app config
chmod +x scripts/eas-testflight.sh
./scripts/eas-testflight.sh      # eas build --platform ios --profile testflight --auto-submit
```

Or manually:

```bash
npx eas-cli@latest build --platform ios --profile testflight --auto-submit
```

Shorthand alternative from Expo docs: `npx testflight` (creates credentials, builds production, submits for internal TestFlight).

## After upload

1. Wait for App Store Connect email that processing finished (~5–15 minutes).
2. Answer **export compliance** if prompted — app config already sets `ios.config.usesNonExemptEncryption: false` (HTTPS-only).
3. **TestFlight → Internal Testing** — invite `Karl@Wssfarming.co.za` and other App Store Connect team members.
4. External testers need Beta App Review + feedback email / beta description (use the review placeholder below).

## TestFlight / App Review notes (placeholder — paste & edit)

```
Lüneburg Country Butchery — TestFlight build 1.0.0

Contact: Karl@Wssfarming.co.za

What to test:
- Browse Premium VSP / Braai Boxes / Sausages
- Product detail + next-arrival when low stock
- Cart → checkout (contact, POP selection, pack-check)
- Place order with STUB payments (no live Apple Pay / Yoco charges)
- Order status / timeline screens
- Optional: allow location when prompted to suggest nearest Point of Pickup

Demo / review account: PLACEHOLDER (stub auth — no password required for this build; use in-app demo roles if shown)

Payments: EXPO_PUBLIC_PAYMENTS_MODE=stub — Apple Pay Merchant ID reserved as merchant.co.wssfarming.luneburg but not live.

Privacy: location when-in-use only for nearest POP; notifications stubbed pending expo-notifications wiring.
```

## Testers (starter list)

| Role | Email |
| --- | --- |
| Owner / primary | Karl@Wssfarming.co.za |
| Additional | *(add Ruben / family / factory as ASC users)* |

## Icon & splash

Basic branded assets ship under `assets/` (forest green + gold “L” / Est. 1946). Replace with final oval logo from Drive when the PDF arrives — keep 1024×1024 `icon.png`.

## Related

- Capability enablement: [ios-capabilities.placeholders.md](./ios-capabilities.placeholders.md)
- Full store checklist (Cursor Project): store-submission-checklist.md
