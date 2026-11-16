import { beginCheckout } from "@/app/actions";
import {
  capturePayPalOrder,
  confirmPayPalSubscription,
  dayPhrase,
  dollars,
  getAccess,
  INTRO_CENTS,
  paymentsConfigured,
  paypalLive,
  PERIOD_DAYS,
  planDate,
  quotesFor,
  STANDARD_CENTS,
  ANNUAL_CENTS,
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
    if (result.ok) redirect("/dashboard");
    payError = result.error || "PayPal has not confirmed this subscription.";
  } else if (params.token) {
    const result = await capturePayPalOrder(params.token);
    if (result.ok) redirect("/dashboard");
    payError = result.error || "PayPal has not confirmed this payment.";
  }

  const user = await getUser();
  const access = await getAccess();
  const quote = await quotesFor(user?.email || "", user?.country || "");
  const ready = paymentsConfigured();
  const monthPrice = access.introUsed ? quote.standard : quote.intro;
  const paypalNote = quote.currency === "USD"
    ? "The monthly plan is charged automatically by PayPal in US dollars."
    : `Prices are in ${quote.name}, for the country on this account. PayPal collects the US dollar price: ${dollars(INTRO_CENTS)} for the first 30 days, then ${dollars(STANDARD_CENTS)} every 30 days. The year is ${dollars(ANNUAL_CENTS)}.`;

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>{access.lifetime ? "Lifetime access" : "Half off the first 30 days"}</h1>
          <p className="sub">
            {access.lifetime
              ? "This account does not expire. PayPal is not needed."
              : `The first 30 days are ${quote.intro}. Then ${quote.standard} every 30 days until you cancel. The year is ${quote.annual} once and does not renew.`}
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
              {access.introUsed
                ? ` The next 30 days are ${quote.standard}, or a year is ${quote.annual}.`
                : ` The first 30-day price of ${quote.intro} is still available, or a year is ${quote.annual}.`}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 10 }}>Protection starts when you pay</h2>
            <p className="note">
              {access.introUsed
                ? `The introductory price has been used. Continue at ${quote.standard} for ${PERIOD_DAYS} days, or ${quote.annual} for the year.`
                : `The first ${PERIOD_DAYS} days are ${quote.intro}. Then ${quote.standard} every 30 days until you cancel.`}
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
          <span className="card-label">{access.introUsed ? "30 days" : "First 30 days"}</span>
          <p className="price">
            {monthPrice}
            {access.introUsed ? null : <s className="was">{quote.standard}</s>}
          </p>
          <p className="note">
            {access.introUsed
              ? `${quote.standard} is charged every 30 days until you cancel.`
              : `${quote.intro} today, then ${quote.standard} every 30 days until you cancel.`}
          </p>
          <form action={beginCheckout}>
            <input type="hidden" name="plan" value="month" />
            <button className="btn" type="submit">
              Subscribe with PayPal
            </button>
          </form>
        </article>

        <article className="card">
          <span className="card-label">Annual</span>
          <p className="price">{quote.annual}</p>
          <p className="note">One payment for 365 days. This plan does not renew.</p>
          <form action={beginCheckout}>
            <input type="hidden" name="plan" value="year" />
            <button className="btn" type="submit">
              Pay {quote.annual} with PayPal
            </button>
          </form>
        </article>
      </section>
      )}
    </div>
  );
}
