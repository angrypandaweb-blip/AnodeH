export const PURCHASE_SEND_TO = "AW-18572224940/eQn1CPunubcdEKzT9pdF";

export function purchaseTransactionId(value: string | undefined): string {
  const id = (value || "").trim();
  if (!id || id.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(id)) return "";
  return id;
}
