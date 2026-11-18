# AnodeH — purchase conversion setup (Google Ads UI)

AnodeH already fires a **website purchase** conversion on the thank-you page after PayPal succeeds.

| Item | Value |
| --- | --- |
| Google tag ID | `AW-18572224940` |
| Purchase conversion | `AW-18572224940/eQn1CPunubcdEKzT9pdF` |
| Page that fires it | `https://anodeh.com/thank-you?purchase=…` |
| Code | `src/components/PurchaseConversion.tsx` + `src/lib/google-conversion.ts` |

You need a **website** conversion in Google Ads that matches that tag — not phone calls, not app, not offline.

---

## Correct choice on “Choose data sources”

On **Goals → Conversions → Summary → + Create conversion action → Choose data sources**:

| Option | Use for AnodeH? |
| --- | --- |
| **Conversions on a website** | **Yes — select this** |
| Conversions on an app | No |
| Conversions from phone calls | **No** (do not leave this selected) |
| Conversions offline | No |

1. Click **Conversions on a website** (mouse / target icon).
2. Enter domain: `anodeh.com`
3. Continue / scan or skip to manual setup if Google cannot auto-detect every event.

---

## If Google asks how to set up the tag

Prefer **Use a Google tag already installed** / existing tag on the site.

The site already loads:

- Base tag: `AW-18572224940` (`GoogleTag` in the app layout)
- Purchase event: `gtag('event', 'conversion', { send_to: 'AW-18572224940/eQn1CPunubcdEKzT9pdF', transaction_id: '…' })` on `/thank-you`

Do **not** install a second Google tag snippet that replaces the existing one.

---

## Create / confirm the Purchase action

1. Category / name: **Purchase** (keep that name).
2. Setup: **Manually with code** (site already has the event).
3. Action optimization: **Primary** for bidding.
4. Value: **Use different values for each conversion** → **Event snippet**.  
   The thank-you page sends `value` + `currency: USD` from the PayPal payment (trial / missing payment → `0`).  
   Set the **default** fallback to something like one month (not `1`); it only applies when value is missing.
5. Count: **Every**.
6. Click-through window: 30 days (default is fine).
7. Attribution: Data-driven if offered.
8. Goal: mark as **Primary** for “Sales” / campaign optimization.

### If the conversion already exists

1. Goals → Conversions → open the existing purchase action.
2. Confirm the conversion ID / label matches `eQn1CPunubcdEKzT9pdF` (or that the Google tag event is wired to that action).
3. Set it to **Primary**.
4. Do **not** create a duplicate purchase action.

---

## Verify it works

1. Complete a real or test checkout that lands on `/thank-you?purchase=SOME_ID` (you must be logged in; unpaid accounts may still open thank-you).
2. Or open (while logged in): `https://anodeh.com/thank-you?purchase=TEST_ID_123` — the page may auto-continue to Settings; the conversion still fires first.
3. In Chrome DevTools → Network, filter `conversion` / `googleadservices` and confirm a hit like:
   - `googleadservices.com/pagead/conversion/18572224940/…`
   - `label=eQn1CPunubcdEKzT9pdF`
4. In Console / Tag Assistant, confirm `dataLayer` has  
   `event: conversion`, `send_to: AW-18572224940/eQn1CPunubcdEKzT9pdF`, `transaction_id: …`
5. In Google Ads → Conversions → **Recent conversions** / diagnostics (can take a few hours to show in the UI).

**Local check (already done in this repo):** loading `/thank-you?purchase=test_purchase_…` with a session cookie fired the gtag conversion event and a Google `pagead/conversion/18572224940` request with the correct label.

**Stop campaign spend until this records at least once in your Ads account diagnostics.**

---

## Common mistakes on this screen

- Selecting **phone calls** (wrong for AnodeH SaaS checkout)
- Creating a **new** website tag when `AW-18572224940` is already on the site
- Two primary purchase conversions competing for optimization
- Pointing the campaign at a secondary “page view” goal instead of purchase

---

## After conversion is primary

Return to [`google-ads-step-by-step.md`](./google-ads-step-by-step.md) Phase 1 and continue campaign setup (Search, locations, Tier 1).
