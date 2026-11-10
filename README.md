# Lüneburg Country Butchery

Expo (React Native) shopping app for Android, iOS, and web — catalogue, cart, POP collection, stub payments (Apple Pay + Yoco adapters), order timeline, roles (customer / POP partner / admin), mobile admin dashboard, and pack QR story landing.

## Run

```bash
npm install
npx expo start
npx expo start --web
npx expo start --android
npx expo start --ios
```

## TestFlight (iOS)

Archive + upload is via **EAS** (no local Xcode required):

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # first time only
./scripts/eas-testflight.sh             # build + submit (profile: testflight)
```

- **Bundle ID:** `co.wssfarming.luneburg` (placeholder suggestion — register in Apple Developer)
- **Version:** `1.0.0` · **iOS build:** `1` (auto-increments on EAS production/testflight)
- **Merchant ID placeholder:** `merchant.co.wssfarming.luneburg` (create in portal before enabling Apple Pay entitlements)
- **TestFlight contact / review:** Karl@Wssfarming.co.za

Full steps, review-notes placeholder, and tester list: **[docs/TESTFLIGHT.md](./docs/TESTFLIGHT.md)**  
Apple capability placeholders: **[docs/ios-capabilities.placeholders.md](./docs/ios-capabilities.placeholders.md)**

Do **not** commit Apple Team secrets, `.p8` keys, or processing certificates. See `.env.example`.

## Notes

- Payments default to stub mode (`EXPO_PUBLIC_PAYMENTS_MODE=stub`) — no live keys required.
- Brand: green & gold wood vibe, Est. 1946, “No Compromise on Quality”.
- Phase 1 POP: Ultimate Outdoor, 18 Smit Street, Piet Retief.
- Location: when-in-use only (nearest POP). Push strings reserved; live push not wired yet.
- Demo role switch (dev, or `EXPO_PUBLIC_DEMO`): top-right menu → Customer / POP / Admin.
- Admin: Menu → Admin dashboard (products, orders, POPs, partner applications).

See Project docs in Cursor for POP / payments / notifications architecture.
