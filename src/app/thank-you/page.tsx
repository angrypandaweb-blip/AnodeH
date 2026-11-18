import { ContinueToSettings } from "@/components/ContinueToSettings";
import { PurchaseConversion } from "@/components/PurchaseConversion";
import { getUser } from "@/lib/auth";
import { purchaseConversionAmount, purchaseTransactionId } from "@/lib/google-conversion";
import { noIndex } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = noIndex;

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const params = await searchParams;
  const purchase = purchaseTransactionId(params.purchase);
  const [user, amount] = await Promise.all([
    getUser(),
    purchase ? purchaseConversionAmount(purchase) : Promise.resolve({ value: 0, currency: "USD" as const }),
  ]);

  return (
    <div>
      {purchase ? (
        <PurchaseConversion transactionId={purchase} value={amount.value} currency={amount.currency} />
      ) : null}
      <header className="page-head">
        <div>
          <p className="eyebrow">Payment received</p>
          <h1>Thank you{user?.name ? `, ${user.name}` : ""}.</h1>
          <p className="sub">PayPal confirmed this payment. Settings open next, where the domain and the Google Ads account are saved.</p>
        </div>
      </header>
      <p>
        <a className="btn" href="/settings">Continue to settings</a>
      </p>
      <ContinueToSettings />
    </div>
  );
}
