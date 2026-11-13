# Lüneburg web store

Holiday orders open on the web in early December 2026. Customers along the Joburg – Piet Retief – Sodwana / Kosi Bay route order vacuum-skin steaks, pay with Yoco, and collect at an approved pickup point. The first live point is **Ultimate Outdoor, 18 Smit Street, Piet Retief**. The native App Store release follows at the end of January.

The same Expo app is the shop. With no Supabase keys it keeps using the in-memory catalogue in `src/data/seed.ts`, so the demo still runs. With `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set, catalogue, pickup points, orders, and accounts come from Postgres.

## What is live in this build

- Postgres schema, row level security, and seed catalogue in `supabase/setup.sql` (paste into the SQL editor) and `supabase/migrations`.
- Shop, cart, and checkout read that data when the public env vars are set, and the seed otherwise.
- Yoco hosted checkout is the only payment method: card, and Apple Pay in Safari on iPhone. The secret never ships in the client. Starts in test mode (`pk_test_` / `sk_test_`).
- `yoco-webhook` checks the Standard Webhooks signature and marks the order **paid**. Karl confirms it in admin before it leaves the butchery.
- Admin screens for products (price, pack size, photo, stock, next arrival), order status, and POP approve / activate.
- POP screen: orders assigned to that point, collected only with the collection code.
- Until `EXPO_PUBLIC_ORDER_CUTOFF` is set, the shop says “Order ahead for collection at Ultimate Outdoor, Piet Retief”.
- Cold-chain no-returns rule on checkout, with the pack-check still required.
- Low and out-of-stock cuts keep showing the next arrival date. The line “Scarcity is part of the brand” is not used.

## What still needs Karl’s accounts

Nothing here can charge a card or persist an order until the project, keys, and domain exist. Push notifications are still the in-app stub. Native Apple Pay (the merchant entitlement) is unchanged; on the web, Apple Pay is Yoco’s hosted page in Safari. Weigh-in price adjustments after packing are not sent back to Yoco yet.

## Keys and accounts Karl must supply

| Item | Where it goes | Notes |
| --- | --- | --- |
| Supabase project `hnhmfnundobuarvfbaae` | Already created (eu-central-1) | Paste `supabase/setup.sql` in the SQL editor. |
| `EXPO_PUBLIC_SUPABASE_URL` | Vercel | `https://hnhmfnundobuarvfbaae.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Publishable anon key. Not the service role. |
| `EXPO_PUBLIC_YOCO_PUBLIC_KEY` | Vercel | The `YOCO_PUBLIC_KEY` value. Start with `pk_test_…`. |
| `EXPO_PUBLIC_PAYMENTS_MODE` | Vercel | `sandbox` for test. `live` only after the live keys. |
| `EXPO_PUBLIC_ORDER_CUTOFF` | Vercel, optional | Leave empty until the real cut-off is confirmed. |
| `YOCO_SECRET_KEY` | Supabase secret, not Vercel | `sk_test_…` to start. |
| `YOCO_WEBHOOK_SECRET` | Supabase secret, not Vercel | `whsec_…` from the test webhook. |
| Service role key | Injected into Edge Functions | Never put it in Vercel or git. |
| Domain | Vercel or Netlify, then Yoco return URLs | HTTPS. Add it to `ALLOWED_RETURN_ORIGINS` if you set that secret. |
| Admin user | Supabase Auth, then SQL below | Email/password. Turn off “Confirm email” for the pilot, or confirm Karl’s address by hand. |
| Ultimate Outdoor login | Same, role `pop` | Only after you want the shop to hand over with a real account. |

Copy `.env.example` to `.env` for local Expo. Do not commit `.env`.

## Database

The project is `hnhmfnundobuarvfbaae`. Open the SQL editor and paste `supabase/setup.sql` in one go. Or, with the CLI:

```bash
npx supabase link --project-ref hnhmfnundobuarvfbaae
npx supabase db push
npx supabase secrets set YOCO_SECRET_KEY=sk_test_... YOCO_WEBHOOK_SECRET=whsec_...
npx supabase functions deploy create-checkout
npx supabase functions deploy yoco-webhook
```

`create-checkout` requires a signed-in user. `yoco-webhook` does not use a Supabase JWT; the Yoco signature is the check (`verify_jwt = false` in `supabase/config.toml`).

Register the webhook in the Yoco Business Portal (test mode first):

`https://hnhmfnundobuarvfbaae.supabase.co/functions/v1/yoco-webhook`

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

Test and live secrets are not interchangeable. Keep `EXPO_PUBLIC_PAYMENTS_MODE=sandbox` while the `sk_test_` key is installed. Payments under R2.00 are rejected by Yoco. Yoco is the only checkout method.

The success, cancel, and failure pages are `/checkout/success`, `/checkout/cancel`, and `/checkout/failure`. Do not treat the success page as proof of payment. The webhook is the receipt.

## Web build

```bash
npx expo export --platform web
npx serve dist
```

`app.json` sets `web.output` to `single`. That export is one `dist/index.html` plus assets. Order numbers are created at checkout, so they cannot be pre-rendered. Vercel (`vercel.json`) and Netlify (`public/_redirects`, copied into `dist`) send unknown paths back to that file. Static files are still served as themselves.

### Vercel

`vercel.json` already sets this. In the project settings, confirm:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Install command | `npm install` |
| Build command | `npx expo export --platform web` |
| Output directory | `dist` |

Vercel environment variables (all public, baked in at build time):

- `EXPO_PUBLIC_SUPABASE_URL` = `https://hnhmfnundobuarvfbaae.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = the anon key from Supabase → Project Settings → API
- `EXPO_PUBLIC_YOCO_PUBLIC_KEY` = `YOCO_PUBLIC_KEY` (`pk_test_…` to start)
- `EXPO_PUBLIC_PAYMENTS_MODE` = `sandbox`
- `EXPO_PUBLIC_ORDER_CUTOFF` = leave unset until the cut-off is confirmed

Do not add `YOCO_SECRET_KEY`, `YOCO_WEBHOOK_SECRET`, or the service role key to Vercel. Those stay on Supabase. Attach the domain, then set the Edge Function secret `ALLOWED_RETURN_ORIGINS` to that origin.

### Netlify

Build command `npx expo export --platform web`. Publish directory `dist`. Same public env vars. `public/_redirects` is copied into the publish directory by the export.

## Admin login

The portal is [https://luneburg-shop.vercel.app/admin](https://luneburg-shop.vercel.app/admin). Only a Supabase user whose `profiles.role` is `admin` sees orders, prices, stock, and the status buttons.

Run `supabase/admin-karl.sql` in the SQL editor. It does not create a password. It marks `karl@wssfarming.co.za` as admin on signup, and upgrades the profile if that email has already signed in.

In the Supabase dashboard, Authentication → URL configuration:

- Site URL: `https://luneburg-shop.vercel.app`
- Redirect URLs: `https://luneburg-shop.vercel.app/**`

Authentication → Providers → Email stays on. “Allow new users to sign up” stays on until Karl has created his password. If “Confirm email” is on, he must open the confirmation email before the first sign-in.

Karl’s first password, on his phone:

1. Open `https://luneburg-shop.vercel.app/admin`
2. Tap **Set / forgot password**
3. Enter `karl@wssfarming.co.za` and a password he chooses, then **Set my password**
4. If a confirmation email arrives, open it, then **Sign in** with that same password

Later, **Email me a reset link** sends him to `https://luneburg-shop.vercel.app/admin/reset-password`, where he types a new password.

## Local demo without keys

Without the anon key and the Yoco public key, the catalogue stays on the seed data and the Pay with Yoco button waits for those keys. It does not invent a successful card payment.

```bash
npm install
npx expo start --web
```

The menu (development builds) can switch Customer / POP / Admin. The existing demo order is on the admin list. Move it to “Left the butchery”, then “Ready at pickup” (that shows the collection code). Sign in as the POP partner and mark it collected with that code. A new customer order is marked paid only after the Yoco webhook.

Low stock and out-of-stock cuts show the next cut date. The order cut-off and the cold-chain rule are on the shop and on checkout.
