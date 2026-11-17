import { PayPalCheckout } from "@/components/PayPalCheckout";
import {
  capturePayPalOrder,
  confirmPayPalSubscription,
  dayPhrase,
  dollars,
  getAccess,
  paymentsConfigured,
  paypalLive,
  PERIOD_DAYS,
  planDate,
  quotesFor,
  STANDARD_CENTS,
  ANNUAL_CENTS,
  SITES_10_CENTS,
  SITES_20_CENTS,
  TRIAL_DAYS,
} from "@/lib/billing";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
  const monthPrice = access.introUsed ? quote.standard : "Free";
  const paypalNote = quote.currency === "USD"
    ? `The monthly plan is free for ${TRIAL_DAYS} days, then PayPal deducts ${dollars(STANDARD_CENTS)} every 30 days automatically.`
    : `Prices are in ${quote.name}, for the country on this account. PayPal collects US dollars: nothing for ${TRIAL_DAYS} days, then ${dollars(STANDARD_CENTS)} every 30 days. The year is ${dollars(ANNUAL_CENTS)}. Ten websites are ${dollars(SITES_10_CENTS)} every 30 days, and twenty websites are ${dollars(SITES_20_CENTS)}.`;

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>{access.lifetime ? "Lifetime access" : access.introUsed ? "Monthly plan" : `${TRIAL_DAYS} days free`}</h1>
          <p className="sub">
            {access.lifetime
              ? "This account does not expire. PayPal is not needed."
              : access.introUsed
                ? `${quote.standard} every 30 days until you cancel. The year is ${quote.annual} once and does not renew.`
                : `Free for ${TRIAL_DAYS} days. Then PayPal deducts ${quote.standard} every 30 days until you cancel. The year is ${quote.annual} once and does not renew.`}
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
              {` The next charge is ${quote.standard} every 30 days, or a year is ${quote.annual}.`}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 10 }}>Protection starts when you pay</h2>
            <p className="note">
              {access.introUsed
                ? `The free trial has been used. Continue at ${quote.standard} every ${PERIOD_DAYS} days, or ${quote.annual} for the year.`
                : `The first ${TRIAL_DAYS} days are free. Then PayPal deducts ${quote.standard} every 30 days until you cancel.`}
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
          <span className="card-label">{access.introUsed ? "30 days" : `${TRIAL_DAYS} days free`}</span>
          <p className="price">
            {monthPrice}
          </p>
          <p className="note">
            One website.{" "}
            {access.introUsed
              ? `${quote.standard} is deducted from PayPal every 30 days until you cancel.`
              : `Free for ${TRIAL_DAYS} days, then PayPal deducts ${quote.standard} every 30 days until you cancel.`}
          </p>
          <PayPalCheckout plan="month" label={access.introUsed ? "Subscribe with PayPal" : "Start free trial"} />
        </article>

        <article className="card">
          <span className="card-label">Annual</span>
          <p className="price">{quote.annual}</p>
          <p className="note">One website. One payment for 365 days. This plan does not renew.</p>
          <PayPalCheckout plan="year" label={`Pay ${quote.annual} with PayPal`} />
        </article>

        <article className="card">
          <span className="card-label">10 websites</span>
          <p className="price">{quote.sites10}</p>
          <p className="note">Best for growing businesses managing multiple websites. {quote.sites10} every 30 days until you cancel.</p>
          <PayPalCheckout plan="sites10" label={`Subscribe for ${quote.sites10}`} />
        </article>

        <article className="card">
          <span className="card-label">20 websites</span>
          <p className="price">{quote.sites20}</p>
          <p className="note">Best for growing businesses managing multiple websites. {quote.sites20} every 30 days until you cancel.</p>
          <PayPalCheckout plan="sites20" label={`Subscribe for ${quote.sites20}`} />
        </article>
      </section>
      )}
    </div>
  );
}
