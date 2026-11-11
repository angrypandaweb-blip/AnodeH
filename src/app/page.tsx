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
          <a href="#preview">Dashboard</a>
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

      <section id="preview" className="preview">
        <h2>The dashboard you get</h2>
        <p className="lede">A sample week, in the same layout subscribers open. Spend, invalid cost, and the clicks worth blocking are on one screen.</p>
        <div className="preview-frame">
          <div className="preview-top">
            <div>
              <strong>Google Ads 123-456-7890</strong>
              <span>Sample week · not your live account</span>
            </div>
            <span className="offer-tag">What you see after you subscribe</span>
          </div>
          <section className="metrics">
            <article className="metric">
              <span>Clicks</span>
              <strong>1,284</strong>
              <em>Last 7 days</em>
            </article>
            <article className="metric">
              <span>Invalid rate</span>
              <strong>18%</strong>
              <em>231 flagged or blocked · 22 today</em>
            </article>
            <article className="metric">
              <span>Invalid cost</span>
              <strong>$642</strong>
              <em>of $4,180 monitored</em>
            </article>
            <article className="metric">
              <span>Exclusions</span>
              <strong>86</strong>
              <em>Fullest campaign 214/500</em>
            </article>
          </section>
          <section className="split">
            <article className="card">
              <span className="card-label">Clicks by day</span>
              <div className="chart" aria-hidden>
                {[
                  ["Mon", 42, 8],
                  ["Tue", 51, 6],
                  ["Wed", 38, 19],
                  ["Thu", 46, 11],
                  ["Fri", 55, 7],
                  ["Sat", 29, 14],
                  ["Sun", 33, 9],
                ].map(([day, allow, bad]) => (
                  <div className="bar-col" key={String(day)}>
                    <span className="bar-count">{bad}</span>
                    <div className="stack" style={{ height: Math.round(((Number(allow) + Number(bad)) / 74) * 150) }}>
                      <div className="ok" style={{ flex: Number(allow) }} />
                      <div className="bad" style={{ flex: Number(bad) }} />
                    </div>
                    <span>{day}</span>
                  </div>
                ))}
              </div>
              <div className="legend">
                <span><i className="swatch ok" /> Allowed</span>
                <span><i className="swatch bad" /> Flagged or blocked</span>
              </div>
            </article>
            <article className="card">
              <span className="card-label">Exclusion room</span>
              <div className="capacity">
                <div className="track">
                  <span style={{ width: "43%" }} />
                </div>
                <p className="note">Google Ads keeps about 500 IP exclusions per campaign. AnodeH uses that room on addresses likely to return.</p>
              </div>
              <div className="cap-row"><span>Brand — Exact</span><span className="mono">214/500</span></div>
              <div className="cap-row"><span>Nonbrand — Hiking</span><span className="mono">96/500</span></div>
              <div className="cap-row"><span>Display — Prospecting</span><span className="mono">41/500</span></div>
            </article>
          </section>
          <article className="card preview-table">
            <span className="card-label">Latest risky clicks</span>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Campaign</th>
                  <th>Source</th>
                  <th>Score</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Today, 2:14 PM</td>
                  <td>Nonbrand — Hiking<div className="muted">hiking backpack sale</div></td>
                  <td><div className="mono">34.201.88.24</div><div className="muted">Amazon · US</div></td>
                  <td><span className="pill stop">82</span></td>
                  <td>Datacenter, instant bounce</td>
                </tr>
                <tr>
                  <td>Today, 11:02 AM</td>
                  <td>Brand — Exact<div className="muted">northwind tents</div></td>
                  <td><div className="mono">73.184.22.10</div><div className="muted">Comcast · US</div></td>
                  <td><span className="pill watch">71</span></td>
                  <td>Repeat address, short visit</td>
                </tr>
                <tr>
                  <td>Yesterday, 6:40 PM</td>
                  <td>Performance Max<div className="muted">Conversion held when blocked</div></td>
                  <td><div className="mono">185.220.101.33</div><div className="muted">Mullvad · DE</div></td>
                  <td><span className="pill stop">88</span></td>
                  <td>VPN, off-target country</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
        <div className="hero-actions">
          <a className="btn" href={startHref}>{startLabel}</a>
        </div>
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
