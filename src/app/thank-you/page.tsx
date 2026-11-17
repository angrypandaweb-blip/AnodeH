import { ContinueToSettings } from "@/components/ContinueToSettings";
import { PurchaseConversion } from "@/components/PurchaseConversion";
import { getUser } from "@/lib/auth";
import { purchaseTransactionId } from "@/lib/google-conversion";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const params = await searchParams;
  const purchase = purchaseTransactionId(params.purchase);
  const user = await getUser();

  return (
    <div>
      {purchase ? <PurchaseConversion transactionId={purchase} /> : null}
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
