export function clickPrice(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^[^\d]+/, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  return Math.round(amount * 100) / 100;
}

export function monitoredFromAverage(paid: number, invalidPaid: number, price: number) {
  return { spend: paid * price, waste: invalidPaid * price };
}
