import { Mark } from "@/components/Mark";
import { getUser } from "@/lib/auth";
import { getAccess, quotesFor, TRIAL_DAYS } from "@/lib/billing";
import { formatMoney, placeFor, reportCurrency } from "@/lib/residence-currency";
import { sampleCampaigns } from "@/lib/sample-campaigns";
import { homeJsonLd, pageMeta } from "@/lib/seo";
import { visitorPlace, visitPlaceLabel } from "@/lib/visitor-country";

export const dynamic = "force-dynamic";

export const metadata = pageMeta("/");

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

const SPAM_FEATURES = [
  { title: "Score suspicious mail", body: "Paste a message and AnodeH returns a score with a plain reason, the same way it scores a click." },
  { title: "Sync a mailbox", body: "Connect IMAP once. AnodeH checks recent mail about every 5 minutes, flags phishing patterns, and moves junk out of the inbox." },
  { title: "Alert the owner", body: "When a message is flagged or blocked, AnodeH emails the account owner so the inbox is not left alone." },
];

export default async function LandingPage() {
  const [access, user] = await Promise.all([getAccess(), getUser()]);
  const subscribed = access.status === "active";
  const startHref = user ? (subscribed ? "/dashboard" : "/billing") : "/register";
  const startLabel = subscribed ? "Open dashboard" : "Subscribe";
  const monthHref = user ? (subscribed ? "/dashboard" : "/billing") : "/register?plan=month";
  const sites10Href = user ? "/billing" : "/register?plan=sites10";
  const sites20Href = user ? "/billing" : "/register?plan=sites20";
  const monthLabel = subscribed ? "Open dashboard" : "Subscribe";
  const visit = await visitorPlace();
  // Logged-in SA accounts with empty country still resolve ZAR from email; do not let visitor IP override.
  const seen = user ? placeFor(user.country || "", user.email).country : visit.country;
  const visitLabel = visitPlaceLabel(visit);
  const [quote, sampleLocal] = await Promise.all([
    quotesFor(user?.email || "", seen),
    reportCurrency(user?.email || "", user ? seen : visit.country || seen),
  ]);
  const sample = (usd: number) => formatMoney(Math.round(usd * sampleLocal.rate), sampleLocal.currency, 0);
  const sampleLead = visitLabel
    ? `A sample week for a visit from ${visitLabel}. Amounts are in ${sampleLocal.name}. This is not a live account.`
    : "A sample week, in the same layout subscribers open. Spend, invalid cost, and the clicks worth blocking are on one screen.";
  const homeSource = visitLabel || "Sample visit";
  const awaySource = visit.name ? `Outside ${visit.name}` : "Off-target country";
  const campaigns = sampleCampaigns(visit.country);
  const rooms = [214, 96, 41];
  const standard = quote.standard;
  const half10 = quote.half10;
  const sites10 = quote.sites10;
  const half20 = quote.half20;
  const sites20 = quote.sites20;
  const currencyNote = quote.currency !== "USD" ? ` Prices are in ${quote.name}. PayPal collects US dollars.` : "";

  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }} />
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="#preview">Dashboard</a>
          <a href="#threats">Threats</a>
          <a href="#spam">Spam email</a>
          <a href="/blog">Blog</a>
          <a href="#pricing">Pricing</a>
          <a href={user ? startHref : "/login"}>{user ? "Account" : "Log in"}</a>
          <a className="btn" href={startHref}>{startLabel}</a>
        </nav>
      </header>

      <section className="hero">
        <p className="kicker">Google Ads click protection · spam email monitoring</p>
        <h1>Block the clicks that were never going to buy.</h1>
        <p className="lede">
          AnodeH scores invalid traffic on your Google Ads campaigns and writes the exclusions for you. It also watches the inbox for spam and phishing, so the same account protects ads and email.
        </p>
        <div className="hero-actions">
          <a className="btn" href="#preview">See a sample</a>
          <a className="btn ghost" href={startHref}>{startLabel}</a>
        </div>
      </section>

      <section id="preview" className="preview">
        <h2>The dashboard you get</h2>
        <p className="lede">{sampleLead}</p>
        <div className="preview-frame">
          <div className="preview-top">
            <div>
              <strong>Google Ads 123-456-7890</strong>
              <span>{visitLabel ? `Sample visit from ${visitLabel}` : "Sample week · not your live account"}</span>
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
              <span>Estimated invalid cost</span>
              <strong>{sample(64)}</strong>
              <em>of {sample(467)} estimated</em>
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
              {campaigns.map((campaign, index) => (
                <div className="cap-row" key={campaign.name}>
                  <span>{campaign.name}</span>
                  <span className="mono">{rooms[index]}/500</span>
                </div>
              ))}
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
                  <td>{campaigns[0].name}<div className="muted">{campaigns[0].keyword}</div></td>
                  <td><div className="mono">203.0.113.24</div><div className="muted">Datacenter · {homeSource}</div></td>
                  <td><span className="pill stop">82</span></td>
                  <td>Datacenter, instant bounce</td>
                </tr>
                <tr>
                  <td>Today, 11:02 AM</td>
                  <td>{campaigns[1].name}<div className="muted">{campaigns[1].keyword}</div></td>
                  <td><div className="mono">203.0.113.10</div><div className="muted">Home connection · {homeSource}</div></td>
                  <td><span className="pill watch">71</span></td>
                  <td>Repeat address, short visit</td>
                </tr>
                <tr>
                  <td>Yesterday, 6:40 PM</td>
                  <td>{campaigns[2].name}<div className="muted">{campaigns[2].keyword}</div></td>
                  <td><div className="mono">203.0.113.33</div><div className="muted">VPN · {awaySource}</div></td>
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

      <section id="spam" className="band">
        <h2>Spam email monitoring included</h2>
        <p className="lede">
          The same AnodeH account that protects Google Ads also scores spam and phishing in your mailbox, moves junk aside, and alerts the owner.
        </p>
        <div className="threat-grid">
          {SPAM_FEATURES.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="hero-actions" style={{ marginTop: 28 }}>
          <a className="btn" href={user ? "/spam" : "/register"}>
            {user ? "Open spam email" : "Start with spam email too"}
          </a>
        </div>
      </section>

      <section id="pricing" className="band">
        <h2>Simple pricing</h2>
        <p className="lede">One website starts with a 7-day free trial, then PayPal charges the regular price every 30 days until you cancel. Ten and twenty websites are half price for the first month. Growing businesses use those for multiple websites.{currencyNote}</p>
        <div className="plans">
          <article className="offer featured">
            <span className="offer-tag">7-day free trial</span>
            <h3>1 website</h3>
            <p className="offer-price">Free for {TRIAL_DAYS} days</p>
            <p>Then {standard} every 30 days.</p>
            <a className="btn" href={monthHref}>{monthLabel}</a>
          </article>
          <article className="offer">
            <span className="offer-tag">50% off the first month</span>
            <h3>10 websites</h3>
            <p className="offer-price">{half10}</p>
            <p>Then {sites10} every 30 days. The same tag goes on each website.</p>
            <a className="btn" href={sites10Href}>Create a 10-website account</a>
          </article>
          <article className="offer">
            <span className="offer-tag">50% off the first month</span>
            <h3>20 websites</h3>
            <p className="offer-price">{half20}</p>
            <p>Then {sites20} every 30 days. The same tag goes on each website.</p>
            <a className="btn" href={sites20Href}>Create a 20-website account</a>
          </article>
        </div>
      </section>

      <section id="faq" className="faq">
        <h2>Questions</h2>
        <details>
          <summary>What does AnodeH actually block?</summary>
          <p>Datacenter clicks, VPN and proxy exits, repeated addresses, reused devices, instant bounces, and visits from outside the countries you are targeting. For email, it scores phishing and spam patterns, can move flagged mail to Junk, and alerts the owner.</p>
        </details>
        <details>
          <summary>Does AnodeH monitor spam email?</summary>
          <p>Yes. After you subscribe, open Spam email in the account. Paste a message for an instant score, or connect IMAP so AnodeH syncs recent mail, moves flagged and blocked messages to Junk, and emails you an alert.</p>
        </details>
        <details>
          <summary>How does Performance Max work?</summary>
          <p>Performance Max has no IP exclusion list. When a click should be blocked, AnodeH holds the conversion instead of writing an exclusion that the campaign cannot use.</p>
        </details>
        <details>
          <summary>When am I charged?</summary>
          <p>One website is free for 7 days, then PayPal deducts {standard} every 30 days until you cancel. Ten and twenty websites are half price for the first 30 days ({half10} / {half20}), then {sites10} or {sites20} every 30 days.{currencyNote}</p>
        </details>
      </section>

      <section className="close">
        <h2>Put the budget back on real clicks.</h2>
        <a className="btn" href={startHref}>{startLabel}</a>
      </section>
      <footer className="site-legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
        <a href="/blog">Blog</a>
      </footer>
    </div>
  );
}
