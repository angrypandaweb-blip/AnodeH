import { getDb, queryOne } from "./db";

export const PURCHASE_SEND_TO = "AW-18572224940/eQn1CPunubcdEKzT9pdF";

export function purchaseTransactionId(value: string | undefined): string {
  const id = (value || "").trim();
  if (!id || id.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(id)) return "";
  return id;
}

/** PayPal charges USD; send that amount so Google Ads “different values” works. */
export async function purchaseConversionAmount(transactionId: string): Promise<{ value: number; currency: "USD" }> {
  if (!transactionId) return { value: 0, currency: "USD" };
  const row = await queryOne<{ amount: number }>(await getDb(), "SELECT amount FROM payments WHERE id = ?", [transactionId]);
  const cents = Number(row?.amount);
  if (!Number.isFinite(cents) || cents < 0) return { value: 0, currency: "USD" };
  return { value: Math.round(cents) / 100, currency: "USD" };
}
