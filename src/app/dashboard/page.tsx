import { clearAlerts, runScenario } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { reasonText } from "@/lib/score";
import { compact, dayLabel, money, percent, scoreBand, when } from "@/lib/format";
import { getPolicy } from "@/lib/engine";
import { alerts, capacity, dailySeries, recentRisky, weekStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, (n: number) => string> = {
  shoppers: (n) => `Added ${n} engaged residential visits. They stay billable.`,
  competitor: (n) => `Added ${n} short visits from the competitor address.`,
  datacenter: (n) => `Added ${n} datacenter clicks. A hosting /24 is excluded after three addresses in that range.`,
  vpn: (n) => `Added ${n} VPN bounces from outside the targeted country.`,
  reset: () => "Sample week restored.",
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; n?: string }>;
}) {
  const params = await searchParams;
  const [policy, user] = await Promise.all([getPolicy(), getUser()]);
  const stats = await weekStats();
  const series = await dailySeries();
  const risky = await recentRisky();
  const caps = await capacity();
  const notes = await alerts(true);
  const max = Math.max(1, ...series.map((day) => day.allow + day.other));
  const notice = params.notice ? NOTICES[params.notice] : undefined;
  const n = Math.max(0, Math.min(1000, Number(params.n) || 0));
  const hottest = caps.fullest / caps.cap;
  const todayInvalid = series.at(-1)?.other ?? 0;

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">{user?.adsAccount ? `Google Ads ${user.adsAccount}` : policy.domain}</p>
          <h1>Spend watched this week</h1>
          <p className="sub">
            Invalid clicks are scored as they arrive. Search and Display exclusions are written onto the ad account.
            Performance Max holds the conversion instead, because that campaign type has no IP list.
          </p>
        </div>
        <form action={runScenario} className="scenarios">
          <button name="scenario" value="shoppers" className="ghost" type="submit">Shoppers</button>
          <button name="scenario" value="competitor" className="ghost" type="submit">Competitor</button>
          <button name="scenario" value="datacenter" type="submit">Datacenter burst</button>
          <button name="scenario" value="vpn" className="ghost" type="submit">VPN bounces</button>
        </form>
      </header>

      {notice ? <p className="banner">{notice(n)}</p> : null}
      {!user?.adsAccount ? (
        <p className="banner warn">
          Add the Google Ads account you want to watch. <a href="/settings">Enter the account number</a>
        </p>
      ) : null}

      <section className="metrics">
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
          <strong>{money(stats.waste)}</strong>
          <em>of {money(stats.spend)} monitored</em>
        </article>
        <article className="metric">
          <span>Exclusions</span>
          <strong>{compact(caps.rows.reduce((sum, row) => sum + row.c, 0))}</strong>
          <em>Fullest campaign {caps.fullest}/{caps.cap}</em>
        </article>
      </section>

      <section className="split">
        <article className="card">
          <span className="card-label">Clicks by day</span>
          <div className="chart" aria-hidden>
            {series.map((day) => {
              const total = day.allow + day.other;
              const height = Math.max(4, Math.round((total / max) * 150));
              return (
                <div className="bar-col" key={day.ts}>
                  <span className="bar-count">{day.other}</span>
                  <div className="stack" style={{ height }}>
                    <div className="ok" style={{ flex: day.allow }} />
                    <div className="bad" style={{ flex: day.other }} />
                  </div>
                  <span>{dayLabel(day.ts)}</span>
                </div>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="swatch ok" /> Allowed</span>
            <span><i className="swatch bad" /> Flagged or blocked</span>
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
            {risky.map((click) => (
              <tr key={click.id}>
                <td>{when(click.ts)}</td>
                <td>
                  {click.campaign}
                  <div className="muted">{click.campaign_type === "pmax" ? "Conversion held when blocked" : click.keyword || click.placement || "—"}</div>
                </td>
                <td>
                  <div className="mono">{click.ip}</div>
                  <div className="muted">{click.isp} · {click.country}</div>
                </td>
                <td><span className={`pill ${scoreBand(click.score)}`}>{click.score}</span></td>
                <td>{reasonText(JSON.parse(click.reasons) as string[])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
