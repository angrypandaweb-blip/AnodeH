import { Mark } from "@/components/Mark";
import { dollars, INTRO_CENTS, quotesFor, SITES_10_CENTS, SITES_10_INTRO_CENTS, SITES_20_CENTS, SITES_20_INTRO_CENTS, STANDARD_CENTS } from "@/lib/billing";
import { visitorCountry } from "@/lib/visitor-country";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "This visit was blocked · AnodeH",
  description: "This click was blocked as invalid traffic. AnodeH protects Google Ads budgets from clicks that were never going to buy.",
};

const CAUGHT = [
  { title: "Datacenter clicks", body: "Hosting ranges that click ads and never shop." },
  { title: "VPN and proxy exits", body: "Addresses that hide where the visitor really is." },
  { title: "Repeat addresses", body: "The same IP coming back to spend the budget again." },
  { title: "Instant bounces", body: "Clicks that leave before a person could have looked." },
  { title: "Reused devices", body: "One device hopping across many addresses." },
  { title: "Off-target countries", body: "Visits from outside the countries you chose to buy." },
];

export default async function BlockedPage() {
  const quote = await quotesFor("", await visitorCountry());
  const half = quote.half || dollars(INTRO_CENTS);
  const standard = quote.standard || dollars(STANDARD_CENTS);
  const half10 = quote.half10 || dollars(SITES_10_INTRO_CENTS);
  const sites10 = quote.sites10 || dollars(SITES_10_CENTS);
  const half20 = quote.half20 || dollars(SITES_20_INTRO_CENTS);
  const sites20 = quote.sites20 || dollars(SITES_20_CENTS);
  const local = quote.currency === "USD" ? "" : ` Prices are in ${quote.name}. PayPal collects US dollars.`;

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/#pricing">Pricing</a>
          <a href="/login">Log in</a>
          <a className="btn" href="/register?plan=month">Get started</a>
        </nav>
      </header>

      <section className="hero">
        <p className="kicker">This visit was blocked</p>
        <h1>This click was blocked.</h1>
        <p className="lede">
          The site you opened uses AnodeH to stop invalid Google Ads clicks. This visit scored as a block, so you were sent here instead of staying on that page.
        </p>
      </section>

      <section className="band">
        <h2>The same protection for your ads</h2>
        <p className="lede">
          AnodeH scores each click and writes the exclusions, so the budget stays with people who might become customers.
        </p>
        <div className="threat-grid">
          {CAUGHT.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits">
        <h2>What a subscriber gets</h2>
        <div className="benefit-grid">
          <article>
            <h3>A score and a reason</h3>
            <p>Each click is allowed, flagged, or blocked, with a plain reason you can read.</p>
          </article>
          <article>
            <h3>Exclusions written for you</h3>
            <p>Addresses likely to return go onto the Google Ads campaign list. Old entries expire so the 500-IP limit stays useful.</p>
          </article>
          <article>
            <h3>Performance Max, handled honestly</h3>
            <p>That campaign type has no IP list. When a click should be blocked, the conversion is held instead.</p>
          </article>
          <article>
            <h3>A daily report</h3>
            <p>Spend, invalid cost, and the clicks worth blocking arrive by email in the morning.</p>
          </article>
        </div>
      </section>

      <section className="band">
        <h2>Simple pricing</h2>
        <p className="lede">The first month is half price. After that PayPal deducts the regular price every 30 days until you cancel. Ten and twenty websites are for growing businesses managing multiple websites.{local}</p>
        <div className="plans">
          <article className="offer featured">
            <span className="offer-tag">50% off the first month</span>
            <h3>1 website</h3>
            <p className="offer-price">{half}</p>
            <p>Then {standard} every 30 days.</p>
            <a className="btn" href="/register?plan=month">Subscribe</a>
          </article>
          <article className="offer">
            <span className="offer-tag">50% off the first month</span>
            <h3>10 websites</h3>
            <p className="offer-price">{half10}</p>
            <p>Then {sites10} every 30 days. The same tag goes on each website.</p>
            <a className="btn" href="/register?plan=sites10">Create a 10-website account</a>
          </article>
          <article className="offer">
            <span className="offer-tag">50% off the first month</span>
            <h3>20 websites</h3>
            <p className="offer-price">{half20}</p>
            <p>Then {sites20} every 30 days. The same tag goes on each website.</p>
            <a className="btn" href="/register?plan=sites20">Create a 20-website account</a>
          </article>
        </div>
      </section>

      <section className="close">
        <h2>Put the budget back on real clicks.</h2>
        <a className="btn" href="/register?plan=month">Get started</a>
      </section>
      <footer className="site-legal">
        <a href="/privacy">Privacy</a>
        <a href="/support">Support</a>
        <a href="/terms">Terms</a>
      </footer>
    </div>
  );
}
