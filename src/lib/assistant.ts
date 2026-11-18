export type AssistantLink = { label: string; href: string };

export type AssistantAnswer = {
  text: string;
  links: AssistantLink[];
};

const ANSWERS: { test: RegExp; answer: AssistantAnswer }[] = [
  {
    test: /organic|seo|not an ad|without (a )?gclid|google search(?! ads)/,
    answer: {
      text: "Organic searches are free clicks. Google Ads does not charge for them, and they are not blocked. A risky organic visit can still be flagged, but it is not excluded and the visitor is not sent to the blocked page. Paid clicks are still scored.",
      links: [{ label: "Activity", href: "/activity" }],
    },
  },
  {
    test: /price|pricing|plan|cost|how much|\$|paypal|month|annual|year/,
    answer: {
      text: "Every plan is half price for the first 30 days, then the regular price. One website is $34.50, then $69 every 30 days. Ten websites are $94.50, then $189 every 30 days. Twenty websites are $144.50, then $289 every 30 days. PayPal deducts that until you cancel. The page shows those prices in the visitor’s currency. PayPal collects the US dollar amount.",
      links: [{ label: "Plans", href: "/billing" }],
    },
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
      text: "The Google Ads account number goes in Settings. It is the 10-digit customer ID, like 123-456-7890.",
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
      text: "Spam email monitoring lives in the same AnodeH account. Paste a message for a score, or connect IMAP so recent mail is scored. Flagged and blocked mailbox messages are moved to Junk, and you get an email alert.",
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

export function assistantReply(question: string): AssistantAnswer {
  const asked = question.trim().toLowerCase();
  if (!asked) {
    return {
      text: "Ask about blocking, plans, organic visits, or the dashboard.",
      links: [],
    };
  }
  return (
    ANSWERS.find((item) => item.test.test(asked))?.answer ?? {
      text: "I can help with how AnodeH scores clicks, what gets blocked, the plans, and where to connect Google Ads.",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Plans", href: "/billing" },
      ],
    }
  );
}
