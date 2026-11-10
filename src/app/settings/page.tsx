import { headers } from "next/headers";
import { createAllow, deleteAllow, restoreSample, updateSettings } from "@/app/actions";
import { getPolicy } from "@/lib/engine";
import { allowlist } from "@/lib/queries";
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
  const [policy, allowed, headerList] = await Promise.all([getPolicy(), allowlist(), headers()]);
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
