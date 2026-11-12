import { unblock } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { CAMPAIGNS } from "@/lib/campaigns";
import { compact, scoreBand, when } from "@/lib/format";
import { refreshGoogleAdsIfStale } from "@/lib/google-ads";
import { blockCounts, capacity, googleCampaigns, googleLink, listBlocks } from "@/lib/queries";
import { REASON_LABELS } from "@/lib/score";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "active", label: "Active" },
  { id: "covered", label: "Covered" },
  { id: "expired", label: "Expired" },
  { id: "evicted", label: "Released" },
  { id: "removed", label: "Removed" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  search: "Search",
  display: "Display",
  pmax: "Performance Max",
  other: "Other",
};

function protectionHref(status: string, page = 0) {
  const params = new URLSearchParams();
  if (status && status !== "active") params.set("status", status);
  if (page > 0) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/protection?${qs}` : "/protection";
}

function reasonList(raw: string): string[] {
  return raw
    .split(",")
    .map((reason) => reason.trim())
    .filter(Boolean)
    .map((reason) => REASON_LABELS[reason] ?? reason);
}

export default async function ProtectionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; notice?: string; n?: string }>;
}) {
  const params = await searchParams;
  const status = FILTERS.some((filter) => filter.id === params.status) ? params.status || "active" : "active";
  const page = Math.max(0, Math.min(500, Number(params.page) || 0));
  const [{ rows, total, pageSize }, counts, caps] = await Promise.all([
    listBlocks(status, page),
    blockCounts(),
    capacity(),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const here = protectionHref(status, page);
  const used = new Map(caps.rows.map((row) => [row.campaign, row.c]));
  const added = Math.max(0, Math.min(10000, Number(params.n) || 0));
  const user = await getUser();
  if (user) await refreshGoogleAdsIfStale(user.id);
  const link = await googleLink();
  const liveCampaigns = link ? await googleCampaigns() : [];
  const cards = link
    ? liveCampaigns.map((campaign) => ({
        slug: campaign.campaign_id,
        name: campaign.name,
        type: campaign.channel,
        status: campaign.status === "ENABLED" ? "" : campaign.status.toLowerCase(),
      }))
    : CAMPAIGNS.map((campaign) => ({ slug: campaign.slug, name: campaign.name, type: campaign.type, status: "" }));

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Protection</p>
          <h1>Exclusions on the account</h1>
          <p className="sub">
            Search and Display write an IP exclusion onto the campaign. Google Ads keeps about 500 per campaign, so older addresses are released when a list fills up. Performance Max has no IP list, so a blocked click holds the conversion instead.
          </p>
        </div>
      </header>

      {params.notice === "pressure" ? (
        <p className="banner">Added {compact(added)} addresses to Brand — Exact so the list can be seen near its ceiling.</p>
      ) : null}

      {link ? (
        <p className="note">
          These campaign names were downloaded from Google Ads{link.customerId ? ` ${link.customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}` : ""}.
          {link.lastError ? ` ${link.lastError}` : ""}
        </p>
      ) : (
        <p className="note">These are the sample campaigns. Connect Google Ads in Settings to replace them with the account you watch.</p>
      )}

      <section className="campaign-grid">
        {cards.length === 0 ? <article className="card"><p className="note">Google Ads returned no campaigns.</p></article> : null}
        {cards.map((campaign) => {
          const count = used.get(campaign.name) ?? 0;
          const share = count / caps.cap;
          const kind = TYPE_LABEL[campaign.type] || "Other";
          return (
            <article className="card campaign-card" key={campaign.slug}>
              <span className="card-label">{campaign.status ? `${kind} · ${campaign.status}` : kind}</span>
              <strong>{campaign.name}</strong>
              {campaign.type === "pmax" ? (
                <p className="note">Conversion held. This campaign has no IP exclusion list.</p>
              ) : (
                <>
                  <div className={`track ${share >= 0.8 ? "hot" : share >= 0.5 ? "warn" : ""}`}>
                    <span style={{ width: count === 0 ? "0%" : `${Math.max(2, Math.min(100, share * 100))}%` }} />
                  </div>
                  <div className="cap-row">
                    <span className="mono">{compact(count)}/{caps.cap}</span>
                    <span className="muted">{compact(Math.max(0, caps.cap - count))} open</span>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </section>

      <div className="toolbar">
        <div className="filters" role="navigation" aria-label="Filter exclusions">
          {FILTERS.map((filter) => (
            <a key={filter.id} className={filter.id === status ? "on" : undefined} href={protectionHref(filter.id)}>
              {filter.label}
              <span className="count">{compact(counts[filter.id])}</span>
            </a>
          ))}
        </div>
      </div>

      <article className="card">
        {rows.length === 0 ? <p className="note">No exclusions in this view.</p> : null}
        {rows.length > 0 ? (
          <div className="click-list">
            <div className="click-head" aria-hidden>
              <span>Score</span>
              <span>Exclusion</span>
              <span>When</span>
              <span></span>
            </div>
            {rows.map((block) => {
              const reasons = reasonList(block.reason);
              const range = block.kind === "subnet";
              return (
                <article className="click" key={block.id}>
                  <div className={`click-score pill ${scoreBand(block.score)}`} aria-label={`Score ${block.score}`}>
                    {block.score}
                  </div>
                  <div>
                    <div className="click-title">
                      <strong className="mono">{block.target}</strong>
                      <span className="pill">{range ? "Range" : "Address"}</span>
                      <span className="muted">{block.campaign}</span>
                    </div>
                    <div className="reasons">
                      {reasons.length === 0 ? <span className="reason">No reason recorded</span> : null}
                      {reasons.map((reason) => (
                        <span className="reason" key={reason}>{reason}</span>
                      ))}
                      <span className="reason">{block.source === "manual" ? "Excluded by a person" : "Excluded automatically"}</span>
                    </div>
                  </div>
                  <div className="click-source">
                    <div className="muted">Added {when(block.created_at)}</div>
                    <div className="muted">Until {when(block.expires_at)}</div>
                  </div>
                  <div className="click-side">
                    {status === "active" ? (
                      <form action={unblock}>
                        <input type="hidden" name="id" value={block.id} />
                        <input type="hidden" name="return" value={here} />
                        <button className="ghost" type="submit">Release</button>
                      </form>
                    ) : (
                      <span className="pill">{FILTERS.find((filter) => filter.id === status)?.label}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        <div className="pager">
          <span className="muted">{from}–{to} of {total}</span>
          {page > 0 ? <a href={protectionHref(status, page - 1)}>Previous</a> : null}
          {page + 1 < pages ? <a href={protectionHref(status, page + 1)}>Next</a> : null}
        </div>
      </article>
    </div>
  );
}
