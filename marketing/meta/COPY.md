# AnodeH Meta ad — single image (Subscribe)

Paste these fields into **Edit ad creative** → **Single image**.

## Image to upload

| File | Size | Use |
|---|---|---|
| `anodeh-meta-subscribe-square.png` | 1080×1080 | Default single-image / Feed |
| `anodeh-meta-subscribe-portrait.png` | 1080×1350 | Feed / Explore (more mobile screen) |

Source HTML (re-render if you change copy):

- `ad-single-subscribe.html` → square
- `ad-single-subscribe-portrait.html` → portrait

## Ad fields (paste into Meta)

**Select image or video:** Image  
**Media:** Single image → upload `anodeh-meta-subscribe-square.png`

**Headline** (≤40 recommended; Meta often shows ~27)

```
Block clicks that never buy
```

Alternates:

```
Stop wasted Google Ads clicks
Protect your ads budget
```

**Primary text**

```
Stop paying for Google Ads clicks that never buy.

AnodeH scores invalid traffic — datacenter, VPN, repeat IPs, instant bounces — and writes the exclusions for you. Keep the budget on people who might become customers.
```

Short primary text (if Meta truncates):

```
Google Ads click protection. AnodeH blocks invalid traffic and writes the exclusions so your budget stays on real buyers. Start with a 7-day free trial.
```

**Website**

```
https://anodeh.com
```

Use `https://anodeh.com` (lowercase `https`). Prefer `/register` only if the campaign is hard-locked to signup:

```
https://anodeh.com/register?plan=month
```

**Call to action**

```
Subscribe
```

**Description** (if the placement shows it)

```
7-day free trial. Protect Search, Display, and Performance Max.
```

## Setup reminder

1. Campaign objective: **Sales** (or Subscriptions if offered)
2. Ad setup: **Create ad** → **Single image or video** → **Image**
3. Destination: `https://anodeh.com`
4. Before scaling spend, add a Meta Pixel with CompleteRegistration + Purchase events
