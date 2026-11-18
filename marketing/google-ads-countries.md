# AnodeH Google Ads — where to advertise (and what to exclude)

AnodeH sells **Google Ads click protection + spam email monitoring** (`https://anodeh.com`). PayPal collects USD; the site already localizes currency for the countries in `src/lib/residence-currency.ts`.

**Different countries get different tiers** — separate campaigns, budgets, and copy. Do not mix US CPC with India CPC in one campaign.

**UI walkthrough:** [`google-ads-step-by-step.md`](./google-ads-step-by-step.md)

| Tier | Markets | Full setup |
| --- | --- | --- |
| T1 Core English | ZA, US, GB, AU, CA, IE, NZ, SG | [`google-ads-global.md`](./google-ads-global.md) · copy in [`google-ads-COPY.md`](./google-ads-COPY.md) |
| T2 EU English | DE, NL, Nordics, FR, ES, IT, PL, … | same |
| T3 Selective | AE, HK, IN, BR, MX, KE, NG, BW, NA, JP, KR | tiny tests only |
| Hard exclude | OFAC + Russia + commercial risk list | never target |

Do **not** use “All countries & territories” without exclusions. Run **explicit include lists**, presence-only targeting.

## Presence setting (every campaign)

**Presence: People in or regularly in your targeted locations**  
Never “People interested in your targeted locations.”

---

## Completely exclude (hard)

These must never be targeted. Add them as **location exclusions** on every campaign (including any “global” experiment).

### A. Google / OFAC — cannot target

| Location | Criterion ID | Why |
| --- | --- | --- |
| Crimea | 21120 | OFAC embargo — Google Ads blocks targeting |
| Cuba | 2192 | OFAC embargo |
| Iran | 2364 | OFAC embargo |
| North Korea | 2408 | OFAC embargo |
| So-called Donetsk People’s Republic (DNR) | 21113 | OFAC embargo |
| So-called Luhansk People’s Republic (LNR) | 21111 | OFAC embargo |

Source: [Google Ads country restrictions](https://support.google.com/google-ads/answer/6163740).

### B. Google policy pause — ads do not serve (still exclude)

| Location | Why |
| --- | --- |
| Russia | Google pauses ads serving to users in Russia (Ukraine sensitive-events policy). Exclude so budget and reports stay clean. |

### C. Commercial hard exclude for AnodeH

Even where Google might allow targeting, **do not buy** these for AnodeH: PayPal conversion is weak, invalid traffic on *your* ads is high, or compliance risk is not worth the spend.

| Location | Why exclude completely |
| --- | --- |
| Belarus | Payment / compliance risk; poor SaaS conversion |
| Syria | High risk; payment and fraud exposure |
| Myanmar | Payment + fraud risk |
| Afghanistan | Payment + fraud risk |
| Venezuela | Payment friction; high invalid traffic |
| Sudan / South Sudan | Payment + fraud risk |
| Yemen | Payment + fraud risk |
| Somalia | Payment + fraud risk |
| Iraq | Payment + fraud risk |
| Libya | Payment + fraud risk |
| North Korea / Iran / Cuba / Crimea / DNR / LNR | Already OFAC (listed above) |

**Rule of thumb:** if you cannot reliably take PayPal payment *and* support English product onboarding, do not advertise there.

---

## Advertise globally — recommended tiers

Build campaigns by **tier**. Do not dump every country into one campaign on day one.

### Tier 1 — start here (English + strong Google Ads buyers)

Product copy stays English. These markets have advertisers who feel click waste and can pay.

| Country | Code | Currency on site | Notes |
| --- | --- | --- | --- |
| South Africa | ZA | ZAR | Existing SA campaign — keep as own campaign |
| United States | US | USD | Largest Search volume; highest CPC — own campaign |
| United Kingdom | GB | GBP | Strong B2B Search |
| Australia | AU | AUD | English, high intent |
| Canada | CA | CAD | English + FR later if needed |
| Ireland | IE | EUR | English |
| New Zealand | NZ | NZD | English |
| Singapore | SG | SGD | English business hub |

**Campaign split:** one Search campaign per major market (ZA, US, GB) or group AU+NZ+SG+IE+CA together once US/GB/ZA are stable.

### Tier 2 — expand after Tier 1 CPA is sane (EU / EEA + CH)

English RSAs still work for many B2B searches; local language is optional later.

| Country | Code | Currency |
| --- | --- | --- |
| Germany | DE | EUR |
| Netherlands | NL | EUR |
| Belgium | BE | EUR |
| Austria | AT | EUR |
| Switzerland | CH | CHF |
| Sweden | SE | SEK |
| Norway | NO | NOK |
| Denmark | DK | DKK |
| Finland | FI | EUR |
| France | FR | EUR |
| Spain | ES | EUR |
| Italy | IT | EUR |
| Portugal | PT | EUR |
| Poland | PL | PLN |
| Luxembourg | LU | EUR |
| Malta | MT | EUR |
| Cyprus | CY | EUR |
| Estonia | EE | EUR |
| Latvia | LV | EUR |
| Lithuania | LT | EUR |
| Slovenia | SI | EUR |
| Slovakia | SK | EUR |
| Greece | GR | EUR |

Prefer a **single “EU English” Search campaign** first (DE, NL, BE, AT, CH, Nordics, IE already in Tier 1). Add FR/ES/IT as separate ad groups only when you have localized headlines.

### Tier 3 — selective (site already supports currency)

| Country | Code | Currency | Approach |
| --- | --- | --- | --- |
| United Arab Emirates | AE | AED | Small Search test |
| Hong Kong | HK | HKD | Small Search test |
| Japan | JP | JPY | Test only; English RSA may underperform |
| South Korea | KR | KRW | Test only |
| India | IN | INR | Strict phrase/exact + low budget (high click volume, lower AOV) |
| Brazil | BR | BRL | Test; consider PT later |
| Mexico | MX | MXN | Test; consider ES later |
| Kenya | KE | KES | Regional with ZA if SA CPA is good |
| Nigeria | NG | NGN | Low budget only; watch invalid clicks on *your* ads |
| Botswana | BW | BWP | Bundle with ZA |
| Namibia | NA | NAD | Bundle with ZA |
| China | CN | CNY | Usually skip Search for this product (Great Firewall / payment) unless you have a clear path |

---

## Do not advertise broadly (soft exclude / skip)

Not OFAC, but poor fit for AnodeH Search until proven:

- Most of Central Asia, Central America, and low-GDP markets with little Google Ads spend
- Pure “traffic” countries where people search for free tools / downloads (use negatives instead of geo if volume is tiny)
- China Search unless you have CN payment and support

---

## Practical Google Ads location recipe

### Campaign A — South Africa (keep)

- Include: South Africa  
- Exclude: hard list (A+B+C)  
- Language: English  
- Budget: existing SA plan

### Campaign B — English core (Tier 1 minus ZA)

- Include: United States, United Kingdom, Australia, Canada, Ireland, New Zealand, Singapore  
- Exclude: hard list  
- Language: English  
- Prefer splitting **US** and **GB** into their own campaigns when daily budget ≥ enough for learning

### Campaign C — EU English (Tier 2)

- Include: DE, NL, BE, AT, CH, SE, NO, DK, FI, FR, ES, IT, PT, PL (+ Baltics/GR/SK/SI/LU/MT/CY if budget allows)  
- Exclude: hard list  
- Language: English first

### Never

- “All countries and territories” with no exclusions  
- Interest-based location targeting  
- Display Network on the first launch (Search only)

---

## Quick checklist

- [ ] Locations = **include list**, not “everywhere”
- [ ] Presence only
- [ ] Hard excludes (OFAC + Russia + commercial list) on every campaign
- [ ] Languages match the RSA language
- [ ] Conversion = existing purchase tag `AW-18572224940/eQn1CPunubcdEKzT9pdF` on thank-you
- [ ] Display Network off for launch Search campaigns
