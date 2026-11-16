import { manualBlock } from "@/app/actions";
import { activitySince, type ActivityRange } from "@/lib/activity-range";
import { getUser } from "@/lib/auth";
import { compact, scoreBand, when } from "@/lib/format";
import { activityCounts, googleLink, listClicks } from "@/lib/queries";
import { formatMoney, placeFor, reportCurrency, usdRate } from "@/lib/residence-currency";
import { REASON_LABELS } from "@/lib/score";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "allow", label: "Allowed" },
  { id: "flag", label: "Flagged" },
  { id: "block", label: "Blocked" },
] as const;

const RANGES = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "all", label: "All time" },
] as const;

const ACTION_LABEL = { allow: "Allowed", flag: "Flagged", block: "Blocked" } as const;
const TYPE_LABEL = { search: "Search", display: "Display", pmax: "Performance Max" } as const;

const TRAFFIC = [
  { id: "all", label: "All traffic" },
  { id: "paid", label: "Paid" },
  { id: "organic", label: "Organic" },
] as const;

function activityHref(action: string, query: string, range: ActivityRange, traffic: string, page = 0) {
  const params = new URLSearchParams();
  if (action && action !== "all") params.set("action", action);
  if (range !== "all") params.set("range", range);
  if (traffic === "paid" || traffic === "organic") params.set("traffic", traffic);
  if (query) params.set("q", query);
  if (page > 0) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/activity?${qs}` : "/activity";
}

function reasonList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((reason) => REASON_LABELS[String(reason)] ?? String(reason));
  } catch {
    return [];
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string; page?: string; range?: string; traffic?: string; error?: string }>;
}) {
  const params = await searchParams;
  const action = FILTERS.some((filter) => filter.id === params.action) ? params.action || "all" : "all";
  const range: ActivityRange = RANGES.some((item) => item.id === params.range) ? (params.range as ActivityRange) : "all";
  const traffic = TRAFFIC.some((item) => item.id === params.traffic) ? params.traffic || "all" : "all";
  const user = await getUser();
  const place = placeFor(user?.country || "", user?.email || "");
  const since = activitySince(range, Date.now(), place.timeZone);
  const query = (params.q || "").trim().slice(0, 80);
  const page = Math.max(0, Math.min(500, Number(params.page) || 0));
  const [{ rows, total, pageSize }, counts, link] = await Promise.all([
    listClicks(action, query, page, 40, since, traffic),
    activityCounts(query, since, traffic, action),
    googleLink(),
  ]);
  const local = await reportCurrency(user?.email || "", user?.country || "");
  const adsCurrency = /^[A-Z]{3}$/.test(link?.currency || "") ? link?.currency || "" : "";
  const fromRate = adsCurrency && adsCurrency !== local.currency ? await usdRate(adsCurrency) : 1;
  const toRate = adsCurrency && adsCurrency !== local.currency ? await usdRate(local.currency) : 1;
  const adsScale = fromRate && toRate ? toRate / fromRate : 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const here = activityHref(action, query, range, traffic, page);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Activity</p>
          <h1>Every scored click</h1>
          <p className="sub">
            Search, filter, and exclude an address from the campaign it clicked. Times and money follow the country on the account. Cost is the average price Google Ads reported for that campaign on that day. Organic visits have no ad cost. Performance Max holds the conversion instead of writing an IP exclusion.
          </p>
        </div>
      </header>

      {params.error ? <p className="banner warn">{params.error}</p> : null}

      <div className="toolbar">
        <div className="filters" role="navigation" aria-label="Filter clicks">
          {FILTERS.map((filter) => (
            <a key={filter.id} className={filter.id === action ? "on" : undefined} href={activityHref(filter.id, query, range, traffic)}>
              {filter.label}
              <span className="count">{compact(counts[filter.id])}</span>
            </a>
          ))}
        </div>
        <div className="filters" role="navigation" aria-label="Time range">
          {RANGES.map((item) => (
            <a key={item.id} className={item.id === range ? "on" : undefined} href={activityHref(action, query, item.id, traffic)}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="filters" role="navigation" aria-label="Paid or organic">
          {TRAFFIC.map((item) => (
            <a key={item.id} className={item.id === traffic ? "on" : undefined} href={activityHref(action, query, range, item.id)}>
              {item.label}
              <span className="count">{compact(item.id === "all" ? counts.paid + counts.organic : counts[item.id])}</span>
            </a>
          ))}
        </div>
        <form className="filters" action="/activity">
          {action !== "all" ? <input type="hidden" name="action" value={action} /> : null}
          {range !== "all" ? <input type="hidden" name="range" value={range} /> : null}
          {traffic !== "all" ? <input type="hidden" name="traffic" value={traffic} /> : null}
          <input name="q" defaultValue={query} placeholder="IP, campaign, or keyword" aria-label="Search clicks" />
          <button className="ghost" type="submit">Search</button>
        </form>
      </div>

      <article className="card">
        {rows.length === 0 ? <p className="note">No clicks match this view.</p> : null}
        {rows.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>Score</span>
              <span>Click</span>
              <span>Source</span>
              <span>Cost</span>
            </div>
            {rows.map((click) => {
              const reasons = reasonList(click.reasons);
              const held = click.campaign_type === "pmax";
              const kind = TYPE_LABEL[click.campaign_type as keyof typeof TYPE_LABEL] ?? click.campaign_type;
              const actionLabel = ACTION_LABEL[click.action as keyof typeof ACTION_LABEL] ?? click.action;
              const detail = click.keyword || click.placement || kind;
              const adsCost = typeof click.google_cost === "number" && adsCurrency && adsScale
                ? formatMoney(click.google_cost * adsScale, local.currency)
                : null;
              return (
                <article className="click" key={click.id}>
                  <div className={`click-score pill ${scoreBand(click.score)}`} aria-label={`Score ${click.score}`}>
                    {click.score}
                  </div>
                  <div>
                    <div className="click-title">
                      <strong>{click.campaign}</strong>
                      <span className="muted">{detail}</span>
                      <span className={`pill ${click.action}`}>{actionLabel}</span>
                      <span className={`pill ${click.channel === "organic" ? "organic" : "paid"}`}>{click.channel === "organic" ? "Organic" : "Paid"}</span>
                    </div>
                    <div className="reasons">
                      {reasons.length === 0 ? <span className="reason">No risk signals</span> : null}
                      {reasons.map((reason) => (
                        <span className="reason" key={reason}>{reason}</span>
                      ))}
                    </div>
                  </div>
                  <div className="click-source">
                    <div className="mono">{click.ip}</div>
                    <div className="muted">{[click.isp, click.country].filter(Boolean).join(" · ")}</div>
                    <div className="muted">{when(click.ts, place.timeZone)}</div>
                  </div>
                  <div className="click-side">
                    <div className="cost">{adsCost ?? "—"}</div>
                    {click.block_id ? <span className="pill block">Excluded</span> : null}
                    {!click.block_id && held ? <span className="muted">Conversion held</span> : null}
                    {!click.block_id && !held ? (
                      <form action={manualBlock}>
                        <input type="hidden" name="ip" value={click.ip} />
                        <input type="hidden" name="campaign" value={click.campaign} />
                        <input type="hidden" name="score" value={String(click.score)} />
                        <input type="hidden" name="return" value={here} />
                        <button className="ghost" type="submit">Exclude</button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        <div className="pager">
          <span className="muted">{from}–{to} of {total}</span>
          {page > 0 ? <a href={activityHref(action, query, range, traffic, page - 1)}>Previous</a> : null}
          {page + 1 < pages ? <a href={activityHref(action, query, range, traffic, page + 1)}>Next</a> : null}
        </div>
      </article>
    </div>
  );
}
