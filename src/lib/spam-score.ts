export type SpamAction = "allow" | "flag" | "block";

export type SpamInput = {
  from: string;
  subject: string;
  body: string;
  replyTo?: string;
  links?: string[];
};

export type SpamVerdict = {
  score: number;
  reasons: string[];
  action: SpamAction;
};

export const SPAM_REASON_LABELS: Record<string, string> = {
  urgent_pressure: "Urgent pressure language",
  money_request: "Asks for money or gift cards",
  credential_harvest: "Asks for passwords or account login",
  brand_spoof: "Pretends to be a known brand",
  link_mismatch: "Links do not match the claimed sender",
  shortener_link: "Uses a link shortener",
  ip_link: "Links to a raw IP address",
  reply_mismatch: "Reply-To differs from From",
  free_mail_brand: "Free mailbox claiming to be a company",
  excessive_punctuation: "Heavy caps or punctuation",
};

const URGENT = /\b(urgent|immediately|act now|within 24 hours|account (will be |is )?suspend|verify (your )?account|unusual (sign[- ]?in|activity)|final notice|limited time)\b/i;
const MONEY = /\b(gift ?card|wire transfer|bitcoin|crypto|western union|send (me )?(money|funds)|payment overdue|invoice attached)\b/i;
const CREDS = /\b(confirm (your )?password|reset your password|login (here|now)|enter your (pin|otp|one[- ]time)|update your billing)\b/i;
const SHORTENER = /^https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|cutt\.ly|rebrand\.ly)\b/i;
const IP_URL = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/i;
const BRANDS: { name: string; domains: string[] }[] = [
  { name: "Google", domains: ["google.com", "googlemail.com", "gmail.com", "youtube.com"] },
  { name: "PayPal", domains: ["paypal.com", "paypal.co.uk"] },
  { name: "Microsoft", domains: ["microsoft.com", "outlook.com", "live.com", "office.com"] },
  { name: "Apple", domains: ["apple.com", "icloud.com"] },
  { name: "Amazon", domains: ["amazon.com", "amazon.co.uk", "amazonaws.com"] },
  { name: "SARS", domains: ["sars.gov.za"] },
  { name: "Standard Bank", domains: ["standardbank.co.za"] },
  { name: "FNB", domains: ["fnb.co.za"] },
  { name: "Absa", domains: ["absa.co.za"] },
  { name: "Nedbank", domains: ["nedbank.co.za"] },
];
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "aol.com", "proton.me", "protonmail.com", "mail.com"]);

export function reasonText(reasons: string[]): string {
  if (reasons.length === 0) return "No spam signals";
  return reasons.map((reason) => SPAM_REASON_LABELS[reason] ?? reason).join(" · ");
}

export function extractEmailAddress(value: string): string {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (match?.[0] || value).trim().toLowerCase();
}

export function extractDomain(value: string): string {
  const email = extractEmailAddress(value);
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : "";
}

export function extractLinks(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
  return [...new Set(found.map((item) => item.replace(/[.,;:!?]+$/, "")))];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function brandMentioned(text: string) {
  const lower = text.toLowerCase();
  return BRANDS.filter((brand) => lower.includes(brand.name.toLowerCase()));
}

export function evaluateSpam(input: SpamInput): SpamVerdict {
  const from = input.from.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  const text = `${subject}\n${body}`;
  const links = input.links?.length ? input.links : extractLinks(text);
  const fromDomain = extractDomain(from);
  const replyDomain = input.replyTo ? extractDomain(input.replyTo) : "";

  let score = 0;
  const reasons: string[] = [];

  if (URGENT.test(text)) {
    score += 20;
    reasons.push("urgent_pressure");
  }
  if (MONEY.test(text)) {
    score += 25;
    reasons.push("money_request");
  }
  if (CREDS.test(text)) {
    score += 30;
    reasons.push("credential_harvest");
  }
  if (replyDomain && fromDomain && replyDomain !== fromDomain) {
    score += 20;
    reasons.push("reply_mismatch");
  }

  const brands = brandMentioned(`${from} ${text}`);
  for (const brand of brands) {
    if (fromDomain && !brand.domains.some((domain) => fromDomain === domain || fromDomain.endsWith(`.${domain}`))) {
      score += 35;
      reasons.push("brand_spoof");
      break;
    }
  }

  if (brands.length > 0 && fromDomain && FREE_MAIL.has(fromDomain)) {
    score += 25;
    if (!reasons.includes("free_mail_brand")) reasons.push("free_mail_brand");
  }

  let linkMismatch = false;
  for (const link of links) {
    if (SHORTENER.test(link)) {
      score += 15;
      if (!reasons.includes("shortener_link")) reasons.push("shortener_link");
    }
    if (IP_URL.test(link)) {
      score += 30;
      if (!reasons.includes("ip_link")) reasons.push("ip_link");
    }
    const host = hostOf(link);
    for (const brand of brands) {
      if (host && !brand.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
        linkMismatch = true;
      }
    }
  }
  if (linkMismatch) {
    score += 25;
    reasons.push("link_mismatch");
  }

  const caps = subject.replace(/[^A-Z]/g, "").length;
  const letters = subject.replace(/[^A-Za-z]/g, "").length;
  if ((letters >= 8 && caps / letters >= 0.7) || (subject.match(/!/g) || []).length >= 3) {
    score += 10;
    reasons.push("excessive_punctuation");
  }

  score = Math.min(100, score);
  const unique = [...new Set(reasons)];
  let action: SpamAction = "allow";
  if (score >= 65) action = "block";
  else if (score >= 35) action = "flag";
  return { score, reasons: unique, action };
}
