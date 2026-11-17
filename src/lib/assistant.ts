export type AssistantLink = { label: string; href: string };

export type AssistantAnswer = {
  text: string;
  links: AssistantLink[];
};

const ANSWERS: { test: RegExp; answer: AssistantAnswer }[] = [
  {
    test: /organic|seo|not an ad|without (a )?gclid|google search(?! ads)/,
    answer: {
      text: "Organic searches are not blocked. A risky organic visit can still be flagged, but it is not excluded and the visitor is not sent to the blocked page. Paid clicks are still scored.",
      links: [{ label: "Activity", href: "/activity" }],
    },
  },
  {
    test: /price|pricing|plan|cost|how much|\$|paypal|month|annual|year/,
    answer: {
      text: "The first 30 days are $34.50, then $69 every 30 days, or $759 for the year. The page shows that price in the visitor’s currency. PayPal collects the US dollar amount.",
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
    test: /google ads|explorer|oauth|client id|connect/,
    answer: {
      text: "Connect Google Ads in Settings with the account you want to watch. AnodeH downloads campaigns and recent clicks. Google does not send the visitor IP, so scoring and exclusions still use the site tag. The Cloud project that owns the OAuth client needs Explorer access before it can read a live account.",
      links: [{ label: "Settings", href: "/settings" }],
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
      text: "A threat row shows a price only when Google Ads reported a price for every click in that row. Otherwise the price is a dash.",
      links: [{ label: "Threats", href: "/threats" }],
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
