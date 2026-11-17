import { PayPalCheckout } from "@/components/PayPalCheckout";
import {
  capturePayPalOrder,
  confirmPayPalSubscription,
  dayPhrase,
  getAccess,
  paymentsConfigured,
  paypalLive,
  planDate,
  quotesFor,
} from "@/lib/billing";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { noIndex } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = noIndex;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; subscription_id?: string; canceled?: string; error?: string; paid?: string }>;
}) {
  const params = await searchParams;
  let payError = params.error || "";

  if (params.subscription_id) {
    const result = await confirmPayPalSubscription(params.subscription_id);
    if (result.ok) redirect(`/thank-you?purchase=${encodeURIComponent(result.transactionId)}`);
    payError = result.error || "PayPal has not confirmed this subscription.";
  } else if (params.token) {
    const result = await capturePayPalOrder(params.token);
    if (result.ok) redirect(`/thank-you?purchase=${encodeURIComponent(result.transactionId)}`);
    payError = result.error || "PayPal has not confirmed this payment.";
  }

  const user = await getUser();
  const access = await getAccess();
  const quote = await quotesFor(user?.email || "", user?.country || "");
  const ready = paymentsConfigured();
  const paypalNote = quote.currency === "USD"
    ? `The first 30 days are half price: ${quote.half} for one website, ${quote.half10} for ten, and ${quote.half20} for twenty. Then PayPal deducts ${quote.standard}, ${quote.sites10}, or ${quote.sites20} every 30 days.`
    : `Prices are in ${quote.name}, for the country on this account. PayPal collects US dollars. The first 30 days are half price, then the regular price every 30 days.`;

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>{access.lifetime ? "Lifetime access" : "Half price first month"}</h1>
          <p className="sub">
            {access.lifetime
              ? "This account does not expire. PayPal is not needed."
              : access.introUsed
                ? `${quote.standard} every 30 days for one website, ${quote.sites10} for ten, or ${quote.sites20} for twenty, until you cancel.`
                : `${quote.half} for one website, ${quote.half10} for ten, or ${quote.half20} for twenty. Then the regular price every 30 days until you cancel.`}
          </p>
        </div>
      </header>

      {params.paid ? <p className="banner">Payment received. This workspace is covered through {planDate(access.endsAt)}.</p> : null}
      {params.canceled ? <p className="banner warn">Payment canceled. Access is unchanged.</p> : null}
      {payError ? <p className="banner warn">{payError}</p> : null}

      <article className="card">
        <span className="card-label">Current access</span>
        {access.lifetime ? (
          <>
            <h2 style={{ marginTop: 10 }}>Lifetime</h2>
            <p className="note">This account stays active. There is no renewal date.</p>
          </>
        ) : access.status === "active" ? (
          <>
            <h2 style={{ marginTop: 10 }}>Paid through {planDate(access.endsAt)}</h2>
            <p className="note">
              {dayPhrase(access.daysLeft)} remaining.
              {access.sites > 1
                ? ` This account covers ${access.sites} websites.`
                : ` This account covers 1 website.`}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 10 }}>Protection starts when you pay</h2>
            <p className="note">
              {access.introUsed
                ? `The half-price month has been used. Continue at ${quote.standard} for one website, ${quote.sites10} for ten, or ${quote.sites20} for twenty, every 30 days.`
                : `The first 30 days are half price. Then PayPal deducts the regular price every 30 days until you cancel.`}
            </p>
          </>
        )}
      </article>

      <article className="card">
        <span className="card-label">Payment gateway</span>
        <h2 style={{ marginTop: 10 }}>PayPal</h2>
        <p className="note">
          {paypalNote} Cancel it from your PayPal account to stop the next charge.
          {ready
            ? paypalLive()
              ? " Live payments are on."
              : " Sandbox payments are on. Set PAYPAL_ENV=live for real charges."
            : " Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local, then restart the app. Set PAYPAL_ENV=live when you are ready to charge real cards."}
        </p>
      </article>

      {access.lifetime ? null : (
      <section className="plans">
        <article className="card">
          <span className="card-label">1 website</span>
          <p className="price">{access.introUsed ? quote.standard : quote.half}</p>
          <p className="note">
            {access.introUsed
              ? `${quote.standard} every 30 days until you cancel.`
              : `${quote.half} for the first 30 days, then ${quote.standard} every 30 days until you cancel.`}
          </p>
          <PayPalCheckout plan="month" label="Subscribe with PayPal" />
        </article>

        <article className="card">
          <span className="card-label">10 websites</span>
          <p className="price">{access.introUsed ? quote.sites10 : quote.half10}</p>
          <p className="note">
            Best for growing businesses managing multiple websites.{" "}
            {access.introUsed
              ? `${quote.sites10} every 30 days until you cancel.`
              : `${quote.half10} for the first 30 days, then ${quote.sites10} every 30 days until you cancel.`}
          </p>
          <PayPalCheckout plan="sites10" label="Subscribe with PayPal" />
        </article>

        <article className="card">
          <span className="card-label">20 websites</span>
          <p className="price">{access.introUsed ? quote.sites20 : quote.half20}</p>
          <p className="note">
            Best for growing businesses managing multiple websites.{" "}
            {access.introUsed
              ? `${quote.sites20} every 30 days until you cancel.`
              : `${quote.half20} for the first 30 days, then ${quote.sites20} every 30 days until you cancel.`}
          </p>
          <PayPalCheckout plan="sites20" label="Subscribe with PayPal" />
        </article>
      </section>
      )}
    </div>
  );
}
