import { beginCheckout } from "@/app/actions";
import {
  ANNUAL_CENTS,
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
  STANDARD_CENTS,
} from "@/lib/billing";
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

  const access = await getAccess();
  const ready = paymentsConfigured();
  const monthCents = access.introUsed ? STANDARD_CENTS : INTRO_CENTS;

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>Half off the first 30 days</h1>
          <p className="sub">
            The first 30 days are {dollars(INTRO_CENTS)}. PayPal then charges {dollars(STANDARD_CENTS)} every 30 days until you cancel.
            The year is {dollars(ANNUAL_CENTS)} once and does not renew.
          </p>
        </div>
      </header>

      {params.paid ? <p className="banner">Payment received. This workspace is covered through {planDate(access.endsAt)}.</p> : null}
      {params.canceled ? <p className="banner warn">Payment canceled. Access is unchanged.</p> : null}
      {payError ? <p className="banner warn">{payError}</p> : null}

      <article className="card">
        <span className="card-label">Current access</span>
        {access.status === "active" ? (
          <>
            <h2 style={{ marginTop: 10 }}>Paid through {planDate(access.endsAt)}</h2>
            <p className="note">
              {dayPhrase(access.daysLeft)} remaining.
              {access.introUsed
                ? ` The next 30 days are ${dollars(STANDARD_CENTS)}, or a year is ${dollars(ANNUAL_CENTS)}.`
                : ` The first 30-day price of ${dollars(INTRO_CENTS)} is still available, or a year is ${dollars(ANNUAL_CENTS)}.`}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 10 }}>Protection starts when you pay</h2>
            <p className="note">
              {access.introUsed
                ? `The introductory price has been used. Continue at ${dollars(STANDARD_CENTS)} for ${PERIOD_DAYS} days, or ${dollars(ANNUAL_CENTS)} for the year.`
                : `The first ${PERIOD_DAYS} days are ${dollars(INTRO_CENTS)}. PayPal then charges ${dollars(STANDARD_CENTS)} every 30 days until you cancel.`}
            </p>
          </>
        )}
      </article>

      <article className="card">
        <span className="card-label">Payment gateway</span>
        <h2 style={{ marginTop: 10 }}>PayPal</h2>
        <p className="note">
          The monthly plan is charged automatically by PayPal in US dollars. Cancel it from your PayPal account to stop the next charge.
          {ready
            ? paypalLive()
              ? " Live payments are on."
              : " Sandbox payments are on. Set PAYPAL_ENV=live for real charges."
            : " Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local, then restart the app. Set PAYPAL_ENV=live when you are ready to charge real cards."}
        </p>
      </article>

      <section className="plans">
        <article className="card">
          <span className="card-label">{access.introUsed ? "30 days" : "First 30 days"}</span>
          <p className="price">
            {dollars(monthCents)}
            {access.introUsed ? null : <s className="was">{dollars(STANDARD_CENTS)}</s>}
          </p>
          <p className="note">
            {access.introUsed
              ? `${dollars(STANDARD_CENTS)} is charged every 30 days until you cancel.`
              : `${dollars(INTRO_CENTS)} today, then ${dollars(STANDARD_CENTS)} every 30 days until you cancel.`}
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
          <p className="price">{dollars(ANNUAL_CENTS)}</p>
          <p className="note">One payment for 365 days. This plan does not renew.</p>
          <form action={beginCheckout}>
            <input type="hidden" name="plan" value="year" />
            <button className="btn" type="submit">
              Pay {dollars(ANNUAL_CENTS)} with PayPal
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
