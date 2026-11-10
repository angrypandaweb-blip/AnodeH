export function normalizeAdsAccount(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!/^\d{10}$/.test(digits)) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function compact(value: number): string {
  return value.toLocaleString("en-US");
}

export function percent(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export function when(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayLabel(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short" });
}

export function scoreBand(score: number): "ok" | "watch" | "stop" {
  if (score >= 65) return "stop";
  if (score >= 40) return "watch";
  return "ok";
}
