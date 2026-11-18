import { Mark } from "@/components/Mark";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy");

export default function PrivacyPage() {
  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <a href="/support">Support</a>
        </nav>
      </header>
      <article className="legal">
        <p className="kicker">Privacy</p>
        <h1>How AnodeH handles your data</h1>
        <p>AnodeH scores invalid clicks on the Google Ads account you connect. This page says what that connection stores and what it is used for.</p>

        <h2>AnodeH account</h2>
        <p>Creating an account stores your name, email, password, country, the domain you want tracked, and the Google Ads customer ID you enter. A welcome email goes to that address. AnodeH also emails support@anodeh.com the name, email, country, and domain. The password is not emailed. Password resets, payment receipts, and the daily report use the account email. A support request emails support@anodeh.com and includes the message you write. PayPal processes the subscription payment. AnodeH stores the plan and the payment reference PayPal returns.</p>

        <h2>Google user data</h2>
        <p>
          Connect Google Ads sends you through Google’s sign-in with the scope <span className="mono">https://www.googleapis.com/auth/adwords</span>.
          AnodeH uses that permission only to read the campaigns and clicks of the Google Ads account you choose.
        </p>
        <p>From that connection AnodeH stores:</p>
        <ul>
          <li>the refresh token Google issues for this app</li>
          <li>the Google Ads customer ID, and the manager ID when the login is a manager account</li>
          <li>campaign names, channels, and status</li>
          <li>daily click totals and cost</li>
          <li>click rows Google returns with a gclid, including the time, campaign, keyword, device, and ad group</li>
        </ul>
        <p>Google Ads does not send the visitor’s IP address on this connection. Addresses used for scoring come from the AnodeH site tag on your own site.</p>
        <p>AnodeH uses this Google data to show you your campaigns and clicks and to score invalid traffic on the account you connected. It is not sold, used for advertising, or used to train a model for anyone else. It is not read for a different AnodeH customer.</p>
        <p>Settings has Disconnect. That deletes the stored refresh token, customer IDs, campaigns, daily totals, and Google click rows for your account.</p>

        <h2>Spam email monitoring</h2>
        <p>
          If you use Spam email, AnodeH stores messages you paste for scoring, and, when you connect a mailbox, the IMAP host, username, and an encrypted app password.
          Synced message From lines, subjects, snippets, and scores are kept so you can review them in the account. Disconnect removes the mailbox credentials. You can stop pasting messages at any time.
        </p>

        <h2>Contact</h2>
        <p>Questions about this data go to <a href="mailto:anodeh2026@gmail.com">anodeh2026@gmail.com</a>.</p>
      </article>
    </div>
  );
}
