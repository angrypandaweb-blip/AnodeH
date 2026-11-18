import { disconnectSpamMailboxAction, saveSpamMailboxAction, scoreSpamPaste, syncSpamMailboxAction } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { planDate } from "@/lib/billing";
import { getSpamMailbox, listSpamMessages } from "@/lib/spam-mail";
import { reasonText, SPAM_REASON_LABELS } from "@/lib/spam-score";
import { noIndex } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = noIndex;

function pillClass(action: string) {
  if (action === "block") return "stop";
  if (action === "flag") return "watch";
  return "ok";
}

export default async function SpamPage({
  searchParams,
}: {
  searchParams: Promise<{
    scored?: string;
    score?: string;
    action?: string;
    saved?: string;
    synced?: string;
    n?: string;
    moved?: string;
    alerted?: string;
    disconnected?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getUser();
  const [messages, mailbox] = await Promise.all([
    user ? listSpamMessages(user.id) : Promise.resolve([]),
    user ? getSpamMailbox(user.id) : Promise.resolve(null),
  ]);
  const risky = messages.filter((item) => item.action !== "allow");

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">Spam email</p>
          <h1>Watch the inbox the same way you watch clicks</h1>
          <p className="sub">
            Paste a suspicious message for an instant score, or connect a mailbox so AnodeH can sync recent mail, move flagged and blocked messages to Junk, and email you an alert.
          </p>
        </div>
      </header>

      {params.error ? <p className="banner warn">{params.error}</p> : null}
      {params.scored ? (
        <p className="banner">
          Scored {params.score}/100 · {params.action === "block" ? "Likely spam" : params.action === "flag" ? "Worth a look" : "Looks ordinary"}
          {params.action === "flag" || params.action === "block" ? " · An alert was sent to your account email." : ""}
        </p>
      ) : null}
      {params.saved ? <p className="banner">Mailbox saved. Sync it to pull recent messages.</p> : null}
      {params.synced ? (
        <p className="banner">
          Synced. {params.n || 0} scored · {params.moved || 0} moved to Junk · {params.alerted || 0} owner alerts
        </p>
      ) : null}
      {params.disconnected ? <p className="banner">Mailbox disconnected.</p> : null}

      <section className="metrics">
        <article className="metric">
          <span>Scored</span>
          <strong>{messages.length}</strong>
          <em>Kept in this account</em>
        </article>
        <article className="metric">
          <span>Flagged or blocked</span>
          <strong>{risky.length}</strong>
          <em>Worth reading first</em>
        </article>
        <article className="metric">
          <span>Mailbox</span>
          <strong>{mailbox ? "On" : "Off"}</strong>
          <em>{mailbox?.syncedAt ? `Last sync ${planDate(mailbox.syncedAt)}` : "Connect IMAP to monitor"}</em>
        </article>
      </section>

      <article className="card">
        <span className="card-label">Score a message</span>
        <p className="note">Paste the From line, subject, and body. AnodeH looks for urgency, money asks, brand spoofs, bad links, and reply mismatches.</p>
        <form action={scoreSpamPaste} className="form-grid">
          <label>
            From
            <input type="text" name="from" placeholder="PayPal Support &lt;help@random-domain.com&gt;" required />
          </label>
          <label>
            Reply-To (optional)
            <input type="text" name="replyTo" placeholder="other@example.com" />
          </label>
          <label>
            Subject
            <input type="text" name="subject" placeholder="Your account will be suspended" required />
          </label>
          <label>
            Body
            <textarea name="body" rows={7} placeholder="Paste the email text here…" required />
          </label>
          <div>
            <button type="submit">Score email</button>
          </div>
        </form>
      </article>

      <article className="card">
        <span className="card-label">Monitor a mailbox</span>
        <p className="note">
          Use IMAP (Afrihost: mail.yourdomain.co.za, port 993, full email + mailbox password). On sync, flagged and blocked messages are moved to Junk and you get an email alert. Gmail works with an app password on imap.gmail.com:993.
        </p>
        {mailbox ? (
          <>
            <p className="note">
              Connected to <strong>{mailbox.user}</strong> on {mailbox.host}:{mailbox.port}
              {mailbox.lastError ? `. Last error: ${mailbox.lastError}` : "."}
            </p>
            <div className="hero-actions">
              <form action={syncSpamMailboxAction}>
                <button type="submit">Sync now</button>
              </form>
              <form action={disconnectSpamMailboxAction}>
                <button className="ghost" type="submit">Disconnect</button>
              </form>
            </div>
          </>
        ) : (
          <form action={saveSpamMailboxAction} className="form-grid">
            <label>
              IMAP host
              <input type="text" name="host" placeholder="imap.gmail.com" required />
            </label>
            <label>
              Port
              <input type="number" name="port" defaultValue={993} required />
            </label>
            <label>
              Username
              <input type="email" name="user" placeholder="you@gmail.com" required />
            </label>
            <label>
              App password
              <input type="password" name="password" autoComplete="new-password" required />
            </label>
            <input type="hidden" name="secure" value="1" />
            <div>
              <button type="submit">Connect mailbox</button>
            </div>
          </form>
        )}
      </article>

      <article className="card">
        <span className="card-label">Latest scored mail</span>
        {messages.length === 0 ? <p className="note">No messages scored yet.</p> : null}
        {messages.length > 0 ? (
          <div className="click-list clicks-3">
            <div className="click-head" aria-hidden>
              <span>When</span>
              <span>From / subject</span>
              <span>Score</span>
            </div>
            {messages.map((item) => (
              <div className="click-row" key={item.id}>
                <div>
                  <strong>{planDate(item.receivedAt)}</strong>
                  <div className="muted">{item.source === "imap" ? "Mailbox" : "Pasted"}</div>
                </div>
                <div>
                  <strong>{item.subject || "(no subject)"}</strong>
                  <div className="muted">{item.fromAddr}</div>
                  <div className="muted">{item.snippet}</div>
                  <div className="muted">{reasonText(item.reasons)}</div>
                  <div className="muted">
                    {item.junkedAt ? "Moved to Junk" : item.source === "imap" && item.action !== "allow" ? "Still in inbox" : ""}
                    {item.alertedAt ? (item.junkedAt ? " · Owner alerted" : "Owner alerted") : ""}
                  </div>
                </div>
                <div>
                  <span className={`pill ${pillClass(item.action)}`}>{item.score}</span>
                  <div className="muted">{item.action}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <article className="card">
        <span className="card-label">What gets scored</span>
        <ul className="note">
          {Object.values(SPAM_REASON_LABELS).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
