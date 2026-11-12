export type CampaignChannel = "search" | "display" | "pmax" | "other";

export type ParsedCampaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: string;
};

export type ParsedDaily = {
  day: string;
  campaign: string;
  clicks: number;
  costMicros: number;
};

export type ParsedClick = {
  gclid: string;
  day: string;
  campaignId: string;
  campaign: string;
  keyword: string;
  device: string;
  adGroup: string;
};

const CHANNELS: Record<string, CampaignChannel> = {
  SEARCH: "search",
  SHOPPING: "search",
  SMART: "search",
  DISPLAY: "display",
  VIDEO: "display",
  DEMAND_GEN: "display",
  DISCOVERY: "display",
  PERFORMANCE_MAX: "pmax",
  MULTI_CHANNEL: "pmax",
};

export function googleErrorMessage(payload: unknown, fallback: string) {
  const error = (payload as { error?: { message?: string; details?: { errors?: { message?: string }[] }[] } } | null)?.error;
  for (const detail of error?.details ?? []) {
    const message = detail?.errors?.find((item) => item?.message)?.message;
    if (message) return message;
  }
  return error?.message || fallback;
}

export function accessibleCustomerIds(resourceNames: unknown) {
  if (!Array.isArray(resourceNames)) return [];
  const ids = resourceNames
    .map((name) => String(name).split("/").pop() || "")
    .filter((id) => /^\d{10}$/.test(id));
  return [...new Set(ids)];
}

export function mapChannel(value: unknown): CampaignChannel {
  const key = String(value ?? "").toUpperCase();
  return CHANNELS[key] ?? "other";
}

export function campaignName(row: unknown, fallback: string) {
  const name = (row as { campaign?: { name?: string } } | null)?.campaign?.name?.trim();
  return name || fallback;
}

export function parseCampaign(row: unknown): ParsedCampaign | null {
  const campaign = (row as { campaign?: { id?: string | number; name?: string; status?: string; advertisingChannelType?: string } } | null)?.campaign;
  const id = String(campaign?.id ?? "");
  const name = campaign?.name?.trim() || "";
  if (!/^\d+$/.test(id) || !name) return null;
  return {
    id,
    name,
    channel: mapChannel(campaign?.advertisingChannelType),
    status: campaign?.status || "UNKNOWN",
  };
}

export function parseDaily(row: unknown): ParsedDaily | null {
  const record = row as {
    campaign?: { name?: string };
    segments?: { date?: string };
    metrics?: { clicks?: string | number; costMicros?: string | number };
  } | null;
  const day = record?.segments?.date || "";
  const campaign = record?.campaign?.name?.trim() || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !campaign) return null;
  const clicks = Number(record?.metrics?.clicks ?? 0);
  const costMicros = Number(record?.metrics?.costMicros ?? 0);
  return {
    day,
    campaign,
    clicks: Number.isFinite(clicks) ? Math.max(0, Math.round(clicks)) : 0,
    costMicros: Number.isFinite(costMicros) ? Math.max(0, Math.round(costMicros)) : 0,
  };
}

export function parseClick(row: unknown): ParsedClick | null {
  const record = row as {
    clickView?: { gclid?: string; keywordInfo?: { text?: string } };
    campaign?: { id?: string | number; name?: string };
    adGroup?: { name?: string };
    segments?: { date?: string; device?: string };
  } | null;
  const gclid = record?.clickView?.gclid?.trim() || "";
  const day = record?.segments?.date || "";
  if (!gclid || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return {
    gclid,
    day,
    campaignId: String(record?.campaign?.id ?? ""),
    campaign: record?.campaign?.name?.trim() || "Google Ads campaign",
    keyword: record?.clickView?.keywordInfo?.text?.trim() || "",
    device: record?.segments?.device || "",
    adGroup: record?.adGroup?.name?.trim() || "",
  };
}

export function isManagerAccount(row: unknown) {
  return Boolean((row as { customer?: { manager?: boolean } } | null)?.customer?.manager);
}

export function dayTimestamp(day: string) {
  return Math.floor(Date.parse(`${day}T12:00:00Z`) / 1000);
}
