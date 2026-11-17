import { headers } from "next/headers";
import { createAllow, deleteAllow, saveAdsAccount, saveAverageClickPrice, saveTrackedDomain, updateSettings } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { getPolicy } from "@/lib/engine";
import { allowlist, savedClickPrice } from "@/lib/queries";
import { placeFor } from "@/lib/residence-currency";
import { lastMailError } from "@/lib/email-reports";
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
  const [policy, allowed, headerList, user, averagePrice] = await Promise.all([
    getPolicy(),
    allowlist(),
    headers(),
    getUser(),
    savedClickPrice(),
  ]);
  const currency = placeFor(user?.country || "", user?.email || "").currency;
  const mailError = user ? await lastMailError(user.id) : "";
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const snippet = `<script src="${proto}://${host}/cf.js" data-key="${policy.domainKey}" async></script>`;

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
        <span className="card-label">Google Ads account</span>
        <p className="note">
          {user?.adsAccount
            ? `AnodeH is watching ${user.adsAccount}. Enter a different customer ID to switch accounts.`
            : "Enter the 10-digit customer ID of the Google Ads account you want watched."}
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
            ? "A receipt goes out when PayPal confirms a payment. A click report for the previous day goes out every morning at 7:00am in your time zone. On the current host it can arrive any time in the following hour."
            : "Receipts and the daily click report are ready. Add RESEND_API_KEY, MAIL_FROM, and CRON_SECRET on Vercel, then redeploy, before those emails can leave."}
        </p>
        {mailError ? <p className="banner warn">{mailError}</p> : null}
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
        <span className="card-label">Average click</span>
        <form action={saveAverageClickPrice} className="form-grid">
          <label>
            Average Google click ({currency})
            <input type="text" name="price" inputMode="decimal" defaultValue={averagePrice} placeholder="15.50" aria-label={`Average Google click in ${currency}`} />
            <small>Overview multiplies paid clicks by this amount. Organic visits stay at zero. Leave it blank to use the built-in estimate.</small>
          </label>
          <div>
            <button type="submit">Save price</button>
          </div>
        </form>
      </article>

      <article className="card">
        <span className="card-label">Site tag</span>
        <form action={saveTrackedDomain} className="form-grid">
          <label>
            Domain to track
            <input type="text" name="domain" defaultValue={policy.domain.toLowerCase() === "anodeh.com" ? "" : policy.domain} placeholder="example.com" required />
            <small>This is the site where the tag is pasted.</small>
          </label>
          <div>
            <button type="submit">Save domain</button>
          </div>
        </form>
        <p className="note">Paste this on {policy.domain.toLowerCase() === "anodeh.com" ? "the domain above" : policy.domain}. It sends the visit when the visitor leaves, or after eight seconds. A blocked visitor is then sent to anodeh.com/blocked. Allowed and flagged visitors stay on the page.</p>
        <pre className="snippet">{snippet}</pre>
      </article>

    </div>
  );
}
