import {
  SITES_10_CENTS,
  SITES_10_INTRO_CENTS,
  SITES_20_CENTS,
  SITES_20_INTRO_CENTS,
} from "@/lib/site-plans";

export type AssistantLink = { label: string; href: string };

export type AssistantAnswer = {
  text: string;
  links: AssistantLink[];
};

export type AssistantPrices = {
  currency: string;
  name: string;
  standard: string;
  half10: string;
  sites10: string;
  half20: string;
  sites20: string;
};

const STANDARD_CENTS = 6900;

function dollars(cents: number) {
  const amount = cents / 100;
  return `$${cents % 100 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

export function defaultAssistantPrices(): AssistantPrices {
  return {
    currency: "USD",
    name: "US dollars",
    standard: dollars(STANDARD_CENTS),
    half10: dollars(SITES_10_INTRO_CENTS),
    sites10: dollars(SITES_10_CENTS),
    half20: dollars(SITES_20_INTRO_CENTS),
    sites20: dollars(SITES_20_CENTS),
  };
}

function pricingAnswer(quote: AssistantPrices): AssistantAnswer {
  const local = quote.currency === "USD" ? "" : ` Amounts are shown in ${quote.name}.`;
  return {
    text: `One website is free for 7 days, then ${quote.standard} every 30 days. Ten websites are ${quote.half10} for the first 30 days, then ${quote.sites10}. Twenty websites are ${quote.half20} for the first 30 days, then ${quote.sites20}. PayPal starts the subscription and charges after the intro until you cancel.${local} PayPal collects the US dollar amount.`,
    links: [{ label: "Plans", href: "/billing" }],
  };
}

const ANSWERS: { test: RegExp; answer: AssistantAnswer | ((quote: AssistantPrices) => AssistantAnswer) }[] = [
  {
    test: /organic|seo|not an ad|without (a )?gclid|google search(?! ads)/,
    answer: {
      text: "Organic searches are free clicks. Google Ads does not charge for them, and they are not blocked. A risky organic visit can still be flagged, but it is not excluded and the visitor is not sent to the blocked page. Paid clicks are still scored.",
      links: [{ label: "Activity", href: "/activity" }],
    },
  },
  {
    test: /price|pricing|plan|cost|how much|\$|paypal|month|annual|year/,
    answer: pricingAnswer,
  },
  {
    test: /password|forgot|reset/,
    answer: {
      text: "Forgot password emails a link. The link lasts 30 minutes and opens the page where a new password is set.",
      links: [{ label: "Forgot password", href: "/forgot-password" }],
    },
  },
  {
    test: /province|unassigned|region|where .*block/,
    answer: {
      text: "A visit with no campaign name is labeled with the province from the visitor’s IP. A named campaign keeps its name.",
      links: [{ label: "Activity", href: "/activity" }],
    },
  },
  {
    test: /account number|customer id|ads account/,
    answer: {
      text: "After you create an account, enter your own Google Ads customer ID in Settings. It is the 10-digit number, like 123-456-7890. AnodeH does not pick an Ads account automatically.",
      links: [{ label: "Settings", href: "/settings" }],
    },
  },
  {
    test: /google ads|explorer|oauth|client id|connect/,
    answer: {
      text: "Paid click totals come from Google Ads. Scored visits come from the site tag. Google does not send the visitor IP, so scoring and exclusions still use that tag.",
      links: [{ label: "Overview", href: "/dashboard" }],
    },
  },
  {
    test: /refresh|15 second|live|update/,
    answer: {
      text: "The dashboard asks the server for the latest clicks, spend, and alerts every 15 seconds while the page stays open.",
      links: [{ label: "Dashboard", href: "/dashboard" }],
    },
  },
  {
    test: /daily|today|all time|range|default/,
    answer: {
      text: "Activity and Threats open on today. Weekly, monthly, and all time stay in the range filter.",
      links: [{ label: "Activity", href: "/activity" }, { label: "Threats", href: "/threats" }],
    },
  },
  {
    test: /threat|placement|click price|cpc|cost of/,
    answer: {
      text: "Threats lists the addresses, devices, and placements behind invalid clicks. Paid click totals are on the dashboard.",
      links: [{ label: "Threats", href: "/threats" }],
    },
  },
  {
    test: /spam|phishing|inbox|email threat|junk mail/,
    answer: {
      text: "Spam email monitoring lives in the same AnodeH account. Paste a message for a score, or connect IMAP so recent mail is scored. Connected mailboxes sync about every 5 minutes on their own. Flagged and blocked mailbox messages are moved to Junk, and you get an email alert.",
      links: [{ label: "Spam email", href: "/spam" }],
    },
  },
  {
    test: /block|exclud|invalid|flag|score|pmax|performance max/,
    answer: {
      text: "Each paid click is allowed, flagged, or blocked, with a plain reason. Search and Display can write an IP exclusion. Performance Max has no IP list, so a blocked click holds the conversion instead. Organic searches are not blocked.",
      links: [{ label: "Protection", href: "/protection" }],
    },
  },
  {
    test: /wordpress|shopify|wix|squarespace|webflow|godaddy|framer|afrihost|sitepad|tag manager|gtm|paste|footer|theme\.liquid|custom code/,
    answer: {
      text: "Copy the script in Settings and paste that same script on every page, just before </body>. It must be the script itself. Google Tag Manager and other tools that add it after the page loads cannot read the key.\nWordPress: a header and footer plugin, or the theme footer, before </body>.\nShopify: Online Store, Themes, Edit code, theme.liquid, before </body>.\nWix: Settings, Custom code, Body - end.\nSquarespace: Settings, Advanced, Code Injection, Footer.\nWebflow: Project settings, Custom code, Footer code.\nAfrihost SiteBuilder: Pages, All pages, edit the Footer, then Advanced, paste it in the HTML box, Save, and Update. An Afrihost WordPress site uses the WordPress steps.\nGoDaddy and other builders: custom code or the footer, then paste it there.",
      links: [{ label: "Settings", href: "/settings" }],
    },
  },
  {
    test: /support|contact|help me|install the tag/,
    answer: {
      text: "Send a support request and it goes to support@anodeh.com. The site tag is in Settings. Paste it on every page of your site, just before the closing body tag.",
      links: [{ label: "Support", href: "/support" }, { label: "Settings", href: "/settings" }],
    },
  },
  {
    test: /what|how|anodeh|help|start|tag|script/,
    answer: {
      text: "AnodeH scores invalid clicks on Google Ads and writes the exclusions. Paste the site tag on your domain. It reports the visit when the visitor leaves, or after eight seconds. A blocked paid visitor is sent to the blocked page.",
      links: [{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }],
    },
  },
];

export function assistantReply(question: string, quote: AssistantPrices = defaultAssistantPrices()): AssistantAnswer {
  const asked = question.trim().toLowerCase();
  if (!asked) {
    return {
      text: "Ask about blocking, plans, organic visits, or the dashboard.",
      links: [],
    };
  }
  const matched = ANSWERS.find((item) => item.test.test(asked));
  if (!matched) {
    return {
      text: "I can help with how AnodeH scores clicks, what gets blocked, the plans, and where to connect Google Ads.",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Plans", href: "/billing" },
      ],
    };
  }
  return typeof matched.answer === "function" ? matched.answer(quote) : matched.answer;
}
