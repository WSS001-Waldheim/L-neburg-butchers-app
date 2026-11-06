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

## Notes

- Payments default to stub mode (`EXPO_PUBLIC_PAYMENTS_MODE=stub`) — no live keys required.
- Brand: green & gold wood vibe, Est. 1946, “No Compromise on Quality”.
- Phase 1 POP: Ultimate Outdoor, 18 Smit Street, Piet Retief.
- Demo role switch: top-right menu → Customer / POP / Admin.
- Admin: Menu → Admin dashboard (products, orders, POPs, partner applications).

See Project docs in Cursor for POP / payments / notifications architecture.
