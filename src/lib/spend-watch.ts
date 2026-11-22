import { REASON_LABELS } from "@/lib/score";

export type ChartPoint = { label: string; value: number };

export type CategorySlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type SpendWatchModel = {
  blockedTotal: number;
  blockedLabel: string;
  blockedDelta: string;
  blockedSeries: ChartPoint[];
  savedTotalLabel: string;
  savedDelta: string;
  savedBars: ChartPoint[];
  categories: CategorySlice[];
  savedOverTime: ChartPoint[];
  savedOverTimeLabel: string;
  savedOverTimeDelta: string;
};

const SLICE_COLORS = ["#ff6a00", "#0b3d91", "#d97706", "#0f766e", "#64748b", "#b45309"];

const SAMPLE_BLOCKED = [18, 22, 31, 27, 19, 24, 28];
const SAMPLE_SAVED = [6, 8, 14, 11, 7, 9, 12];

/** Fixed sample used on the landing preview — same layout as the live dashboard. */
export function sampleSpendWatch(savedMoneyLabel: string): SpendWatchModel {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const blockedSeries = days.map((label, i) => ({ label, value: SAMPLE_BLOCKED[i]! }));
  const savedBars = days.map((label, i) => ({ label, value: SAMPLE_SAVED[i]! }));
  const categories: CategorySlice[] = [
    { id: "datacenter", label: "Datacenter", value: 86, color: SLICE_COLORS[0]! },
    { id: "vpn", label: "VPN / proxy", value: 54, color: SLICE_COLORS[1]! },
    { id: "repeat_ip", label: "Repeat IP", value: 41, color: SLICE_COLORS[2]! },
    { id: "instant_bounce", label: "Instant bounce", value: 32, color: SLICE_COLORS[3]! },
    { id: "geo_mismatch", label: "Off-target country", value: 18, color: SLICE_COLORS[4]! },
  ];
  return {
    blockedTotal: 231,
    blockedLabel: "231",
    blockedDelta: "+18.6% vs prior 7 days",
    blockedSeries,
    savedTotalLabel: savedMoneyLabel,
    savedDelta: "+21.3% vs prior 7 days",
    savedBars,
    categories,
    savedOverTime: savedBars,
    savedOverTimeLabel: savedMoneyLabel,
    savedOverTimeDelta: "+21.3% vs prior 7 days",
  };
}

export function liveSpendWatch(input: {
  series: Array<{ ts: number; allow: number; organic: number; flagged: number; repeat: number }>;
  dayLabels: string[];
  invalidTotal: number;
  wasteLabel: string;
  wasteByDay: number[];
  breakdown: Array<{ reason: string; count: number }>;
}): SpendWatchModel {
  const blockedSeries = input.series.map((day, i) => ({
    label: input.dayLabels[i] || String(i + 1),
    value: day.organic + day.flagged + day.repeat,
  }));
  const savedBars = input.series.map((day, i) => ({
    label: input.dayLabels[i] || String(i + 1),
    value: Math.max(0, Number(input.wasteByDay[i] || 0)),
  }));
  const categories = slicesFromBreakdown(input.breakdown);
  const delta = trendDelta(blockedSeries.map((point) => point.value));
  const savedDelta = trendDelta(savedBars.map((point) => point.value));
  return {
    blockedTotal: input.invalidTotal,
    blockedLabel: input.invalidTotal.toLocaleString("en-US"),
    blockedDelta: delta,
    blockedSeries,
    savedTotalLabel: input.wasteLabel,
    savedDelta,
    savedBars,
    categories,
    savedOverTime: savedBars,
    savedOverTimeLabel: input.wasteLabel,
    savedOverTimeDelta: savedDelta,
  };
}

export function slicesFromBreakdown(rows: Array<{ reason: string; count: number }>): CategorySlice[] {
  const sorted = [...rows].filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) {
    return [{ id: "none", label: "No invalid clicks yet", value: 1, color: "#cbd5e1" }];
  }
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4).reduce((sum, row) => sum + row.count, 0);
  const slices = top.map((row, i) => ({
    id: row.reason,
    label: REASON_LABELS[row.reason] || row.reason,
    value: row.count,
    color: SLICE_COLORS[i % SLICE_COLORS.length]!,
  }));
  if (rest > 0) {
    slices.push({ id: "other", label: "Other", value: rest, color: SLICE_COLORS[4]! });
  }
  return slices;
}

function trendDelta(values: number[]) {
  if (values.length < 4) return "Last 7 days";
  const mid = Math.floor(values.length / 2);
  const prior = values.slice(0, mid).reduce((sum, n) => sum + n, 0);
  const recent = values.slice(mid).reduce((sum, n) => sum + n, 0);
  if (prior <= 0) return recent > 0 ? "Up vs earlier this week" : "Last 7 days";
  const pct = Math.round(((recent - prior) / prior) * 1000) / 10;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs earlier this week`;
}
