import { Mark } from "@/components/Mark";
import { dollars, INTRO_CENTS, SITES_10_CENTS, SITES_10_INTRO_CENTS, SITES_20_CENTS, SITES_20_INTRO_CENTS, STANDARD_CENTS } from "@/lib/billing";

export const metadata = {
  title: "Terms · AnodeH",
  description: "The terms for an AnodeH subscription.",
};

export default function TermsPage() {
  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <a href="/support">Support</a>
        </nav>
      </header>
      <article className="legal">
        <p className="kicker">Terms</p>
        <h1>Terms for using AnodeH</h1>
        <p>AnodeH scores invalid traffic on the Google Ads account you connect and shows the result in your dashboard. Creating an account means you accept these terms and the <a href="/privacy">privacy policy</a>.</p>

        <h2>Your account</h2>
        <p>You connect a Google Ads account you are allowed to manage. AnodeH reads that account’s campaigns and clicks. It does not change bids, budgets, or ads.</p>

        <h2>Payment</h2>
        <p>
          The first 30 days are half price: {dollars(INTRO_CENTS)} for one website, {dollars(SITES_10_INTRO_CENTS)} for ten websites, and {dollars(SITES_20_INTRO_CENTS)} for twenty websites.
          After that PayPal deducts {dollars(STANDARD_CENTS)}, {dollars(SITES_10_CENTS)}, or {dollars(SITES_20_CENTS)} every 30 days until you cancel in PayPal.
          An account shows these prices in the currency of the country saved at registration. PayPal collects the US dollar amounts.
        </p>

        <h2>Contact</h2>
        <p>Questions about these terms go to <a href="mailto:anodeh2026@gmail.com">anodeh2026@gmail.com</a>.</p>
      </article>
    </div>
  );
}
