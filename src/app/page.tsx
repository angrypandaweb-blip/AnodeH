import { loginAccount, registerAccount } from "@/app/actions";
import { Mark } from "@/components/Mark";
import { getUser } from "@/lib/auth";
import { ANNUAL_CENTS, dollars, getAccess, INTRO_CENTS, STANDARD_CENTS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const THREATS = [
  { title: "Datacenter clicks", body: "Hosting ranges that click ads and never shop." },
  { title: "VPN and proxy exits", body: "Addresses that hide where the visitor really is." },
  { title: "Repeat addresses", body: "The same IP coming back to spend the budget again." },
  { title: "Reused devices", body: "One device hopping across many addresses." },
  { title: "Instant bounces", body: "Clicks that leave before a person could have looked." },
  { title: "Off-target countries", body: "Visits from outside the countries you chose to buy." },
];

const BENEFITS = [
  { title: "Scored as they arrive", body: "Each click gets a score and a plain reason, so you can see why it was allowed, flagged, or blocked." },
  { title: "Exclusions on Search and Display", body: "Addresses likely to return are written onto the campaign list. AnodeH spends the 500-IP limit carefully and lets old entries expire." },
  { title: "Performance Max, handled honestly", body: "That campaign type has no IP list. When a click should be blocked, the conversion is held instead." },
  { title: "A week you can actually read", body: "The dashboard shows spend, invalid cost, and the latest risky clicks without making you hunt through the ad account." },
];

export default async function LandingPage() {
  const [access, user] = await Promise.all([getAccess(), getUser()]);
  const subscribed = access.status === "active";
  const startHref = user ? (subscribed ? "/dashboard" : "/billing") : "#account";
  const startLabel = user ? (subscribed ? "Open dashboard" : "Continue to payment") : "Create an account";
  const monthHref = user ? (subscribed ? "/dashboard" : "/billing") : "/register?plan=month";
  const yearHref = user ? (subscribed ? "/dashboard" : "/billing") : "/register?plan=year";
  const monthLabel = user ? (subscribed ? "Open dashboard" : "Subscribe with PayPal") : "Create account";
  const yearLabel = user ? (subscribed ? "Open dashboard" : "Pay for the year") : "Create account";

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="#threats">Threats</a>
          <a href="#pricing">Pricing</a>
          <a href="#account">{user ? "Account" : "Log in"}</a>
          <a className="btn" href={startHref}>{startLabel}</a>
        </nav>
      </header>

      <section className="hero">
        <p className="kicker">Google Ads click protection</p>
        <h1>Block the clicks that were never going to buy.</h1>
        <p className="lede">
          AnodeH scores invalid traffic on your Google Ads campaigns and writes the exclusions for you. The budget stays with people who might become customers.
        </p>
        <div className="hero-actions">
          <a className="btn" href={startHref}>{startLabel}</a>
          <a className="btn ghost" href="#pricing">See pricing</a>
        </div>
        <ul className="reassure">
          <li>Half off the first 30 days</li>
          <li>Then {dollars(STANDARD_CENTS)} every 30 days</li>
          <li>Cancel anytime in PayPal</li>
        </ul>
      </section>

      <section id="threats" className="band">
        <h2>Block only the bad traffic</h2>
        <p className="lede">AnodeH looks for the patterns that burn a Google Ads budget and leaves ordinary shoppers alone.</p>
        <div className="threat-grid">
          {THREATS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits">
        <h2>What you get after you subscribe</h2>
        <div className="benefit-grid">
          {BENEFITS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="band">
        <h2>Simple pricing</h2>
        <p className="lede">Start on the half-price month. Move to the year if you want one payment and no renewal.</p>
        <div className="plans">
          <article className="offer featured">
            <span className="offer-tag">Most people start here</span>
            <h3>Monthly</h3>
            <p className="offer-price">{dollars(INTRO_CENTS)} <s>{dollars(STANDARD_CENTS)}</s></p>
            <p>First 30 days at half price, then {dollars(STANDARD_CENTS)} every 30 days. PayPal charges this automatically until you cancel.</p>
            <a className="btn" href={monthHref}>{monthLabel}</a>
          </article>
          <article className="offer">
            <h3>Annual</h3>
            <p className="offer-price">{dollars(ANNUAL_CENTS)}</p>
            <p>One payment for 365 days. This plan does not renew on its own.</p>
            <a className="btn ghost" href={yearHref}>{yearLabel}</a>
          </article>
        </div>
      </section>

      <section id="account" className="benefits">
        <h2>{user ? `Signed in as ${user.name}` : "Log in or create an account"}</h2>
        <p className="lede">
          {user
            ? "Your account opens the dashboard, where the scored clicks and exclusions live."
            : "Choosing a plan starts here. Create an account and the dashboard opens next."}
        </p>
        {user ? (
          <div className="hero-actions">
            <a className="btn" href={startHref}>{startLabel}</a>
          </div>
        ) : (
          <div className="plans">
            <article className="offer featured">
              <h3>Create an account</h3>
              <p>Use the name and email you want on the workspace. The dashboard opens as soon as the account exists.</p>
              <form action={registerAccount} className="form-grid">
                <input type="hidden" name="return" value="/register" />
                <label>
                  Name
                  <input type="text" name="name" autoComplete="name" required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" autoComplete="email" required />
                </label>
                <label>
                  Password
                  <input type="password" name="password" autoComplete="new-password" minLength={8} required />
                </label>
                <label>
                  Google Ads account number
                  <input type="text" name="adsAccount" inputMode="numeric" autoComplete="off" placeholder="123-456-7890" required />
                </label>
                <p className="note">The 10-digit customer ID of the Google Ads account you want to keep track of.</p>
                <button className="btn" type="submit">Create account</button>
              </form>
            </article>
            <article className="offer">
              <h3>Log in</h3>
              <p>Already registered? Use the same email to get back to the dashboard.</p>
              <form action={loginAccount} className="form-grid">
                <input type="hidden" name="return" value="/login" />
                <input type="hidden" name="next" value="/dashboard" />
                <label>
                  Email
                  <input type="email" name="email" autoComplete="email" required />
                </label>
                <label>
                  Password
                  <input type="password" name="password" autoComplete="current-password" required />
                </label>
                <p className="form-extra"><a href="/forgot-password">Forgot password</a></p>
                <button className="btn ghost" type="submit">Log in</button>
              </form>
            </article>
          </div>
        )}
      </section>

      <section id="faq" className="faq">
        <h2>Questions</h2>
        <details>
          <summary>What does AnodeH actually block?</summary>
          <p>Datacenter clicks, VPN and proxy exits, repeated addresses, reused devices, instant bounces, and visits from outside the countries you are targeting.</p>
        </details>
        <details>
          <summary>How does Performance Max work?</summary>
          <p>Performance Max has no IP exclusion list. When a click should be blocked, AnodeH holds the conversion instead of writing an exclusion that the campaign cannot use.</p>
        </details>
        <details>
          <summary>When am I charged?</summary>
          <p>The monthly plan bills {dollars(INTRO_CENTS)} today, then {dollars(STANDARD_CENTS)} every 30 days through PayPal until you cancel. The annual plan is {dollars(ANNUAL_CENTS)} once.</p>
        </details>
      </section>

      <section className="close">
        <h2>Put the budget back on real clicks.</h2>
        <a className="btn" href={startHref}>{startLabel}</a>
      </section>
    </div>
  );
}
