import { ContinueToSettings } from "@/components/ContinueToSettings";
import { getUser } from "@/lib/auth";
import { purchaseTransactionId } from "@/lib/google-conversion";
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
  const user = await getUser();

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href={user ? "/dashboard" : "/"}>
          <span className="brand-name">AnodeH</span>
        </a>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 560 }}>
        <p className="kicker">Payment received</p>
        <h1>Thank you{user?.name ? `, ${user.name}` : ""}.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>
          {purchase
            ? "PayPal confirmed this payment. Settings open next, where the domain and the Google Ads account are saved."
            : "When PayPal finishes a payment, this page records the purchase for Google Ads."}
        </p>
        {user ? (
          <>
            <p>
              <a className="btn" href="/settings">Continue to settings</a>
            </p>
            <ContinueToSettings />
          </>
        ) : (
          <p>
            <a className="btn" href="/login?next=/settings">Log in to open settings</a>
          </p>
        )}
      </section>
    </div>
  );
}
