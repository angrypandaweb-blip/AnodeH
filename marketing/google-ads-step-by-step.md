# AnodeH Google Ads — step-by-step setup

Follow this in order. Do not skip conversion checks before spend.

Related docs:

- Purchase conversion UI → [`google-ads-purchase-conversion.md`](./google-ads-purchase-conversion.md)
- Countries & excludes → [`google-ads-countries.md`](./google-ads-countries.md)
- Tier strategy → [`google-ads-global.md`](./google-ads-global.md)
- Paste-ready ads → [`google-ads-COPY.md`](./google-ads-COPY.md)
- SA-only notes → [`google-ads-south-africa.md`](./google-ads-south-africa.md)

Final URL: `https://anodeh.com`  
Conversion (already on site): `AW-18572224940` / `eQn1CPunubcdEKzT9pdF`

---

## Phase 0 — Purchase conversion (do this first)

Full UI walkthrough: [`google-ads-purchase-conversion.md`](./google-ads-purchase-conversion.md)

1. Open `https://anodeh.com` and confirm the homepage shows **7-day free trial** and **spam email monitoring**.
2. Open `https://anodeh.com/register?plan=month` and confirm signup works.
3. In Google Ads → **Goals** → **Conversions** → **+ Create conversion action** (or open the existing purchase action).
4. On **Choose data sources**, select **Conversions on a website** — not phone calls, not app, not offline.
5. Domain: `anodeh.com`. Use the **existing** Google tag `AW-18572224940` already on the site.
6. Confirm the purchase action matches label `eQn1CPunubcdEKzT9pdF` (thank-you page fires it after PayPal). Mark it **Primary**.
7. Do not create a second purchase conversion.
8. Test a checkout that reaches `/thank-you?purchase=…` and confirm the conversion can record.
9. Billing: payment method active on the Google Ads account you will use.

**Stop here if conversion is not recording.** Fix tracking first.

---

## Phase 1 — Account defaults (once)

1. Google Ads → **Settings** (account settings, not campaign).
2. Set account time zone to where you manage spend (e.g. Africa/Johannesburg if you run ZA first).
3. Currency stays as already set on the account (do not change mid-flight).
4. Under **Goals**, mark the AnodeH purchase conversion as a **primary** conversion for campaign optimization.
5. Turn off auto-apply recommendations that expand to Display or “optimize” locations until you are stable (optional but safer).

---

## Phase 2 — Shared assets (create once, reuse)

### 2.1 Negatives (shared list)

1. Tools → **Shared library** → **Exclusion lists** → **Negative keyword lists**.
2. Create list: `AnodeH | Shared negatives`.
3. Paste:

```
free
jobs
career
what is an anode
anode
music
lyrics
download
torrent
gmail tutorial
outlook how to
youtube
tiktok
crack
nude
```

4. You will attach this list to every Search campaign below.

### 2.2 Sitelinks / callouts / snippets

1. Ads → **Assets**.
2. Create sitelinks (account level):

| Label | URL |
| --- | --- |
| Pricing | `https://anodeh.com/#pricing` |
| Spam email | `https://anodeh.com/#spam` |
| Free trial | `https://anodeh.com/register?plan=month` |
| Dashboard sample | `https://anodeh.com/#preview` |

3. Create callouts: `7-Day Free Trial` · `Writes IP Exclusions` · `Spam Inbox Monitoring` · `Search & Display Ready` · `PayPal Billing`
4. Structured snippet — Header **Types** — Values: `Datacenter clicks`, `VPN exits`, `Repeat IPs`, `Instant bounces`, `Phishing mail`

---

## Phase 3 — Hard location excludes (copy this list)

For **every** campaign you create, under Locations → **Exclude**:

**OFAC / Google block:** Crimea, Cuba, Iran, North Korea, Donetsk (DNR), Luhansk (LNR)  
**Policy pause:** Russia  
**Commercial:** Belarus, Syria, Myanmar, Afghanistan, Venezuela, Sudan, South Sudan, Yemen, Somalia, Iraq, Libya

Full table: [`google-ads-countries.md`](./google-ads-countries.md)

---

## Phase 4 — Launch Tier 1 (do this first)

Create campaigns one at a time. Same recipe each time; only locations and copy change.

### Step A — Create the campaign shell

1. **Campaigns** → **New campaign**.
2. Goal: **Sales** (or Create without a goal’s guidance → Sales / Website conversions).
3. Conversion goal: AnodeH purchase (primary).
4. Campaign type: **Search**.
5. Campaign name (use exactly):
   - First: `AnodeH | Search | ZA`
   - Then: `AnodeH | Search | US`
   - Then: `AnodeH | Search | GB`
   - Then: `AnodeH | Search | EN-Rest`
6. Networks:
   - Google Search: **On**
   - Search partners: **Off** (turn on later if needed)
   - Display Network: **Off**
7. Locations → **Enter another location** → add **only** the include list for that campaign (below).
8. Location options → **Presence: People in or regularly in your targeted locations** (not “interested in”).
9. Add the **hard excludes** from Phase 3.
10. Languages: **English**.
11. Budget: daily amount you can afford while learning (tie to ~$69 subscriber value).
12. Bidding: **Maximize conversions** (no target CPA yet).
13. Continue.

### Step B — Locations per T1 campaign

| Campaign | Include only |
| --- | --- |
| `AnodeH \| Search \| ZA` | South Africa |
| `AnodeH \| Search \| US` | United States |
| `AnodeH \| Search \| GB` | United Kingdom |
| `AnodeH \| Search \| EN-Rest` | Australia, Canada, Ireland, New Zealand, Singapore |

### Step C — Ad groups + keywords

Create **three** ad groups in each campaign:

#### Ad group 1 — `Click fraud`

Final URL: `https://anodeh.com`

Keywords (phrase + exact):

```
"google ads click fraud"
"invalid clicks google ads"
"block fake clicks google ads"
"google ads bot traffic"
"click fraud protection"
"google ads invalid traffic"
[click fraud software]
[google ads click protection]
```

#### Ad group 2 — `Spam email`

Final URL: `https://anodeh.com/#spam`

```
"spam email monitoring"
"phishing email protection business"
"block spam emails business"
"imap spam filter"
"email junk alerts"
```

#### Ad group 3 — `Brand`

Final URL: `https://anodeh.com`

```
[anodeh]
"anodeh google ads"
```

### Step D — Responsive Search Ads

1. In each ad group → **Add ad** → Responsive search ad.
2. Paste headlines + descriptions from [`google-ads-COPY.md`](./google-ads-COPY.md):
   - ZA → Tier 1A
   - US → Tier 1B
   - GB → Tier 1C
   - EN-Rest → Tier 1D
3. Paths: `click-protection` or `spam-email` as fits the ad group.
4. Save.

### Step E — Attach shared assets

1. Campaign settings / Assets → attach sitelinks, callouts, snippets.
2. Attach negative list `AnodeH | Shared negatives`.

### Step F — Publish order for Tier 1

1. Enable **`AnodeH | Search | ZA`** first (or keep polishing if it already exists).
2. After ZA is live and conversion path confirmed → enable **US**.
3. Then **GB**.
4. Then **EN-Rest**.

Do **not** enable Tier 2 or Tier 3 yet.

---

## Phase 5 — First-week ops (every day for 7 days)

1. **Search terms** report → add negatives for junk queries.
2. Confirm conversions appear for real checkouts.
3. Pause any keyword with spend and zero relevant clicks after a clear sample.
4. Do not switch to broad match.
5. Do not turn on Display.
6. Do not expand locations until CPA is near what one subscriber is worth.

After ~30 purchases on a campaign, set a **target CPA** on Maximize conversions.

---

## Phase 6 — Tier 2 (only after Tier 1 CPA is sane)

1. New Search campaign: `AnodeH | Search | EU-EN`.
2. Same shell as Phase 4 (Search, Display off, Maximize conversions, English, presence only).
3. Include: Germany, Netherlands, Belgium, Austria, Switzerland, Sweden, Norway, Denmark, Finland, France, Spain, Italy, Portugal, Poland.
4. Optional later: Luxembourg, Malta, Cyprus, Estonia, Latvia, Lithuania, Slovenia, Slovakia, Greece.
5. Hard excludes from Phase 3.
6. Same three ad groups + keywords as Tier 1.
7. RSA copy: **Tier 2 — EU English** in `google-ads-COPY.md`.
8. Medium daily budget (lower than US/GB).
9. Attach shared negatives + assets.
10. Enable when T1 CPA is acceptable.

---

## Phase 7 — Tier 3 (one test at a time)

Only after Tier 1 (and preferably Tier 2) is stable.

1. Pick **one** cluster:

| Campaign name | Include |
| --- | --- |
| `AnodeH \| Search \| Gulf-HK` | United Arab Emirates, Hong Kong |
| `AnodeH \| Search \| IN` | India |
| `AnodeH \| Search \| LATAM` | Brazil, Mexico |
| `AnodeH \| Search \| Africa-near` | Kenya, Nigeria (prefer BW/NA inside ZA instead) |
| `AnodeH \| Search \| JP-KR` | Japan, South Korea |

2. Very low daily budget.
3. Phrase + exact only (especially India).
4. RSA: **Tier 3** copy in `google-ads-COPY.md`.
5. Review Search terms **daily**.
6. Pause the country/cluster if it spends with no trial starts after a fair sample.
7. Do not open a second Tier 3 campaign until the first has a clear pass/fail.

---

## Phase 8 — Scale checklist

When a campaign is converting:

- [ ] Search partners on only if they add cheap conversions
- [ ] Add exact match winners from Search terms
- [ ] Split US or GB further only if budget supports learning
- [ ] Local-language RSAs (DE/FR/ES/IT) only after English EU converts
- [ ] Still keep Display off until Search ROAS is proven
- [ ] Never use “All countries and territories” without the hard exclude list

---

## Quick “I am at the Google Ads UI” cheat sheet

1. Confirm purchase conversion  
2. Shared negatives + sitelinks/callouts  
3. Create `AnodeH | Search | ZA` → locations ZA → presence → excludes → Search only → Max conversions  
4. Ad groups: Click fraud / Spam email / Brand + keywords  
5. Paste RSA for that tier  
6. Attach negatives + assets → Enable  
7. Repeat for US → GB → EN-Rest  
8. Wait for CPA → EU-EN → one Tier 3 test  

If stuck: re-read this file top to bottom; do not invent a fourth ad group or broad match on day one.
