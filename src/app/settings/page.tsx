import { headers } from "next/headers";
import { deleteAllow, removeCompany, saveAdsAccount, saveAverageClickPrice, saveCompany, saveCompanyClickPrice, saveTrackedDomain, switchCompany, updateCompanyAccount, updateSettings } from "@/app/actions";
import { AllowForm } from "@/components/AllowForm";
import { getUser } from "@/lib/auth";
import { getAccess } from "@/lib/billing";
import { loadCompanies } from "@/lib/companies";
import { coveredDomains } from "@/lib/domain";
import { getPolicy } from "@/lib/engine";
import { allowlist, savedClickPrice, savedDomainRecord } from "@/lib/queries";
import { placeFor } from "@/lib/residence-currency";
import { lastMailError } from "@/lib/email-reports";
import { mailConfigured } from "@/lib/mail";
import { publicIpv4 } from "@/lib/ip-source";
import { noIndex } from "@/lib/seo";
import { THRESHOLDS } from "@/lib/score";
import type { Sensitivity } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = noIndex;

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
  const [policy, allowed, headerList, user, averagePrice, domainRecord, access] = await Promise.all([
    getPolicy(),
    allowlist(),
    headers(),
    getUser(),
    savedClickPrice(),
    savedDomainRecord(),
    getAccess(),
  ]);
  const companies = user && access.sites > 1 ? await loadCompanies(user.id) : null;
  const domains = coveredDomains(policy.domain, domainRecord).filter((domain) => domain !== "anodeh.com");
  const siteLabel = access.sites === 1 ? "1 website" : `${access.sites} websites`;
  const currency = placeFor(user?.country || "", user?.email || "").currency;
  const mailError = user ? await lastMailError(user.id) : "";
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const snippet = `<script src="${proto}://${host}/cf.js" data-key="${policy.domainKey}" async></script>`;
  const visitorIp = publicIpv4(headerList.get("x-forwarded-for")) || publicIpv4(headerList.get("x-real-ip"));

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

      {companies ? (
        <article className="card" id="add-company">
          <span className="card-label">Add a company</span>
          <p className="note">
            {companies.companies.length} of {access.sites} websites are saved. Add the next website here. The Google Ads account can be filled in now or after.
          </p>
          {companies.companies.length < access.sites ? (
            <form action={saveCompany} className="form-grid">
              <label>
                Website
                <input type="text" name="domain" placeholder="example.com" required />
              </label>
              <label>
                Google Ads account
                <input type="text" name="adsAccount" inputMode="numeric" placeholder="123-456-7890" />
                <small>Optional. Ten digits, with or without dashes.</small>
              </label>
              <label>
                Average Google click ({currency})
                <input type="text" name="price" inputMode="decimal" placeholder="15.50" aria-label="Average Google click for the new company" />
                <small>Optional. What one paid click costs on this website.</small>
              </label>
              <div>
                <button type="submit">Add company</button>
              </div>
            </form>
          ) : (
            <p className="note">All {access.sites} websites are in use. Remove one to add a different company.</p>
          )}
          {companies.companies.length ? (
            <>
              <p className="note">Average Google click cost for each company already saved.</p>
              {companies.companies.map((company) => (
                <form action={saveCompanyClickPrice} className="form-grid company-price" key={company.domain}>
                  <input type="hidden" name="domain" value={company.domain} />
                  <label>
                    {company.domain} ({currency})
                    <input
                      type="text"
                      name="price"
                      inputMode="decimal"
                      defaultValue={company.clickPrice || averagePrice}
                      placeholder="15.50"
                      aria-label={`Average Google click for ${company.domain}`}
                    />
                    <small>Overview multiplies this website&apos;s paid clicks by this amount. Organic visits stay at zero. Leave it blank to use the account estimate, or the built-in estimate when none is saved.</small>
                  </label>
                  <div>
                    <button type="submit">Save price</button>
                  </div>
                </form>
              ))}
            </>
          ) : null}
        </article>
      ) : null}

      {companies ? null : (
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
      )}

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
        <AllowForm ip={visitorIp} />
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

      {companies ? null : (
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
      )}

      <article className="card">
        <span className="card-label">Site tag</span>
        <p className="note">
          This account covers {siteLabel}. {(companies ? companies.companies.length : domains.length)} of {access.sites} {(companies ? companies.companies.length : domains.length) === 1 ? "is" : "are"} saved.
          {companies ? " Click a company to open its results." : ""}
        </p>
        {companies ? (
          <>
            {companies.companies.length ? (
              <ul className="accounts">
                {companies.companies.map((company) => (
                  <li key={company.domain} className="company-row">
                    <span>
                      <strong className="mono">{company.domain}</strong>
                      <div className="muted">{company.domain === companies.active ? "Viewing this company" : "Saved"}</div>
                    </span>
                    <form action={updateCompanyAccount} className="form-grid">
                      <input type="hidden" name="domain" value={company.domain} />
                      <label>
                        Google Ads account
                        <input
                          type="text"
                          name="adsAccount"
                          inputMode="numeric"
                          defaultValue={company.adsAccount}
                          placeholder="123-456-7890"
                          aria-label={`Google Ads account for ${company.domain}`}
                          required
                        />
                      </label>
                      <div>
                        <button type="submit">Save account</button>
                      </div>
                    </form>
                    <form action={switchCompany}>
                      <input type="hidden" name="domain" value={company.domain} />
                      <button type="submit">{company.domain === companies.active ? "Showing these results" : "See results"}</button>
                    </form>
                    <form action={removeCompany}>
                      <input type="hidden" name="domain" value={company.domain} />
                      <button className="ghost" type="submit">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="note"><a href="#add-company">Add another company</a></p>
          </>
        ) : (
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
        )}
        <p className="note">Paste this on {(companies ? companies.companies.length : domains.length) > 1 ? "each website above" : (companies?.companies[0]?.domain || domains[0] || "the website you add")}. It sends the visit when the visitor leaves, or after eight seconds. A blocked visitor is then sent to anodeh.com/blocked. Allowed and flagged visitors stay on the page.</p>
        <pre className="snippet">{snippet}</pre>
      </article>

    </div>
  );
}
