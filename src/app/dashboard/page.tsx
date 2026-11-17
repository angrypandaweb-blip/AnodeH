import { clearAlerts, manualBlock, runScenario } from "@/app/actions";
import { LiveRefresh } from "@/components/LiveRefresh";
import { getUser } from "@/lib/auth";
import { compact, percent, scoreTone, when } from "@/lib/format";
import { formatMoney, moneyInCurrency, placeFor, reportCurrency } from "@/lib/residence-currency";
import { getPolicy } from "@/lib/engine";
import { refreshGoogleAdsIfStale } from "@/lib/google-ads";
import { alerts, capacity, dailySeries, googleDaily, googleLink, listClicks, weekStats } from "@/lib/queries";
import { REASON_LABELS } from "@/lib/score";

export const dynamic = "force-dynamic";

const ACTION_LABEL = { allow: "Allowed", flag: "Flagged", block: "Blocked" } as const;
const TYPE_LABEL = { search: "Search", display: "Display", pmax: "Performance Max" } as const;

function reasonList(raw: string): { code: string; label: string }[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((reason) => {
      const code = String(reason);
      return { code, label: REASON_LABELS[code] ?? code };
    });
  } catch {
    return [];
  }
}

const NOTICES: Record<string, (n: number) => string> = {
  shoppers: (n) => `Added ${n} engaged residential visits. They stay billable.`,
  competitor: (n) => `Added ${n} short visits from the competitor address.`,
  datacenter: (n) => `Added ${n} datacenter clicks. A hosting /24 is excluded after three addresses in that range.`,
  vpn: (n) => `Added ${n} VPN bounces from outside the targeted country.`,
  reset: () => "Sample week restored.",
  google: (n) => `Pulled ${n} clicks from Google Ads.`,
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; n?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [policy, user] = await Promise.all([getPolicy(), getUser()]);
  if (user) await refreshGoogleAdsIfStale(user.id);
  const link = user ? await googleLink() : null;
  const googleDays = link ? await googleDaily() : [];
  const googleClicksTotal = googleDays.reduce((sum, day) => sum + day.clicks, 0);
  const googleCost = googleDays.reduce((sum, day) => sum + day.cost_micros, 0) / 1_000_000;
  const hasGoogleTotals = googleClicksTotal > 0 || googleCost > 0;
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const stats = await weekStats();
  const series = await dailySeries();
  const { rows } = await listClicks("all", "", 0, 8, since, "all");
  const caps = await capacity();
  const notes = await alerts(true);
  const notice = params.notice ? NOTICES[params.notice] : undefined;
  const n = Math.max(0, Math.min(1000, Number(params.n) || 0));
  const hottest = caps.fullest / caps.cap;
  const todayInvalid = series.at(-1) ? series.at(-1)!.organic + series.at(-1)!.flagged + series.at(-1)!.repeat : 0;
  const place = placeFor(user?.country || "", user?.email || "");
  const local = await reportCurrency(user?.email || "", user?.country || "");
  const priced = (usd: number) => formatMoney(usd * local.rate, local.currency);
  const adsCurrency = /^[A-Z]{3}$/.test(link?.currency || "") ? link?.currency || "" : "";
  const googlePrice = adsCurrency ? await moneyInCurrency(googleCost, adsCurrency, local.currency) : priced(0);

  return (
    <div>
      <LiveRefresh />
      <header className="page-head">
        <div>
          <p className="eyebrow">{user?.adsAccount ? `Google Ads ${user.adsAccount}` : policy.domain}</p>
          <h1>Spend watched this week</h1>
          <p className="sub">
            {hasGoogleTotals
              ? "Paid click totals come from Google Ads. Each scored visit still comes from the site tag."
              : "Invalid clicks are scored as they arrive. Search and Display exclusions are written onto the ad account. Performance Max holds the conversion instead, because that campaign type has no IP list."}
          </p>
        </div>
        {link ? null : (
          <form action={runScenario} className="scenarios">
            <button name="scenario" value="shoppers" className="ghost" type="submit">Shoppers</button>
            <button name="scenario" value="competitor" className="ghost" type="submit">Competitor</button>
            <button name="scenario" value="datacenter" type="submit">Datacenter burst</button>
            <button name="scenario" value="vpn" className="ghost" type="submit">VPN bounces</button>
          </form>
        )}
      </header>

      {params.error ? <p className="banner warn">{params.error}</p> : null}
      {notice && params.notice !== "google" ? <p className="banner">{notice(n)}</p> : null}
      {!link && !user?.adsAccount ? (
        <p className="banner warn">
          Add the Google Ads account you want to watch. <a href="/settings">Connect Google Ads</a>
        </p>
      ) : null}

      <section className="metrics">
        {hasGoogleTotals ? (
          <>
            <article className="metric">
              <span>Paid clicks</span>
              <strong>{compact(googleClicksTotal)}</strong>
              <em>Total reported by Google Ads</em>
            </article>
            <article className="metric">
              <span>Paid cost</span>
              <strong>{googlePrice ?? priced(googleCost)}</strong>
              <em>Last 7 days</em>
            </article>
            <article className="metric">
              <span>Invalid rate</span>
              <strong>{percent(stats.invalid, stats.clicks)}</strong>
              <em>{compact(stats.invalid)} flagged or blocked · {compact(todayInvalid)} today</em>
            </article>
            <article className="metric">
              <span>Exclusions</span>
              <strong>{compact(caps.rows.reduce((sum, row) => sum + row.c, 0))}</strong>
              <em>Fullest campaign {caps.fullest}/{caps.cap}</em>
            </article>
          </>
        ) : (
          <>
            <article className="metric">
              <span>Clicks</span>
              <strong>{compact(stats.clicks)}</strong>
              <em>Last 7 days</em>
            </article>
            <article className="metric">
              <span>Invalid rate</span>
              <strong>{percent(stats.invalid, stats.clicks)}</strong>
              <em>{compact(stats.invalid)} flagged or blocked · {compact(todayInvalid)} today</em>
            </article>
            <article className="metric">
              <span>Invalid cost</span>
              <strong>{priced(stats.waste)}</strong>
              <em>of {priced(stats.spend)} monitored</em>
            </article>
            <article className="metric">
              <span>Exclusions</span>
              <strong>{compact(caps.rows.reduce((sum, row) => sum + row.c, 0))}</strong>
              <em>Fullest campaign {caps.fullest}/{caps.cap}</em>
            </article>
          </>
        )}
      </section>

      <article className="card">
        <span className="card-label">Latest scored clicks</span>
        {rows.length === 0 ? <p className="note">No scored visits in the last 7 days.</p> : null}
        {rows.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>Score</span>
              <span>Click</span>
              <span>Source</span>
              <span>Exclude</span>
            </div>
            {rows.map((click) => {
              const reasons = reasonList(click.reasons);
              const organic = click.channel === "organic";
              const held = click.campaign_type === "pmax";
              const kind = TYPE_LABEL[click.campaign_type as keyof typeof TYPE_LABEL] ?? click.campaign_type;
              const actionLabel = ACTION_LABEL[click.action as keyof typeof ACTION_LABEL] ?? click.action;
              const detail = click.keyword || click.placement || kind;
              return (
                <article className="click" key={click.id}>
                  <div className="click-score" style={scoreTone(click.score)} aria-label={`Score ${click.score}`}>
                    {click.score}
                  </div>
                  <div>
                    <div className="click-title">
                      <strong>{click.campaign}</strong>
                      <span className="muted">{detail}</span>
                      <span className={`pill ${click.action}`}>{actionLabel}</span>
                      <span className={`pill ${organic ? "organic" : "paid"}`}>{organic ? "Organic" : "Paid"}</span>
                      {organic ? <span className="organic-note">Free click. Google Ads does not charge for it.</span> : null}
                    </div>
                    <div className="reasons">
                      {reasons.length === 0 ? <span className={`reason ${organic ? "organic" : ""}`}>No risk signals</span> : null}
                      {reasons.map((reason, index) => (
                        <span
                          className={`reason ${organic ? "organic" : ""} ${!organic && reason.code === "repeat_ip" ? "repeat" : ""}`}
                          key={`${reason.code}-${index}`}
                        >
                          {reason.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="click-source">
                    <div className="mono">{click.ip}</div>
                    <div className="muted">{[click.isp, click.country].filter(Boolean).join(" · ")}</div>
                    <div className="muted">{when(click.ts, place.timeZone)}</div>
                  </div>
                  <div className="click-side">
                    {click.block_id ? <span className="pill block">Excluded</span> : null}
                    {!click.block_id && held ? <span className="muted">Conversion held</span> : null}
                    {!click.block_id && !held ? (
                      <form action={manualBlock}>
                        <input type="hidden" name="ip" value={click.ip} />
                        <input type="hidden" name="campaign" value={click.campaign} />
                        <input type="hidden" name="score" value={String(click.score)} />
                        <input type="hidden" name="return" value="/dashboard" />
                        <button className="ghost" type="submit">Exclude</button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        <p className="note"><a href="/activity">Open Activity</a> for the full list.</p>
      </article>

      <article className="card">
        <span className="card-label">Exclusion room</span>
        <div className="capacity">
          <div className={`track ${hottest >= 0.8 ? "hot" : hottest >= 0.5 ? "warn" : ""}`}>
            <span style={{ width: `${Math.min(100, hottest * 100)}%` }} />
          </div>
          <p className="note">
            Google Ads keeps about 500 IP exclusions per campaign. AnodeH spends that list on addresses likely to return, and lets them expire.
          </p>
        </div>
        {caps.rows.length === 0 ? <p className="note">No active exclusions yet.</p> : null}
        {caps.rows.map((row) => (
          <div className="cap-row" key={row.campaign}>
            <span>{row.campaign}</span>
            <span className="mono">{row.c}/{caps.cap}</span>
          </div>
        ))}
        {notes.length > 0 ? (
          <form action={clearAlerts}>
            <p className="banner warn">{notes[0].message}</p>
            <button className="ghost" type="submit">Dismiss alerts</button>
          </form>
        ) : null}
      </article>
    </div>
  );
}
