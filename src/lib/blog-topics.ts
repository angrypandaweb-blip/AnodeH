export type BlogSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogTopic = {
  id: string;
  title: string;
  description: string;
  summary: string;
  sections: BlogSection[];
};

/** Factual angles about AnodeH click protection, domains, and spam email. */
export const BLOG_TOPICS: BlogTopic[] = [
  {
    id: "how-anodeh-protects-a-domain",
    title: "How AnodeH protects a domain from wasted ad clicks",
    description:
      "AnodeH watches the domain you save, scores each Google Ads click, and writes IP exclusions so invalid traffic stops spending the budget.",
    summary:
      "Protection starts with the domain you add in Settings. The site tag scores visits; Search and Display get IP exclusions when a click looks invalid.",
    sections: [
      {
        heading: "The domain is the unit of protection",
        paragraphs: [
          "AnodeH does not invent a Google Ads account for you. You save the domain you want watched, paste the site tag, and enter the Ads customer ID yourself.",
          "Each plan covers a set number of websites. The same account can protect ads and score spam email once those pieces are connected.",
        ],
      },
      {
        heading: "What the tag does on the page",
        paragraphs: [
          "The tag sends the visit when the visitor leaves, or after eight seconds. Allowed and flagged visitors stay on your site. A blocked visitor is sent to anodeh.com/blocked.",
          "Google Ads does not send the visitor IP on its own connection. Scoring and exclusions use the address the site tag sees on your domain.",
        ],
      },
      {
        heading: "Exclusions that match the campaign type",
        paragraphs: [
          "Search and Display get an IP exclusion when an address is likely to return. Google Ads keeps about 500 exclusions per campaign, so AnodeH spends that room carefully and lets older entries expire.",
          "Performance Max has no IP list. When a click should be blocked, AnodeH holds the conversion instead of writing an exclusion the campaign cannot use.",
        ],
      },
    ],
  },
  {
    id: "datacenter-clicks",
    title: "Why datacenter clicks drain Google Ads budgets",
    description:
      "Hosting ranges click ads and never shop. AnodeH scores those visits and can exclude the address on Search and Display campaigns.",
    summary:
      "Datacenter ranges often look like traffic until you check engagement. AnodeH scores them as they arrive and can keep them off the next impression.",
    sections: [
      {
        heading: "What a datacenter click looks like",
        paragraphs: [
          "A click from a hosting range rarely belongs to a shopper. The visit can still burn the budget if the campaign treats every click the same.",
          "AnodeH gives each click a score and a plain reason, so you can see when a visit came from infrastructure rather than a person browsing.",
        ],
      },
      {
        heading: "How AnodeH responds",
        paragraphs: [
          "Risky addresses are written onto Search and Display exclusion lists when auto-block is on. Organic visits are free and are not blocked the same way.",
          "The dashboard shows spend, invalid cost, and the latest risky clicks without making you hunt through the ad account.",
        ],
      },
    ],
  },
  {
    id: "vpn-and-proxy-exits",
    title: "VPN and proxy exits that hide where a visitor really is",
    description:
      "AnodeH flags VPN and proxy exits that hide location, then excludes repeat addresses on Search and Display when they look invalid.",
    summary:
      "Exit nodes hide country and ISP. That makes targeting harder and can waste spend on traffic that never intended to buy.",
    sections: [
      {
        heading: "Hidden location is a risk signal",
        paragraphs: [
          "A VPN or proxy exit can place a visitor in a country you never chose to buy. The campaign still pays for the click.",
          "AnodeH scores those exits with a clear reason so the account can decide whether to allow, flag, or block.",
        ],
      },
      {
        heading: "Protection on the domain you watch",
        paragraphs: [
          "The site tag on your domain records the address AnodeH sees. That address drives scoring and the exclusion written back to Search or Display.",
          "Performance Max still has no IP exclusion list, so a blocked click holds the conversion instead.",
        ],
      },
    ],
  },
  {
    id: "repeat-ip-clicks",
    title: "Repeat IP addresses that keep spending the same budget",
    description:
      "The same IP coming back again burns Google Ads budget. AnodeH scores repeats and can exclude them before they return.",
    summary:
      "One address clicking many times is rarely a shopping journey. AnodeH treats repeat IPs as a first-class threat on the domains you protect.",
    sections: [
      {
        heading: "Why repeats matter",
        paragraphs: [
          "A shopper may reload a page. A pattern of the same IP returning to spend the budget again is different.",
          "AnodeH stores recent clicks for the account and scores repeated addresses with a plain label you can read on Activity.",
        ],
      },
      {
        heading: "Keeping the exclusion list useful",
        paragraphs: [
          "Google Ads keeps about 500 IP exclusions per campaign. AnodeH uses that room on addresses likely to return and releases older ones when the list fills.",
          "You can still allow a known office IP in Settings so legitimate staff are never scored as fraud.",
        ],
      },
    ],
  },
  {
    id: "reused-devices",
    title: "Devices that hop across many IP addresses",
    description:
      "One device on many IPs is a common invalid-traffic pattern. AnodeH groups those visits and can block the next paid click.",
    summary:
      "Threats shows devices that keep producing invalid clicks across exits. That is how AnodeH catches rotation that a single IP list would miss.",
    sections: [
      {
        heading: "Rotation hides behind new addresses",
        paragraphs: [
          "A visitor can change exits and still be the same device. Counting only unique IPs understates the problem.",
          "AnodeH hashes the device signal from the site tag and scores reused devices when they keep landing on paid clicks.",
        ],
      },
      {
        heading: "What you see in the account",
        paragraphs: [
          "Threats lists devices on more than one IP, placements with mostly invalid clicks, and the reasons behind recent blocks.",
          "Protection shows active exclusions, covered addresses, and entries that expired or were released when a campaign list filled up.",
        ],
      },
    ],
  },
  {
    id: "instant-bounces",
    title: "Instant bounce clicks that never had time to look",
    description:
      "Clicks that leave before a person could look still cost money. AnodeH scores short visits and can exclude the address next time.",
    summary:
      "Time on page is part of the score. A visit that ends before anyone could read the offer is a signal AnodeH does not ignore.",
    sections: [
      {
        heading: "Engagement is part of the score",
        paragraphs: [
          "The site tag records time on page and whether the visit looked engaged. Instant exits are a common invalid pattern.",
          "Each click gets a score and a reason, so a bounce is not a silent charge on the Ads account.",
        ],
      },
      {
        heading: "Blocking without guessing",
        paragraphs: [
          "Sensitivity in Settings controls how quickly AnodeH moves from flag to block. Balanced is the default.",
          "Blocked paid clicks on Search and Display become exclusions. On Performance Max, the conversion is held instead.",
        ],
      },
    ],
  },
  {
    id: "off-target-countries",
    title: "Off-target countries and how AnodeH treats them",
    description:
      "Visits from outside the countries you buy still cost clicks. AnodeH scores off-target countries on the domains you protect.",
    summary:
      "Country targeting in Google Ads is not the same as every click matching that map. AnodeH surfaces off-target visits with a clear reason.",
    sections: [
      {
        heading: "Why country drift happens",
        paragraphs: [
          "Proxies, travel, and broad networks can place a click outside the countries you meant to buy. The campaign can still pay.",
          "AnodeH reads the country on the visit and scores off-target traffic so you can see the pattern in Activity.",
        ],
      },
      {
        heading: "Protecting the domains you chose",
        paragraphs: [
          "Save each domain you want covered. The tag on that site is what feeds scoring for that company’s clicks.",
          "Plans cover 1, 10, or 20 websites. Multi-site accounts switch companies in Settings without mixing the wrong Ads ID.",
        ],
      },
    ],
  },
  {
    id: "search-display-exclusions",
    title: "How AnodeH uses the 500 IP exclusions on Search and Display",
    description:
      "Google Ads keeps about 500 IP exclusions per campaign. AnodeH spends that limit carefully and expires older addresses.",
    summary:
      "Exclusion room is limited. AnodeH writes addresses likely to return, then releases older ones so the list stays useful.",
    sections: [
      {
        heading: "A hard ceiling on every campaign",
        paragraphs: [
          "Search and Display can hold about 500 IP exclusions. When the list is full, something has to leave before a new address can be added.",
          "AnodeH tracks how full each campaign is and uses that room on the addresses most likely to click again.",
        ],
      },
      {
        heading: "What Protection shows",
        paragraphs: [
          "Protection lists active, covered, expired, released, and removed exclusions with the score and reasons behind each block.",
          "You can unblock an address when a real customer was caught, and allowlist office ranges so they score zero.",
        ],
      },
    ],
  },
  {
    id: "performance-max-honestly",
    title: "Performance Max has no IP list — here is what AnodeH does instead",
    description:
      "Performance Max cannot take IP exclusions. When AnodeH blocks a click, it holds the conversion instead of writing a useless exclusion.",
    summary:
      "PMax protection is different on purpose. AnodeH does not pretend an IP list exists; it holds the conversion on blocked clicks.",
    sections: [
      {
        heading: "Why exclusions do not apply",
        paragraphs: [
          "Performance Max has no IP exclusion list in Google Ads. Writing an address there would not stop the next click.",
          "AnodeH still scores the visit from the site tag on your domain. The difference is how enforcement is applied.",
        ],
      },
      {
        heading: "Holding the conversion",
        paragraphs: [
          "When a click should be blocked, AnodeH holds the conversion instead of sending a signal that rewards bad traffic.",
          "The dashboard still shows the click, the score, and the reason, so PMax activity is readable next to Search and Display.",
        ],
      },
    ],
  },
  {
    id: "site-tag-and-scoring",
    title: "The site tag that scores clicks on your domain",
    description:
      "Paste the AnodeH tag on each protected domain. It scores the visit, then exclusions or held conversions follow from that score.",
    summary:
      "Without the tag, AnodeH cannot see the visitor IP Google Ads withholds. The domain you protect starts with that one script.",
    sections: [
      {
        heading: "Install once per website",
        paragraphs: [
          "Settings shows the snippet for the account key. Paste it on each domain covered by the plan.",
          "The tag fires when the visitor leaves or after eight seconds, then AnodeH stores the scored click for the account.",
        ],
      },
      {
        heading: "From score to action",
        paragraphs: [
          "Allow, flag, and block are the three outcomes. Blocked paid clicks become exclusions on Search and Display, or a held conversion on Performance Max.",
          "Organic searches are free. A risky organic visit can still be flagged, but it is not excluded and the visitor is not sent to the blocked page.",
        ],
      },
    ],
  },
  {
    id: "spam-email-same-account",
    title: "Spam email monitoring on the same AnodeH account",
    description:
      "The same AnodeH account that protects Google Ads can score spam and phishing, move junk aside, and alert the mailbox owner.",
    summary:
      "Domain protection is not only ads. After you subscribe, Spam email can score pasted messages or sync a mailbox over IMAP.",
    sections: [
      {
        heading: "Score a message the same way as a click",
        paragraphs: [
          "Paste a message and AnodeH returns a score with a plain reason, the same style used for click scoring.",
          "Phishing patterns, odd reply domains, and urgent payment bait are the kinds of signals that raise the score.",
        ],
      },
      {
        heading: "Mailbox sync",
        paragraphs: [
          "Connect IMAP once. AnodeH checks recent mail about every five minutes, moves flagged and blocked messages to Junk, and emails the owner.",
          "Gmail works with an app password. Afrihost and similar hosts use the mailbox hostname, port 993, and the full email login.",
        ],
      },
    ],
  },
  {
    id: "allowlist-trusted-ips",
    title: "Allowlisting trusted IPs while AnodeH protects the rest",
    description:
      "Office and home addresses can be allowlisted so they score zero while AnodeH still blocks invalid traffic on the domain.",
    summary:
      "Protection should not trap your own team. Settings accepts an IPv4 address or a /24 range that always scores clean.",
    sections: [
      {
        heading: "When to allow an address",
        paragraphs: [
          "Staff testing ads from the office, agencies checking landing pages, and known partners should not look like fraud.",
          "Add the address or range in Settings with a short note. Those visits score zero and stay off the exclusion list.",
        ],
      },
      {
        heading: "Everything else still scored",
        paragraphs: [
          "Allowlisting does not turn protection off. Datacenter clicks, VPN exits, repeats, and bounces are still scored on the domains you watch.",
          "You can remove an allowlist entry later if the address should be treated like any other visit.",
        ],
      },
    ],
  },
  {
    id: "reading-the-dashboard",
    title: "Reading the AnodeH dashboard for invalid click cost",
    description:
      "The AnodeH dashboard shows clicks, invalid rate, estimated invalid cost, and exclusions for the domains you protect.",
    summary:
      "A week you can actually read: spend, invalid cost, and the latest risky clicks on one screen instead of buried in Ads reports.",
    sections: [
      {
        heading: "Metrics that matter",
        paragraphs: [
          "Clicks, invalid rate, estimated invalid cost, and how full the exclusion lists are sit at the top of the overview.",
          "Paid click totals come from Google Ads when the account is connected. Scored visits still come from the site tag.",
        ],
      },
      {
        heading: "Live while the page stays open",
        paragraphs: [
          "The dashboard asks the server for the latest clicks, spend, and alerts every 15 seconds while the page stays open.",
          "Daily email reports summarize the previous local day so you do not have to open the product to know what was blocked.",
        ],
      },
    ],
  },
  {
    id: "google-ads-customer-id",
    title: "Why AnodeH needs the Google Ads customer ID you enter",
    description:
      "AnodeH does not pick an Ads account automatically. Enter the 10-digit customer ID in Settings for each domain you protect.",
    summary:
      "Protection follows the Ads account you choose. That keeps the wrong customer ID from receiving exclusions meant for another brand.",
    sections: [
      {
        heading: "You choose the account",
        paragraphs: [
          "After signup, enter your own Google Ads customer ID in Settings. It is the 10-digit number, like 123-456-7890.",
          "AnodeH does not pick an Ads account automatically, and paid totals only sync after that ID is saved and connected.",
        ],
      },
      {
        heading: "One ID per company on multi-site plans",
        paragraphs: [
          "Ten and twenty website plans store a company list. Each domain can keep its own Ads account number.",
          "Switching companies changes which results you see, without mixing exclusions across brands.",
        ],
      },
    ],
  },
  {
    id: "organic-vs-paid",
    title: "Organic visits stay free while paid clicks are protected",
    description:
      "Organic searches are free. AnodeH scores paid Google Ads clicks for invalid traffic and can exclude risky addresses.",
    summary:
      "Not every visit should be blocked. Organic traffic is free; paid clicks are where AnodeH spends its protection budget.",
    sections: [
      {
        heading: "Different channels, different rules",
        paragraphs: [
          "Organic searches are free clicks. Google Ads does not charge for them, and they are not blocked.",
          "A risky organic visit can still be flagged, but it is not excluded and the visitor is not sent to the blocked page.",
        ],
      },
      {
        heading: "Paid clicks carry the cost",
        paragraphs: [
          "Paid clicks are scored for datacenter ranges, VPN exits, repeats, reused devices, bounces, and off-target countries.",
          "That is how AnodeH puts the budget back on real shoppers for the domains you chose to protect.",
        ],
      },
    ],
  },
  {
    id: "blocked-page",
    title: "What happens when AnodeH sends a visitor to the blocked page",
    description:
      "A blocked paid click is sent to anodeh.com/blocked. That stops the visit from acting like a real conversion on your domain.",
    summary:
      "Blocking is visible on purpose. The visitor leaves your site, and Search or Display can receive an exclusion for the address.",
    sections: [
      {
        heading: "Why redirect",
        paragraphs: [
          "Allowed and flagged visitors stay on the page. A blocked visitor is sent to anodeh.com/blocked so the session does not continue as a normal browse.",
          "That keeps junk traffic from filling forms or firing events that look like success.",
        ],
      },
      {
        heading: "After the block",
        paragraphs: [
          "On Search and Display, the address can be written as an exclusion. On Performance Max, the conversion is held instead.",
          "Activity keeps the score and reasons so you can audit what was blocked and unblock mistakes.",
        ],
      },
    ],
  },
  {
    id: "sensitivity-and-auto-block",
    title: "Sensitivity and auto-block settings for domain protection",
    description:
      "AnodeH sensitivity and auto-block control how quickly risky clicks become exclusions on the domains you protect.",
    summary:
      "Balanced is the default. You can tune how aggressive AnodeH is without turning off scoring.",
    sections: [
      {
        heading: "Score first, then enforce",
        paragraphs: [
          "Every click is scored. Auto-block decides whether a high score becomes an exclusion or stays a flag you review.",
          "Block duration controls how long an exclusion stays active before it expires from the campaign list.",
        ],
      },
      {
        heading: "Change it in Settings",
        paragraphs: [
          "Sensitivity, auto-block, and block days live next to the domain and Ads account fields.",
          "Allowlisted IPs still score zero regardless of sensitivity, so trusted ranges stay clean.",
        ],
      },
    ],
  },
  {
    id: "placements-that-should-come-off",
    title: "Placements that keep producing invalid clicks",
    description:
      "A placement with mostly invalid clicks should come off the campaign. AnodeH surfaces those sites next to IP and device threats.",
    summary:
      "Not every problem is an IP. Threats also shows placements that waste budget so you can remove them from the buy.",
    sections: [
      {
        heading: "Beyond the address",
        paragraphs: [
          "Some sites send traffic that almost never engages. Excluding a few IPs is not enough if the placement keeps feeding new ones.",
          "AnodeH groups invalid activity by placement so you can see which sites should leave the campaign.",
        ],
      },
      {
        heading: "Use it with exclusions",
        paragraphs: [
          "IP exclusions stop repeats. Removing a bad placement stops the next wave of fresh addresses from that source.",
          "Together with domain scoring, that is how AnodeH protects spend from both returning and newly minted junk.",
        ],
      },
    ],
  },
  {
    id: "multi-site-protection",
    title: "Protecting 10 or 20 websites on one AnodeH account",
    description:
      "AnodeH plans cover 1, 10, or 20 websites. Each domain gets the site tag and its own Google Ads customer ID.",
    summary:
      "Agencies and multi-brand teams keep companies separate while sharing one login for click protection and spam scoring.",
    sections: [
      {
        heading: "What a company record holds",
        paragraphs: [
          "Each saved company has a domain and an Ads account number. Switching companies changes which results you see.",
          "The same tag pattern goes on each website, with the account key from Settings.",
        ],
      },
      {
        heading: "Pricing shape",
        paragraphs: [
          "One website has a 7-day free trial, then PayPal bills every 30 days. Ten and twenty website plans are half price for the first 30 days.",
          "Cancel anytime in PayPal. Protection stops when the paid period ends.",
        ],
      },
    ],
  },
  {
    id: "daily-report-email",
    title: "Daily email reports of what AnodeH blocked",
    description:
      "AnodeH emails a daily report of scored and blocked clicks so you see protection results without opening the dashboard.",
    summary:
      "Domain protection continues overnight. The morning report summarizes the previous local day for the account.",
    sections: [
      {
        heading: "What the report covers",
        paragraphs: [
          "The daily mail summarizes clicks and the invalid activity from the previous local day for your account time zone.",
          "It uses the account email from signup. Password resets and payment receipts use the same address.",
        ],
      },
      {
        heading: "Still open the product for detail",
        paragraphs: [
          "Activity and Protection hold the full list of reasons, scores, and exclusions if you need to unblock someone.",
          "Spam mailbox alerts are separate: those fire when a flagged or blocked message lands in the synced inbox.",
        ],
      },
    ],
  },
  {
    id: "click-fraud-patterns",
    title: "The click fraud patterns AnodeH is built to catch",
    description:
      "AnodeH scores datacenter, VPN, repeat, device reuse, bounce, and off-target clicks on the domains you protect.",
    summary:
      "Invalid traffic is a mix of patterns, not one signature. AnodeH scores each click with reasons you can read.",
    sections: [
      {
        heading: "The threat list",
        paragraphs: [
          "Datacenter clicks, VPN and proxy exits, repeat addresses, reused devices, instant bounces, and off-target countries are the core ads threats.",
          "For email, phishing and spam patterns are scored separately on the Spam email page.",
        ],
      },
      {
        heading: "Plain reasons",
        paragraphs: [
          "Every scored click carries reasons such as repeated IP, datacenter network, or short time on page.",
          "That keeps protection auditable: you can see why an exclusion was written, not only that something was blocked.",
        ],
      },
    ],
  },
  {
    id: "saving-budget-with-exclusions",
    title: "Saving Google Ads budget with smarter IP exclusions",
    description:
      "AnodeH writes IP exclusions for invalid clicks on Search and Display, and holds conversions on Performance Max.",
    summary:
      "The goal is simple: stop paying for clicks that were never going to buy, while keeping real shoppers on the domain.",
    sections: [
      {
        heading: "Spend the exclusion slots well",
        paragraphs: [
          "With about 500 slots per campaign, every exclusion should earn its place. AnodeH prefers addresses likely to return.",
          "Expired and released entries leave room for the next threat without wiping the whole list by hand.",
        ],
      },
      {
        heading: "Measure the invalid cost",
        paragraphs: [
          "Estimated invalid cost on the dashboard turns scores into money language next to total spend.",
          "That makes it easier to see whether protection is paying for itself on the domains you watch.",
        ],
      },
    ],
  },
  {
    id: "connecting-google-ads",
    title: "Connecting Google Ads so AnodeH can read paid click totals",
    description:
      "Connect Google Ads after you enter the customer ID. AnodeH still scores visits from the site tag on your domain.",
    summary:
      "Paid totals come from Google. Scoring and exclusions still need the tag, because Google does not send the visitor IP.",
    sections: [
      {
        heading: "Two data paths",
        paragraphs: [
          "Google Ads supplies paid click totals and campaign names when the account is linked.",
          "The site tag supplies the visitor IP, device signal, time on page, and the score that drives exclusions.",
        ],
      },
      {
        heading: "If the link is missing",
        paragraphs: [
          "You can still score visits after the tag is installed. Paid totals and some dashboard metrics stay incomplete until Ads is connected.",
          "Settings is where the customer ID and connection live for each company domain.",
        ],
      },
    ],
  },
  {
    id: "unblocking-mistakes",
    title: "Unblocking a real customer who was excluded by mistake",
    description:
      "AnodeH lets you unblock an exclusion and allowlist an IP so legitimate visitors keep reaching the domains you protect.",
    summary:
      "Protection is reversible. When a real customer is caught, remove the exclusion and allow the address if they will return.",
    sections: [
      {
        heading: "Find the exclusion",
        paragraphs: [
          "Protection lists active exclusions with scores and reasons. Open the row and unblock when the visit was legitimate.",
          "Activity shows the underlying click so you can compare time on page, country, and network.",
        ],
      },
      {
        heading: "Prevent a repeat false positive",
        paragraphs: [
          "Add the address to the allowlist if it belongs to staff or a known partner. Those visits then score zero.",
          "If sensitivity feels too high for your market, lower it in Settings rather than turning auto-block off entirely.",
        ],
      },
    ],
  },
  {
    id: "domain-key-and-tag",
    title: "The domain key behind every AnodeH site tag",
    description:
      "Each AnodeH account has a domain key in the site tag. That key ties scored visits to the domains you protect.",
    summary:
      "The snippet in Settings includes your account key. Paste the same pattern on each covered website.",
    sections: [
      {
        heading: "Why the key exists",
        paragraphs: [
          "The key tells AnodeH which account owns the visit. Without it, scored clicks cannot be stored against the right user.",
          "Keys are created with the account. You do not need to invent one when adding another company domain on a multi-site plan.",
        ],
      },
      {
        heading: "Keep the tag on the live site",
        paragraphs: [
          "If the tag is removed, new visits stop scoring even though old exclusions may still sit on the Ads campaigns.",
          "After a redesign or CMS change, confirm the snippet is still present on the domains you expect AnodeH to protect.",
        ],
      },
    ],
  },
  {
    id: "phishing-vs-click-fraud",
    title: "Phishing in the inbox and click fraud on the ads account",
    description:
      "AnodeH covers two attack surfaces: invalid Google Ads clicks on your domains and spam or phishing in a connected mailbox.",
    summary:
      "One login, two jobs. Ads protection saves budget; mailbox scoring keeps payment bait and fake brands out of the inbox.",
    sections: [
      {
        heading: "Different channels, same scoring idea",
        paragraphs: [
          "Clicks get a score and reasons. Mail gets a score and reasons. Both surfaces use plain language instead of opaque risk codes.",
          "You choose what to connect: the site tag is required for ads; IMAP is optional for spam sync.",
        ],
      },
      {
        heading: "Alerts that reach the owner",
        paragraphs: [
          "Flagged or blocked mail can trigger an email to the account owner so the inbox is not left alone.",
          "Ads activity shows up in the dashboard and the daily report, with exclusions written where the campaign type allows.",
        ],
      },
    ],
  },
  {
    id: "why-ip-still-matters",
    title: "Why IP address still matters for Google Ads protection",
    description:
      "Google Ads does not send visitor IPs to AnodeH. The site tag on your domain supplies the address used for scoring and exclusions.",
    summary:
      "IP is still the lever Search and Display understand. AnodeH collects it on your site, then writes exclusions Google can enforce.",
    sections: [
      {
        heading: "The gap Google leaves",
        paragraphs: [
          "Connecting Google Ads does not include the visitor IP. Without the tag, AnodeH cannot score or exclude the address.",
          "That is why domain setup is not optional marketing copy — it is the data path for protection.",
        ],
      },
      {
        heading: "What AnodeH does with the address",
        paragraphs: [
          "The IP feeds repeat detection, network and country signals, and the exclusion list on Search and Display.",
          "Device reuse and bounce signals sit beside the IP so rotation and instant exits are still caught.",
        ],
      },
    ],
  },
  {
    id: "trial-then-protect",
    title: "Start with a 7-day trial, then keep protecting the domain",
    description:
      "One-website AnodeH plans are free for 7 days, then PayPal bills every 30 days while click and spam protection stay on.",
    summary:
      "Use the trial to install the tag, enter the Ads ID, and watch scored clicks before the first paid period.",
    sections: [
      {
        heading: "What to finish in the first week",
        paragraphs: [
          "Create the account, save the domain, paste the tag, and enter the Google Ads customer ID.",
          "Optionally connect IMAP if you want spam scoring in the same product that protects ads.",
        ],
      },
      {
        heading: "After the trial",
        paragraphs: [
          "PayPal charges the plan every 30 days until you cancel. Ten and twenty website plans use a half-price first month instead of the 7-day trial.",
          "Protection continues for the paid period. Cancel in PayPal when you no longer need the account.",
        ],
      },
    ],
  },
  {
    id: "support-for-tag-and-ads",
    title: "Getting help when the tag or Ads connection needs a hand",
    description:
      "AnodeH support covers the site tag, Google Ads account setup, and subscriptions. Send a request from the support page.",
    summary:
      "If a domain is not scoring or exclusions are not appearing, support@anodeh.com can walk through the setup.",
    sections: [
      {
        heading: "What to include",
        paragraphs: [
          "Name the site you want the tag on, the Ads customer ID you entered, and what you expected to see.",
          "The support form emails support@anodeh.com and replies to the address you enter.",
        ],
      },
      {
        heading: "Self-serve checks first",
        paragraphs: [
          "Confirm the tag is present, the domain is saved, and the Ads ID matches the account you meant to watch.",
          "Activity should show new visits after a real click. If organic visits appear but paid ones do not, check the Ads connection next.",
        ],
      },
    ],
  },
  {
    id: "putting-budget-back",
    title: "Putting the Google Ads budget back on real clicks",
    description:
      "AnodeH scores invalid traffic, writes exclusions, and holds bad Performance Max conversions so spend returns to real shoppers.",
    summary:
      "Protection is not a report you ignore. It changes what the campaign pays for on the domains you chose.",
    sections: [
      {
        heading: "Score, exclude, review",
        paragraphs: [
          "Clicks are scored as they arrive. Risky addresses become exclusions on Search and Display. PMax holds conversions instead.",
          "You review mistakes, allowlist trusted ranges, and keep the domain tag installed.",
        ],
      },
      {
        heading: "Ads and email together",
        paragraphs: [
          "The same account can watch the inbox for phishing while it protects paid clicks.",
          "That is the full AnodeH loop: fewer wasted clicks on the domain, fewer junk messages in the mailbox.",
        ],
      },
    ],
  },
];

export function topicCount() {
  return BLOG_TOPICS.length;
}

export function topicAt(index: number): BlogTopic {
  const count = BLOG_TOPICS.length;
  const safe = ((index % count) + count) % count;
  return BLOG_TOPICS[safe]!;
}

export function dayKeyFromMs(now = Date.now(), timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/** Stable day index so the same calendar day always maps to the same topic. */
export function dayIndex(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const utc = Date.UTC(year!, month! - 1, day!);
  return Math.floor(utc / 86_400_000);
}

export function pickTopicForDay(dayKey: string): BlogTopic {
  return topicAt(dayIndex(dayKey));
}

export function slugForDay(dayKey: string, topic: BlogTopic) {
  return `${dayKey}-${topic.id}`;
}

export function dayLabel(dayKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dayKey}T12:00:00Z`));
}

export function renderBlogHtml(topic: BlogTopic, dayKey: string) {
  const parts = [
    `<p>${escapeHtml(topic.summary)}</p>`,
    `<p>This post is about how AnodeH protects domains from invalid Google Ads clicks and related threats (${escapeHtml(dayLabel(dayKey))}).</p>`,
  ];

  for (const section of topic.sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    for (const paragraph of section.paragraphs) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
  }

  parts.push(
    `<h2>Start protecting a domain</h2>`,
    `<p>Create an AnodeH account, save the domain, paste the site tag, and enter the Google Ads customer ID you want watched. <a href="/register">Create an account</a> or read more on the <a href="/">AnodeH home page</a>.</p>`,
  );

  return parts.join("\n");
}

export function renderBlogText(topic: BlogTopic, dayKey: string) {
  const lines = [topic.summary, "", `This post is about how AnodeH protects domains from invalid Google Ads clicks and related threats (${dayLabel(dayKey)}).`, ""];
  for (const section of topic.sections) {
    lines.push(section.heading, "");
    for (const paragraph of section.paragraphs) {
      lines.push(paragraph, "");
    }
  }
  lines.push(
    "Start protecting a domain",
    "",
    "Create an AnodeH account, save the domain, paste the site tag, and enter the Google Ads customer ID you want watched.",
  );
  return lines.join("\n");
}

export function facebookCaption(topic: BlogTopic, url: string) {
  return `${topic.title}\n\n${topic.summary}\n\nRead more: ${url}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
