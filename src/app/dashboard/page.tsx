import { clearAlerts } from "@/app/actions";
import { LiveRefresh } from "@/components/LiveRefresh";
import { getUser } from "@/lib/auth";
import { reasonText } from "@/lib/score";
import { compact, dayLabel, percent, scoreTone, when } from "@/lib/format";
import { formatMoney, moneyInCurrency, placeFor, reportCurrency } from "@/lib/residence-currency";
import { getPolicy } from "@/lib/engine";
import { refreshGoogleAdsIfStale } from "@/lib/google-ads";
import { alerts, capacity, dailySeries, googleDaily, googleLink, recentRisky, weekStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

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
  searchParams: Promise<{ notice?: string; n?: string }>;
}) {
  const params = await searchParams;
  const [policy, user] = await Promise.all([getPolicy(), getUser()]);
  if (user) await refreshGoogleAdsIfStale(user.id);
  const link = user ? await googleLink() : null;
  const googleDays = link ? await googleDaily() : [];
  const googleClicksTotal = googleDays.reduce((sum, day) => sum + day.clicks, 0);
  const googleCost = googleDays.reduce((sum, day) => sum + day.cost_micros, 0) / 1_000_000;
  const hasGoogleTotals = googleClicksTotal > 0 || googleCost > 0;
  const stats = await weekStats();
  const series = await dailySeries();
  const risky = await recentRisky();
  const caps = await capacity();
  const notes = await alerts(true);
  const max = Math.max(1, ...series.map((day) => day.allow + day.organic + day.flagged + day.repeat));
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
      </header>

      {notice && params.notice !== "google" ? <p className="banner">{notice(n)}</p> : null}

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

      <section className="split">
        <article className="card">
          <span className="card-label">Clicks by day</span>
          <div className="chart" aria-hidden>
            {series.map((day) => {
              const total = day.allow + day.organic + day.flagged + day.repeat;
              const height = Math.max(4, Math.round((total / max) * 150));
              const countClass = day.repeat > 0 ? "repeat" : day.organic > 0 && day.flagged === 0 ? "organic" : "";
              return (
                <div className="bar-col" key={day.ts}>
                  <span className={`bar-count ${countClass}`}>{day.organic + day.flagged + day.repeat}</span>
                  <div className="stack" style={{ height }}>
                    <div className="ok" style={{ flex: day.allow }} />
                    <div className="organic" style={{ flex: day.organic }} />
                    <div className="bad" style={{ flex: day.flagged }} />
                    <div className="repeat" style={{ flex: day.repeat }} />
                  </div>
                  <span>{dayLabel(day.ts, place.timeZone)}</span>
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="swatch ok" /> Allowed</span>
            <span><i className="swatch organic" /> Organic · free click</span>
            <span><i className="swatch bad" /> Flagged</span>
            <span><i className="swatch repeat" /> Paid repeat IP</span>
          </div>
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
      </section>

      <article className="card">
        <span className="card-label">Latest scored clicks</span>
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
            {risky.map((click) => (
              <tr key={click.id}>
                <td>{when(click.ts, place.timeZone)}</td>
                <td>
                  {click.campaign}
                  <div className="muted">{click.campaign_type === "pmax" ? "Conversion held when blocked" : click.keyword || click.placement || "—"}</div>
                </td>
                <td>
                  <div className="mono">{click.ip}</div>
                  <div className="muted">{[click.isp, click.country].filter(Boolean).join(" · ")}</div>
                </td>
                <td><span className="pill" style={scoreTone(click.score)}>{click.score}</span></td>
                <td>{reasonText(JSON.parse(click.reasons) as string[])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
