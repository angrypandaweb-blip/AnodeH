# Google Ads for anodeh.com — global, by country tier

Market AnodeH as **Google Ads click protection + spam email monitoring**.  
Final URL: `https://anodeh.com`  
Conversion already on site: purchase tag `AW-18572224940` / `eQn1CPunubcdEKzT9pdF` (thank-you / PayPal success).

Country lists and hard excludes: see [`google-ads-countries.md`](./google-ads-countries.md).  
Paste-ready RSAs per tier: see [`google-ads-COPY.md`](./google-ads-COPY.md).

---

## How the tiers work

| Tier | Who | Campaign style | Daily budget start* | Bidding |
| --- | --- | --- | --- | --- |
| **T1 — Core English** | ZA (own), US, GB, AU, CA, IE, NZ, SG | Separate Search campaigns (or ZA + US + GB alone, rest grouped) | Higher | Max conversions → tCPA after ~30 purchases |
| **T2 — EU / EEA + CH** | DE, NL, Nordics, FR, ES, IT, etc. | One “EU English” Search campaign | Medium | Max conversions; keep Display off |
| **T3 — Selective** | AE, HK, IN, BR, MX, KE, NG, BW, NA, JP, KR | Tiny Search tests only | Low | Maximize clicks first, then conversions |

\*Set daily budget from what one subscriber is worth (e.g. ~$69/mo plan). Do not outspend LTV while learning.

**Every campaign**

- Objective: **Sales / Website conversions** (not Traffic alone)
- Networks: **Search on**, **Display off**, Search partners optional off until stable
- Location: **include list only** + hard excludes from `google-ads-countries.md`
- Presence: **People in or regularly in your targeted locations**
- Language: English for T1–T2; local language only after T1 CPA is proven

---

## Tier 1 — Core English (start here)

### Campaigns to create

1. **`AnodeH | Search | ZA`** — South Africa only (keep existing SA setup)
2. **`AnodeH | Search | US`** — United States
3. **`AnodeH | Search | GB`** — United Kingdom
4. **`AnodeH | Search | EN-Rest`** — Australia, Canada, Ireland, New Zealand, Singapore

Split US/GB when each can sustain learning; until then US+GB can share one campaign with location bid adjustments later.

### Ad groups (same structure in each T1 campaign)

| Ad group | Intent | Final URL |
| --- | --- | --- |
| Click fraud | Invalid / bot / fake clicks | `https://anodeh.com` |
| Spam email | Inbox / phishing monitoring | `https://anodeh.com/#spam` |
| Brand | AnodeH | `https://anodeh.com` |

### Keywords (phrase + exact; start phrase)

**Click fraud**

- `"google ads click fraud"`
- `"invalid clicks google ads"`
- `"block fake clicks google ads"`
- `"google ads bot traffic"`
- `"click fraud protection"`
- `"google ads invalid traffic"`
- `[click fraud software]`
- `[google ads click protection]`

**Spam email**

- `"spam email monitoring"`
- `"phishing email protection business"`
- `"block spam emails business"`
- `"imap spam filter"`
- `"email junk alerts"`

**Brand**

- `[anodeh]`
- `"anodeh google ads"`

### Shared negatives (apply at campaign level)

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

### Bidding & budget (T1)

1. Confirm conversion fires on thank-you
2. Start **Maximize conversions** (no tCPA) for 2–4 weeks
3. After ~30 conversions, set **target CPA** near what one paid month is worth
4. US: expect higher CPC — protect with exact/phrase only, no broad match until Search terms are clean

### Assets (T1)

- RSA: Tier 1 copy in `google-ads-COPY.md` (ZA uses SA-specific headlines)
- Sitelinks: Pricing, Spam email, Free trial, Dashboard sample
- Callouts: 7-day free trial · IP exclusions · Spam monitoring · PayPal billing
- Snippets: Threats → Datacenter clicks, VPN exits, Repeat IPs, Instant bounces

---

## Tier 2 — EU / EEA + CH (expand after T1 CPA is sane)

### Campaign

**`AnodeH | Search | EU-EN`**

Include: DE, NL, BE, AT, CH, SE, NO, DK, FI, FR, ES, IT, PT, PL  
Optional add: LU, MT, CY, EE, LV, LT, SI, SK, GR

Exclude: full hard-exclude list.

### Differences from Tier 1

| Setting | Tier 2 choice |
| --- | --- |
| Language | English first |
| Keywords | Same click-fraud + spam sets; drop weak brand if no volume |
| Match types | Phrase + exact only (no broad) |
| RSA | Tier 2 copy (no “SA” / “US” claims) |
| Budget | Lower than US/GB until ROAS clear |
| Local language | Add DE/FR/ES/IT RSAs only after English converts |

### Ad groups

Same as T1: Click fraud · Spam email · Brand (optional)

---

## Tier 3 — Selective tests (small, watched)

Create **one campaign per test cluster**, not one mega-list.

| Campaign | Countries | Cap | Notes |
| --- | --- | --- | --- |
| `AnodeH \| Search \| Gulf-HK` | AE, HK | Low | English RSA |
| `AnodeH \| Search \| IN` | India | Very low | Exact/phrase only; heavy negatives; watch junk Search terms |
| `AnodeH \| Search \| LATAM` | BR, MX | Low | English first; PT/ES later |
| `AnodeH \| Search \| Africa-near` | KE, NG, BW, NA | Low | Prefer bundling BW/NA with ZA instead |
| `AnodeH \| Search \| JP-KR` | JP, KR | Tiny | Expect weak English CTR; pause if no conversions |

### Tier 3 rules

- Maximize **clicks** with a low CPC cap first, or Maximize conversions with a hard daily cap
- Review Search terms **every day** for the first week
- Pause any country that burns budget with zero trial starts after a clear sample
- Never run Display or Performance Max here until Search wins

---

## Shared checklist before spend

- [ ] Purchase conversion recording (`AW-18572224940/eQn1CPunubcdEKzT9pdF`)
- [ ] Hard location excludes on every campaign
- [ ] Presence-only targeting
- [ ] Display Network off
- [ ] Landing page shows 7-day trial + spam monitoring
- [ ] At least one RSA mentions both ads protection and spam email
- [ ] Tier campaigns separated (do not mix US CPC with IN CPC in one campaign)

## Rollout order

1. Keep / polish **ZA**
2. Launch **US** + **GB**
3. Launch **EN-Rest** (AU, CA, IE, NZ, SG)
4. Launch **EU-EN** when T1 CPA is near subscriber value
5. Open **one** Tier 3 test at a time
