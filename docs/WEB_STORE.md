# Lüneburg web store

Holiday orders open on the web in early December 2026. Customers along the Joburg – Piet Retief – Sodwana / Kosi Bay route order vacuum-skin steaks, pay with Yoco, and collect at an approved pickup point. The first live point is **Ultimate Outdoor, 18 Smit Street, Piet Retief**. The native App Store release follows at the end of January.

The same Expo app is the shop. With no Supabase keys it keeps using the in-memory catalogue in `src/data/seed.ts`, so the demo still runs. With `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set, catalogue, pickup points, orders, and accounts come from Postgres.

## What is live in this build

- Postgres schema, row level security, and seed catalogue in `supabase/migrations`.
- Shop, cart, and checkout read that data when the public env vars are set, and the seed otherwise.
- Yoco hosted checkout (cards, and Apple Pay in Safari on iPhone) via the `create-checkout` Edge Function. The secret key never ships in the client.
- `yoco-webhook` checks the Standard Webhooks signature and marks the order **paid**. Karl confirms it in admin before it leaves the butchery.
- Admin screens for products (price, pack size, photo, stock, next arrival), order status, and POP approve / activate.
- POP screen: orders assigned to that point, collected only with the collection code.
- Order cut-off (Wednesday 12:00 SAST) on the shop, cart, checkout, and help.
- Cold-chain no-returns rule on checkout, with the pack-check still required.
- Low and out-of-stock cuts keep showing the next arrival date. The line “Scarcity is part of the brand” is not used.

## What still needs Karl’s accounts

Nothing here can charge a card or persist an order until the project, keys, and domain exist. Push notifications are still the in-app stub. Native Apple Pay (the merchant entitlement) is unchanged; on the web, Apple Pay is Yoco’s hosted page in Safari. Weigh-in price adjustments after packing are not sent back to Yoco yet.

## Keys and accounts Karl must supply

| Item | Where it goes | Notes |
| --- | --- | --- |
| Supabase project | Dashboard + CLI | New project. Apply `supabase/migrations`. |
| `EXPO_PUBLIC_SUPABASE_URL` | Host env (Vercel/Netlify) and EAS | Project URL, public. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Host env and EAS | Public anon key. Not the service role. |
| Service role key | Supabase injects it into Edge Functions | Never put it in Expo env or git. |
| Yoco test secret `sk_test_…` | `supabase secrets set YOCO_SECRET_KEY` | Business Portal, test mode. |
| Yoco test public `pk_test_…` | `EXPO_PUBLIC_YOCO_PUBLIC_KEY` | Safe in the client. |
| Yoco webhook secret `whsec_…` | `supabase secrets set YOCO_WEBHOOK_SECRET` | Returned once when the webhook is registered. |
| Domain | Vercel or Netlify, then Yoco return URLs | HTTPS. Add it to `ALLOWED_RETURN_ORIGINS` if you set that secret. |
| Admin user | Supabase Auth, then SQL below | Email/password. Turn off “Confirm email” for the pilot, or confirm Karl’s address by hand. |
| Ultimate Outdoor login | Same, role `pop` | Only after you want the shop to hand over with a real account. |

Copy `.env.example` to `.env` for local Expo. Do not commit `.env`.

## Database

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set YOCO_SECRET_KEY=sk_test_... YOCO_WEBHOOK_SECRET=whsec_...
npx supabase functions deploy create-checkout
npx supabase functions deploy yoco-webhook
```

`create-checkout` requires a signed-in user. `yoco-webhook` does not use a Supabase JWT; the Yoco signature is the check (`verify_jwt = false` in `supabase/config.toml`).

Register the webhook in the Yoco Business Portal (test mode first):

`https://<project-ref>.supabase.co/functions/v1/yoco-webhook`

Subscribe it to `payment.succeeded` and `payment.failed`. Save the `whsec_` secret immediately.

Promote yourself to admin after signing up once in the app (that creates the profile row):

```sql
update public.profiles
set role = 'admin'
where email = 'karl@wssfarming.co.za';
```

Give Ultimate Outdoor their own login, then:

```sql
update public.profiles
set role = 'pop', pop_id = 'ultimate-outdoor-piet-retief'
where email = 'ultimate-outdoor@example.co.za';
```

Pickup points start as `pending`. Admin approves (`approved`, still hidden), then activates (`active`). Only `active` points appear at checkout. Ultimate Outdoor is seeded as `active`. Brooks in the Park and Heidelberg are `pending`.

## Order statuses

`pending_payment` → `paid` (Yoco webhook, or an admin marking an offline payment) → `confirmed` (butchery) → `left_butchery` → `at_pop` (collection code is issued here) → `collected`. `cancelled` is only before the order leaves the butchery.

Customers can read their own orders. A POP account can read orders for its `pop_id` and can only move `at_pop` to `collected`. Admins can read and update everything. A customer cannot set their own order to paid; the row guard rejects that.

## Switching Yoco from test to live

1. In the Yoco Business Portal, copy the **live** secret (`sk_live_…`) and public key (`pk_live_…`).
2. `npx supabase secrets set YOCO_SECRET_KEY=sk_live_…`
3. Set `EXPO_PUBLIC_YOCO_PUBLIC_KEY=pk_live_…` on the host and rebuild.
4. Register the webhook again in **live** mode. The secret is new. `npx supabase secrets set YOCO_WEBHOOK_SECRET=whsec_…`
5. Set `EXPO_PUBLIC_PAYMENTS_MODE=live` and redeploy the site.

Test and live secrets are not interchangeable. Leave `EXPO_PUBLIC_PAYMENTS_MODE=stub` for the demo with no keys, or `sandbox` while the `sk_test_` key is installed. Payments under R2.00 are rejected by Yoco.

The success, cancel, and failure pages are `/checkout/success`, `/checkout/cancel`, and `/checkout/failure`. Do not treat the success page as proof of payment. The webhook is the receipt.

## Web build

```bash
npx expo export --platform web
npx serve dist
```

`app.json` sets `web.output` to `single`. That export is one `dist/index.html` plus assets. Order numbers are created at checkout, so they cannot be pre-rendered. Vercel (`vercel.json`) and Netlify (`public/_redirects`, copied into `dist`) send unknown paths back to that file. Static files are still served as themselves.

### Vercel

Import the Git repository. Framework preset: Other. Build command `npx expo export --platform web`. Output directory `dist`. Add the public env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_YOCO_PUBLIC_KEY`, `EXPO_PUBLIC_PAYMENTS_MODE`). Do not add the Yoco secret or the service role. Attach the domain, then set `ALLOWED_RETURN_ORIGINS` on the Edge Function to that origin.

### Netlify

Build command `npx expo export --platform web`. Publish directory `dist`. Same public env vars. `public/_redirects` is copied into the publish directory by the export.

## Local demo without keys

Leave the Supabase and Yoco variables empty and `EXPO_PUBLIC_PAYMENTS_MODE=stub`.

```bash
npm install
npx expo start --web
```

The menu (development builds) can switch Customer / POP / Admin. Place an order from the catalogue: it is marked paid and confirmed on this device only. In Admin → Orders, move it to “Left the butchery”, then “Ready at pickup” (that shows the collection code). Sign in as the POP partner and mark it collected with that code.

Low stock and out-of-stock cuts show the next cut date. The order cut-off and the cold-chain rule are on the shop and on checkout.
