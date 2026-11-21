# AnodeH Meta Ads — step-by-step setup

Follow this in Meta Ads Manager (`https://adsmanager.facebook.com`). Do Pixel events before scaling spend.

Related:

- Paste-ready copy + images → [`COPY.md`](./COPY.md)
- Country tiers to mirror → [`../google-ads-countries.md`](../google-ads-countries.md)

---

## Phase 0 — Pixel (do this first)

1. Meta Business Suite → **Events Manager** → **Connect data** → **Web**.
2. Create or open Pixel for `anodeh.com`.
3. Install with Meta Pixel Helper (Chrome) or your site tag manager — confirm the Pixel fires on:
   - `https://anodeh.com` (PageView)
   - `/register` (CompleteRegistration when signup finishes, if wired)
   - `/thank-you` after PayPal (Purchase)
4. In Events Manager → **Test events**, load the site and confirm events appear.
5. **Stop here if Purchase is not recording.** Fix tracking before big budgets.

Until Pixel Purchase is solid, optimize for **Landing page views** or **Link clicks**, then switch to Purchase / Subscribe.

---

## Phase 1 — Campaign

1. Ads Manager → **+ Create**.
2. Objective: **Sales** (or **Conversions** / **Subscriptions** if your UI shows that).
3. Conversion location: **Website**.
4. Performance goal: **Maximize number of conversions** (or value once Purchase is stable).
5. Conversion event: **Purchase** (fallback: CompleteRegistration, then Landing page views).
6. Campaign name examples:
   - `AnodeH | Meta | ZA | 1 site Subscribe`
   - `AnodeH | Meta | ZA | Devs 10-20 sites`
7. Budget: start at **ad set** level (easier to kill losers). Advantage campaign budget off while testing.
8. Special ad categories: leave off (AnodeH is not housing/credit/employment/politics).

---

## Phase 2 — Ad set (audience = where you save spend)

Create **one ad set per offer + country**. Do not mix 1-website and 10/20 in the same ad set.

### 2.1 1 website — Subscribe

| Setting | Value |
| --- | --- |
| Ad set name | `ZA · 1 site · Google Ads buyers` |
| Conversion | Purchase (or Landing page views at first) |
| Daily budget | Small test (e.g. enough for ~10–20 link clicks/day) |
| Schedule | Start now; no end date until testing |
| Locations | **South Africa** only first (then US, GB, AU, CA as separate ad sets) |
| Location type | **People living in or recently in this location** |
| Age | 25–54 |
| Gender | All |
| Languages | English |
| Detailed targeting | Google Ads, Pay-per-click, Digital marketing, Online advertising, Small business owners |
| Advantage detailed targeting | **Off** while testing |
| Placements | Advantage+ placements (OK) or Feed + Instagram Feed only if you want tighter control |

### 2.2 10 / 20 websites — developers

Duplicate the ad set, then change:

| Setting | Value |
| --- | --- |
| Ad set name | `ZA · Devs · 10-20 sites` |
| Detailed targeting | Web development, Web design, Digital agencies, Freelancing, WordPress, Shopify, Google Ads, PPC |
| Same location / age / language rules as above |

### 2.3 Exclusions (optional but useful)

- Exclude people who already purchased (Pixel Purchase custom audience) once you have one.
- Do not stack every interest at once — 3–6 strong interests beat a huge OR list.

---

## Phase 3 — Ad creative (single image)

1. Ad setup: **Create ad** → **Single image or video** → **Image**.
2. Identity: pick your Facebook Page (+ Instagram account if linked).

### 3A — 1 website image

1. Upload `marketing/meta/anodeh-meta-subscribe-square.png` (optional: also add portrait).
2. Paste from [`COPY.md`](./COPY.md) section A:

| Field | Value |
| --- | --- |
| Primary text | Stop paying for Google Ads clicks that never buy. … |
| Headline | `Block clicks that never buy` |
| Description | `7-day free trial. Protect Search, Display, and Performance Max.` |
| Website URL | `https://anodeh.com` |
| Display link | `anodeh.com` |
| Call to action | **Subscribe** |

3. Preview Feed (mobile) → check text is not cut oddly.
4. Publish.

### 3B — Developers 10 / 20 image

1. Upload `marketing/meta/anodeh-meta-developers-sites-square.png`.
2. Paste from [`COPY.md`](./COPY.md) section B:

| Field | Value |
| --- | --- |
| Primary text | Web developers: stop fake Google Ads clicks… |
| Headline | `Protect every client site` |
| Description | `50% off first month on 10 or 20 websites…` |
| Website URL | `https://anodeh.com/#pricing` (or `register?plan=sites10` / `sites20`) |
| Call to action | **Subscribe** |

3. Keep this ad **only** in the developer ad set.
4. Publish.

---

## Phase 4 — Go live checklist

- [ ] Pixel PageView fires on homepage
- [ ] One country per ad set
- [ ] Advantage detailed targeting **off**
- [ ] 1-site ad uses **7-day free trial** creative (not half price)
- [ ] Dev ad uses **50% off first month** creative
- [ ] URL is `https://` lowercase
- [ ] CTA = Subscribe
- [ ] Payment method on the ad account is active

---

## Phase 5 — First week rules (save spend)

1. Do not edit the ad set every day — give it ~50 link clicks or 3 days minimum.
2. Kill an ad set that spends with **zero** landing-page views or register starts after a fair sample.
3. Keep winners; duplicate into the next Tier‑1 country (US, GB, …) — do not merge countries.
4. After ~50 Purchase events: build **1% Lookalike of purchasers** in that country and test as a new ad set.
5. Retarget website visitors (7–30 days) who did not purchase — usually cheaper than cold traffic.

---

## Quick map: which file goes where

| Goal | Image | Offer on creative | URL |
| --- | --- | --- | --- |
| Solo advertisers | `anodeh-meta-subscribe-square.png` | 7-day free trial | `https://anodeh.com` |
| Web developers / agencies | `anodeh-meta-developers-sites-square.png` | 50% off month 1 · 10 or 20 sites | `#pricing` or `register?plan=sites10\|sites20` |

Images live in `marketing/meta/` in the AnodeH repo.
