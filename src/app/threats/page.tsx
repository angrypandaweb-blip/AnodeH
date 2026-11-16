import { activitySince, type ActivityRange } from "@/lib/activity-range";
import { getUser } from "@/lib/auth";
import { compact } from "@/lib/format";
import { googleLink, topDevices, topIps, topPlacements } from "@/lib/queries";
import { formatMoney, placeFor, reportCurrency, usdRate } from "@/lib/residence-currency";

export const dynamic = "force-dynamic";

const RANGES = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "all", label: "All time" },
] as const;

function threatsHref(range: ActivityRange) {
  return range === "all" ? "/threats" : `/threats?range=${range}`;
}

const NETWORK_LABEL: Record<string, string> = {
  residential: "Residential",
  datacenter: "Datacenter",
  vpn: "VPN",
  proxy: "Proxy",
};

function networkClass(network: string) {
  if (network === "residential") return "ok";
  if (network === "vpn") return "watch";
  return "stop";
}

function shortHash(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function googleRowPrice(
  row: { clicks: number; priced_clicks: number; google_cost: number | null },
  currency: string,
  scale: number,
) {
  if (row.priced_clicks !== row.clicks || typeof row.google_cost !== "number" || !currency || !scale) return "—";
  return formatMoney(row.google_cost * scale, currency);
}

export default async function ThreatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: ActivityRange = RANGES.some((item) => item.id === params.range) ? (params.range as ActivityRange) : "all";
  const user = await getUser();
  const place = placeFor(user?.country || "", user?.email || "");
  const local = await reportCurrency(user?.email || "", user?.country || "");
  const since = activitySince(range, Date.now(), place.timeZone);
  const [ips, devices, placements, link] = await Promise.all([topIps(since), topDevices(since), topPlacements(since), googleLink()]);
  const adsCurrency = /^[A-Z]{3}$/.test(link?.currency || "") ? link?.currency || "" : "";
  const fromRate = adsCurrency && adsCurrency !== local.currency ? await usdRate(adsCurrency) : 1;
  const toRate = adsCurrency && adsCurrency !== local.currency ? await usdRate(local.currency) : 1;
  const adsScale = fromRate && toRate ? toRate / fromRate : 0;
  const rowPrice = (row: { clicks: number; priced_clicks: number; google_cost: number | null }) =>
    googleRowPrice(row, adsCurrency, adsScale);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Threats</p>
          <h1>Where the waste repeats</h1>
          <p className="sub">
            Addresses, devices, and placements that keep producing invalid clicks. A device on many IPs is one visitor rotating exits. A placement with mostly invalid clicks is a site that should come off the campaign. A cost is shown only when Google Ads reported a price for every click in that row.
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="filters" role="navigation" aria-label="Time range">
          {RANGES.map((item) => (
            <a key={item.id} className={item.id === range ? "on" : undefined} href={threatsHref(item.id)}>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <article className="card">
        <span className="card-label">Addresses</span>
        {ips.length === 0 ? <p className="note">{range === "all" ? "No clicks recorded yet." : "No clicks in this period."}</p> : null}
        {ips.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>Invalid</span>
              <span>Address</span>
              <span>Clicks</span>
              <span>Cost</span>
            </div>
            {ips.map((row) => (
              <article className="click" key={row.ip}>
                <div className={`click-score pill ${row.invalid > 0 ? "stop" : "ok"}`} aria-label={`${row.invalid} invalid clicks`}>
                  {compact(row.invalid)}
                </div>
                <div>
                  <div className="click-title">
                    <strong className="mono">{row.ip}</strong>
                    <span className={`pill ${networkClass(row.network)}`}>{NETWORK_LABEL[row.network] ?? row.network}</span>
                  </div>
                  <div className="reasons">
                    <span className="reason">{row.isp}</span>
                  </div>
                </div>
                <div className="click-source">
                  <div>{compact(row.clicks)} clicks</div>
                  <div className="muted">{compact(row.invalid)} invalid</div>
                </div>
                <div className="click-side">
                  <div className="cost">{rowPrice(row)}</div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="card">
        <span className="card-label">Devices on more than one IP</span>
        {devices.length === 0 ? <p className="note">{range === "all" ? "No device has shown up from more than one address." : "No device used more than one address in this period."}</p> : null}
        {devices.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>IPs</span>
              <span>Device</span>
              <span>Clicks</span>
              <span>Invalid</span>
            </div>
            {devices.map((row) => (
              <article className="click" key={row.device_hash}>
                <div className="click-score pill watch" aria-label={`${row.ips} IP addresses`}>
                  {compact(row.ips)}
                </div>
                <div>
                  <div className="click-title">
                    <strong className="mono">{shortHash(row.device_hash)}</strong>
                    <span className={`pill ${networkClass(row.network)}`}>{NETWORK_LABEL[row.network] ?? row.network}</span>
                  </div>
                </div>
                <div className="click-source">
                  <div>{compact(row.clicks)} clicks</div>
                </div>
                <div className="click-side">
                  <div className="cost">{compact(row.invalid)} invalid</div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="card">
        <span className="card-label">Placements</span>
        {placements.length === 0 ? <p className="note">{range === "all" ? "No placement clicks recorded yet." : "No placement clicks in this period."}</p> : null}
        {placements.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>Invalid</span>
              <span>Placement</span>
              <span>Clicks</span>
              <span>Cost</span>
            </div>
            {placements.map((row) => (
              <article className="click" key={row.placement}>
                <div className={`click-score pill ${row.invalid > 0 ? "stop" : "ok"}`} aria-label={`${row.invalid} invalid clicks`}>
                  {compact(row.invalid)}
                </div>
                <div>
                  <div className="click-title">
                    <strong>{row.placement}</strong>
                  </div>
                </div>
                <div className="click-source">
                  <div>{compact(row.clicks)} clicks</div>
                  <div className="muted">{compact(row.invalid)} invalid</div>
                </div>
                <div className="click-side">
                  <div className="cost">{rowPrice(row)}</div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
