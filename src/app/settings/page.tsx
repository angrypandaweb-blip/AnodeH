import { headers } from "next/headers";
import { createAllow, deleteAllow, disconnectGoogle, restoreSample, saveAdsAccount, syncGoogleAds, updateSettings } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { getPolicy } from "@/lib/engine";
import { when } from "@/lib/format";
import { googleAdsConfigured, requestOrigin } from "@/lib/google-ads";
import { allowlist, googleLink } from "@/lib/queries";
import { mailConfigured } from "@/lib/mail";
import { THRESHOLDS } from "@/lib/score";
import type { Sensitivity } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHOICES: { id: Sensitivity; label: string }[] = [
  { id: "conservative", label: "Conservative" },
  { id: "balanced", label: "Balanced" },
  { id: "aggressive", label: "Aggressive" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [policy, allowed, headerList, user, link] = await Promise.all([getPolicy(), allowlist(), headers(), getUser(), googleLink()]);
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const snippet = `<script src="${proto}://${host}/cf.js" data-key="${policy.domainKey}" async></script>`;
  const origin = requestOrigin(headerList);
  const googleReady = googleAdsConfigured();

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>How clicks get scored</h1>
          <p className="sub">
            Sensitivity decides when a score becomes a flag or an exclusion. Addresses on the allow list always stay billable. The tag reports the visit so the next click can be scored.
          </p>
        </div>
      </header>

      {params.saved ? <p className="banner">Saved.</p> : null}
      {params.error ? <p className="banner warn">{params.error}</p> : null}

      <article className="card">
        <span className="card-label">Google Ads</span>
        <h2 style={{ marginTop: 10 }}>Pull campaigns and clicks</h2>
        {link ? (
          <>
            <p className="note">
              Connected{link.customerId ? ` to ${link.customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}` : ""}.
              {link.syncedAt ? ` Last pull ${when(link.syncedAt)}.` : " The first pull has not finished."}
              {" "}Google Ads does not include the visitor IP, so exclusions still come from the site tag.
            </p>
            {link.lastError ? <p className="banner warn">{link.lastError}</p> : null}
            <div className="hero-actions">
              <form action={syncGoogleAds}>
                <input type="hidden" name="return" value="/settings" />
                <button type="submit">Pull clicks now</button>
              </form>
              <form action={disconnectGoogle}>
                <button className="ghost" type="submit">Disconnect</button>
              </form>
            </div>
          </>
        ) : googleReady ? (
          <>
            <p className="note">
              Sign in with the Google account that can open this Ads account. AnodeH then downloads the campaign list and the last 7 days of clicks.
            </p>
            <a className="btn" href="/api/google-ads/start">Connect Google Ads</a>
          </>
        ) : (
          <p className="note">
            Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel for Production, then redeploy.
            The Google OAuth client needs the scope https://www.googleapis.com/auth/adwords and this redirect URI: {origin}/api/google-ads/callback
          </p>
        )}
      </article>

      <article className="card">
        <span className="card-label">Google Ads account</span>
        <p className="note">
          {user?.adsAccount
            ? `AnodeH is watching ${user.adsAccount}. Enter a different customer ID to switch accounts. A manager login needs this client ID before the pull.`
            : "Enter the 10-digit customer ID when the Google login is a manager account. A direct login can be discovered from Connect Google Ads."}
        </p>
        <form action={saveAdsAccount} className="form-grid">
          <label>
            Account number
            <input
              type="text"
              name="adsAccount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="123-456-7890"
              defaultValue={user?.adsAccount || ""}
              aria-label="Google Ads account number"
              required
            />
            <small>Ten digits, with or without dashes. This is the customer ID in Google Ads.</small>
          </label>
          <div>
            <button type="submit">{user?.adsAccount ? "Update account" : "Track this account"}</button>
          </div>
        </form>
      </article>

      <article className="card">
        <span className="card-label">Scoring</span>
        <form action={updateSettings} className="form-grid">
          <div className="radios">
            {CHOICES.map((choice) => {
              const threshold = THRESHOLDS[choice.id];
              return (
                <label key={choice.id}>
                  <input type="radio" name="sensitivity" value={choice.id} defaultChecked={policy.sensitivity === choice.id} />
                  <strong>{choice.label}</strong>
                  <small>Flag at {threshold.flag}, block at {threshold.block}</small>
                </label>
              );
            })}
          </div>
          <label>
            Exclusion length
            <input type="number" name="blockDays" min={1} max={90} defaultValue={policy.blockDays} />
            <small>Days an address stays excluded. 1 to 90.</small>
          </label>
          <label className="check">
            <input type="checkbox" name="autoBlock" defaultChecked={policy.autoBlock} />
            <span>
              Write exclusions automatically
              <small>When this is off, a block-level score is only flagged.</small>
            </span>
          </label>
          <div>
            <button type="submit">Save</button>
          </div>
        </form>
      </article>

      <article className="card">
        <span className="card-label">Email</span>
        <h2 style={{ marginTop: 10 }}>Receipts and the morning report</h2>
        <p className="note">
          {mailConfigured()
            ? "A receipt goes out when PayPal confirms a payment. A click report for the previous day goes out every morning at 7:00am SAST."
            : "Receipts and the daily click report are ready. Add RESEND_API_KEY, MAIL_FROM, and CRON_SECRET on Vercel, then redeploy, before those emails can leave."}
        </p>
      </article>

      <article className="card">
        <span className="card-label">Allow list</span>
        <p className="note">An IPv4 address or a /24 range. These visits score zero.</p>
        <form action={createAllow} className="form-grid">
          <label>
            Address
            <input type="text" name="value" placeholder="198.51.100.24 or 198.51.100.0/24" aria-label="Address or range" />
          </label>
          <label>
            Note
            <input type="text" name="note" placeholder="Office" aria-label="Note" />
          </label>
          <div>
            <button type="submit">Add</button>
          </div>
        </form>
        {allowed.length === 0 ? <p className="note">Nothing is allow-listed.</p> : null}
        {allowed.length > 0 ? (
          <ul className="accounts">
            {allowed.map((entry) => (
              <li key={entry.id}>
                <span>
                  <strong className="mono">{entry.value}</strong>
                  <div className="muted">{entry.note}</div>
                </span>
                <form action={deleteAllow}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="ghost" type="submit">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <article className="card">
        <span className="card-label">Site tag</span>
        <p className="note">Paste this on {policy.domain}. It sends the visit when the visitor leaves, or after eight seconds.</p>
        <pre className="snippet">{snippet}</pre>
      </article>

      <article className="card">
        <span className="card-label">Sample data</span>
        <p className="note">Replace the clicks, exclusions, and allow list with the original sample week.</p>
        <form action={restoreSample}>
          <button className="ghost" type="submit">Restore the sample week</button>
        </form>
      </article>
    </div>
  );
}
