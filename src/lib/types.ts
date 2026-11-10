export type Sensitivity = "conservative" | "balanced" | "aggressive";
export type Action = "allow" | "flag" | "block";
export type Network = "residential" | "datacenter" | "vpn" | "proxy";
export type CampaignType = "search" | "display" | "pmax";
export type Enforcement = "none" | "ip_exclusion" | "conversion_hold";

export type Policy = {
  sensitivity: Sensitivity;
  blockDays: number;
  autoBlock: boolean;
  domain: string;
  domainKey: string;
};

export type IncomingClick = {
  clickId?: string;
  campaign: string;
  keyword?: string;
  placement?: string;
  ip: string;
  deviceHash: string;
  country: string;
  city?: string;
  isp: string;
  network: Network;
  userAgent?: string;
  timeOnPage: number;
  engaged: boolean;
  converted: boolean;
  cost?: number;
  landing?: string;
  ts?: number;
};

export type Verdict = {
  score: number;
  reasons: string[];
  action: Action;
  enforcement: Enforcement;
};
