import { JUNK_PLACEMENTS } from "./campaigns";
import type {
  Action,
  Enforcement,
  IncomingClick,
  Network,
  Policy,
  Sensitivity,
  Verdict,
} from "./types";

export const THRESHOLDS: Record<Sensitivity, { block: number; flag: number }> = {
  conservative: { block: 80, flag: 55 },
  balanced: { block: 65, flag: 40 },
  aggressive: { block: 45, flag: 30 },
};

export const REASON_LABELS: Record<string, string> = {
  allowlisted: "On the allow list",
  datacenter: "Datacenter network",
  vpn: "VPN exit",
  proxy: "Proxy network",
  repeat_ip: "Repeated clicks from one IP",
  device_reuse: "One device across many IPs",
  instant_bounce: "Instant bounce",
  geo_mismatch: "Outside targeted countries",
  bad_placement: "Low-quality placement",
  genuine_session: "Engaged session",
  manual: "Blocked by a person",
};

export function reasonText(reasons: string[]): string {
  if (reasons.length === 0) return "No risk signals";
  return reasons.map((reason) => REASON_LABELS[reason] ?? reason).join(" · ");
}

export function guessNetwork(ip: string): Network {
  if (/^(34|35|52|3|54)\./.test(ip)) return "datacenter";
  if (/^(185\.220|146\.70)\./.test(ip)) return "vpn";
  if (/^45\.133\./.test(ip)) return "proxy";
  return "residential";
}

export function guessIsp(network: Network, ip: string): string {
  if (network === "datacenter") {
    if (ip.startsWith("34.") || ip.startsWith("3.") || ip.startsWith("54.")) return "Amazon Technologies";
    if (ip.startsWith("35.")) return "Google Cloud";
    return "DigitalOcean";
  }
  if (network === "vpn") return ip.startsWith("185.220.") ? "Mullvad" : "NordVPN";
  if (network === "proxy") return "Bright Data";
  return "Comcast";
}

type History = {
  ipClicks24h: number;
  deviceIpCount: number;
};

export function evaluate(
  input: IncomingClick,
  history: History,
  policy: Policy,
  allowed: boolean,
  countries: string[],
): Verdict {
  if (allowed) {
    return { score: 0, reasons: ["allowlisted"], action: "allow", enforcement: "none" };
  }

  let score = 0;
  const reasons: string[] = [];

  if (input.network === "datacenter") {
    score += 45;
    reasons.push("datacenter");
  } else if (input.network === "vpn") {
    score += 35;
    reasons.push("vpn");
  } else if (input.network === "proxy") {
    score += 40;
    reasons.push("proxy");
  }

  if (history.ipClicks24h >= 6) {
    score += 45;
    reasons.push("repeat_ip");
  } else if (history.ipClicks24h >= 3) {
    score += 28;
    reasons.push("repeat_ip");
  } else if (history.ipClicks24h >= 2 && input.timeOnPage < 3) {
    score += 18;
    reasons.push("repeat_ip");
  }

  if (history.deviceIpCount >= 4) {
    score += 40;
    reasons.push("device_reuse");
  }

  if (input.timeOnPage < 2 && !input.engaged) {
    score += 22;
    reasons.push("instant_bounce");
  }

  if (!countries.includes(input.country)) {
    score += 25;
    reasons.push("geo_mismatch");
  }

  if (input.placement && JUNK_PLACEMENTS.has(input.placement)) {
    score += 30;
    reasons.push("bad_placement");
  }

  if (
    input.converted &&
    input.engaged &&
    input.timeOnPage >= 15 &&
    input.network === "residential"
  ) {
    score = Math.min(score, 20);
    reasons.unshift("genuine_session");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const threshold = THRESHOLDS[policy.sensitivity];
  let action: Action = "allow";
  if (score >= threshold.block) action = "block";
  else if (score >= threshold.flag) action = "flag";
  if (action === "block" && !policy.autoBlock) action = "flag";

  return { score, reasons, action, enforcement: "none" };
}

export function enforcementFor(action: Action, campaignType: IncomingClick["network"] | string): Enforcement {
  if (action !== "block") return "none";
  if (campaignType === "pmax") return "conversion_hold";
  return "ip_exclusion";
}
