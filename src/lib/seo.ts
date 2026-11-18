import type { Metadata } from "next";

export const SITE = "https://anodeh.com";

export const home = {
  title: "AnodeH — Block the clicks that were never going to buy",
  description:
    "AnodeH scores Google Ads clicks and spam email, writes IP exclusions for Search and Display, and alerts you when junk lands in the inbox.",
};

export const searchPages = [
  {
    path: "/",
    title: home.title,
    description: home.description,
  },
  {
    path: "/blocked",
    title: "This visit was blocked",
    description:
      "This click was blocked as invalid traffic. AnodeH stops datacenter, VPN, repeat, and bounce clicks from spending a Google Ads budget.",
  },
  {
    path: "/privacy",
    title: "Privacy",
    description:
      "How AnodeH handles an account, the site tag, recorded clicks, and a connected Google Ads account. What is stored, and what is not shared.",
  },
  {
    path: "/terms",
    title: "Terms",
    description:
      "Terms for an AnodeH plan. One website has a 7-day free trial, then PayPal charges every 30 days until you cancel.",
  },
  {
    path: "/support",
    title: "Support",
    description:
      "Help with the AnodeH site tag, a Google Ads account, or a subscription. Send a request and it goes to support@anodeh.com.",
  },
  {
    path: "/login",
    title: "Log in",
    description: "Log in to AnodeH to see scored clicks, exclusions, and the Google Ads account you are watching.",
  },
  {
    path: "/register",
    title: "Create an account",
    description:
      "Create an AnodeH account for 1, 10, or 20 websites. One website has a 7-day free trial, then PayPal bills every 30 days.",
  },
] as const;

export const noIndex: Metadata = {
  robots: { index: false, follow: false },
};

export function pageMeta(path: string): Metadata {
  const page = searchPages.find((item) => item.path === path);
  if (!page) return {};
  const titled = path === "/" ? page.title : `${page.title} · AnodeH`;
  return {
    title: path === "/" ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: path },
    openGraph: {
      title: titled,
      description: page.description,
      url: path,
    },
    twitter: {
      title: titled,
      description: page.description,
    },
  };
}

export const LOGO = `${SITE}/logo.png`;

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "AnodeH",
        url: SITE,
        logo: {
          "@type": "ImageObject",
          url: LOGO,
          width: 512,
          height: 512,
        },
        image: LOGO,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "AnodeH",
        publisher: { "@id": `${SITE}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "AnodeH",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE,
        description: home.description,
        image: LOGO,
        logo: LOGO,
        publisher: { "@id": `${SITE}/#organization` },
        offers: {
          "@type": "Offer",
          price: "69.00",
          priceCurrency: "USD",
          description: "One website. Free for 7 days, then $69 every 30 days.",
        },
      },
    ],
  };
}
