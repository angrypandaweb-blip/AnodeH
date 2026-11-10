import { compact, money } from "@/lib/format";
import { topDevices, topIps, topPlacements } from "@/lib/queries";

export const dynamic = "force-dynamic";

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

export default async function ThreatsPage() {
  const [ips, devices, placements] = await Promise.all([topIps(), topDevices(), topPlacements()]);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Threats</p>
          <h1>Where the waste repeats</h1>
          <p className="sub">
            Addresses, devices, and placements that keep producing invalid clicks. A device on many IPs is one visitor rotating exits. A placement with mostly invalid clicks is a site that should come off the campaign.
          </p>
        </div>
      </header>

      <article className="card">
        <span className="card-label">Addresses</span>
        {ips.length === 0 ? <p className="note">No clicks recorded yet.</p> : null}
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
                  <div className="cost">{money(row.cost)}</div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="card">
        <span className="card-label">Devices on more than one IP</span>
        {devices.length === 0 ? <p className="note">No device has shown up from more than one address.</p> : null}
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
        {placements.length === 0 ? <p className="note">No placement clicks recorded yet.</p> : null}
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
                  <div className="cost">{money(row.cost)}</div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
