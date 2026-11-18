import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ImapFlow } from "imapflow";
import { execute, getDb, queryAll, queryOne } from "./db";
import { evaluateSpam, extractEmailAddress, extractLinks, reasonText, type SpamAction } from "./spam-score";

export type SpamMessage = {
  id: string;
  source: string;
  fromAddr: string;
  subject: string;
  snippet: string;
  score: number;
  action: SpamAction;
  reasons: string[];
  receivedAt: number;
  scoredAt: number;
};

export type SpamMailbox = {
  host: string;
  port: number;
  user: string;
  secure: boolean;
  syncedAt: number;
  lastError: string;
};

type MailboxRow = {
  host: string;
  port: number;
  username: string;
  secret: string;
  secure: number;
  synced_at: number;
  last_error: string;
};

type MessageRow = {
  id: string;
  source: string;
  from_addr: string;
  subject: string;
  snippet: string;
  score: number;
  action: string;
  reasons: string;
  received_at: number;
  scored_at: number;
};

function secretKey() {
  const raw = process.env.SPAM_MAILBOX_SECRET || process.env.CRON_SECRET || "anodeh-dev-spam-key";
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  const [ivPart, tagPart, dataPart] = value.split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Mailbox secret is damaged.");
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}

function mapMessage(row: MessageRow): SpamMessage {
  return {
    id: row.id,
    source: row.source,
    fromAddr: row.from_addr,
    subject: row.subject,
    snippet: row.snippet,
    score: row.score,
    action: row.action as SpamAction,
    reasons: row.reasons ? row.reasons.split("|").filter(Boolean) : [],
    receivedAt: row.received_at,
    scoredAt: row.scored_at,
  };
}

export async function listSpamMessages(userId: string, limit = 40): Promise<SpamMessage[]> {
  const db = await getDb();
  const rows = await queryAll<MessageRow>(
    db,
    "SELECT id, source, from_addr, subject, snippet, score, action, reasons, received_at, scored_at FROM spam_messages WHERE user_id = ? ORDER BY received_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapMessage);
}

export async function getSpamMailbox(userId: string): Promise<SpamMailbox | null> {
  const db = await getDb();
  const row = await queryOne<MailboxRow>(
    db,
    "SELECT host, port, username, secret, secure, synced_at, last_error FROM spam_mailboxes WHERE user_id = ?",
    [userId],
  );
  if (!row) return null;
  return {
    host: row.host,
    port: row.port,
    user: row.username,
    secure: row.secure === 1,
    syncedAt: row.synced_at,
    lastError: row.last_error,
  };
}

export async function saveSpamMailbox(
  userId: string,
  input: { host: string; port: number; user: string; password: string; secure: boolean },
) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await execute(
    db,
    `INSERT INTO spam_mailboxes (user_id, host, port, username, secret, secure, synced_at, last_error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, '', ?)
     ON CONFLICT(user_id) DO UPDATE SET
       host = excluded.host,
       port = excluded.port,
       username = excluded.username,
       secret = excluded.secret,
       secure = excluded.secure,
       last_error = '',
       created_at = spam_mailboxes.created_at`,
    [userId, input.host, input.port, input.user, encryptSecret(input.password), input.secure ? 1 : 0, now],
  );
}

export async function disconnectSpamMailbox(userId: string) {
  const db = await getDb();
  await execute(db, "DELETE FROM spam_mailboxes WHERE user_id = ?", [userId]);
}

async function upsertMessage(
  userId: string,
  input: {
    id: string;
    source: string;
    from: string;
    subject: string;
    body: string;
    replyTo?: string;
    receivedAt: number;
  },
) {
  const verdict = evaluateSpam({
    from: input.from,
    subject: input.subject,
    body: input.body,
    replyTo: input.replyTo,
    links: extractLinks(`${input.subject}\n${input.body}`),
  });
  const snippet = input.body.replace(/\s+/g, " ").trim().slice(0, 220);
  const scoredAt = Math.floor(Date.now() / 1000);
  const db = await getDb();
  await execute(
    db,
    `INSERT INTO spam_messages (id, user_id, source, from_addr, subject, snippet, body, score, action, reasons, received_at, scored_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       score = excluded.score,
       action = excluded.action,
       reasons = excluded.reasons,
       snippet = excluded.snippet,
       body = excluded.body,
       scored_at = excluded.scored_at`,
    [
      input.id,
      userId,
      input.source,
      extractEmailAddress(input.from) || input.from,
      input.subject.slice(0, 240),
      snippet,
      input.body.slice(0, 20000),
      verdict.score,
      verdict.action,
      verdict.reasons.join("|"),
      input.receivedAt,
      scoredAt,
    ],
  );
  return { ...verdict, reasonLabel: reasonText(verdict.reasons) };
}

export async function scorePastedEmail(
  userId: string,
  input: { from: string; subject: string; body: string; replyTo?: string },
) {
  const id = `paste_${createHash("sha256").update(`${userId}|${input.from}|${input.subject}|${input.body}`).digest("hex").slice(0, 24)}`;
  return upsertMessage(userId, {
    id,
    source: "paste",
    from: input.from,
    subject: input.subject,
    body: input.body,
    replyTo: input.replyTo,
    receivedAt: Math.floor(Date.now() / 1000),
  });
}

function headerValue(raw: string, name: string) {
  const match = raw.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() || "";
}

export async function syncSpamMailbox(userId: string): Promise<{ ok: true; checked: number; saved: number } | { ok: false; error: string }> {
  const db = await getDb();
  const row = await queryOne<MailboxRow>(
    db,
    "SELECT host, port, username, secret, secure, synced_at, last_error FROM spam_mailboxes WHERE user_id = ?",
    [userId],
  );
  if (!row) return { ok: false, error: "Connect a mailbox first." };

  let password = "";
  try {
    password = decryptSecret(row.secret);
  } catch {
    return { ok: false, error: "Saved mailbox password could not be read. Connect the mailbox again." };
  }

  const client = new ImapFlow({
    host: row.host,
    port: row.port,
    secure: row.secure === 1,
    auth: { user: row.username, pass: password },
    logger: false,
  });

  let checked = 0;
  let saved = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const uids = await client.search({ since }, { uid: true });
      const list = Array.isArray(uids) ? uids.slice(-40) : [];
      for (const uid of list) {
        checked += 1;
        const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
        if (!message || typeof message === "boolean") continue;
        const envelope = message.envelope;
        const from =
          envelope?.from
            ?.map((item: { name?: string; address?: string }) => (item.name ? `${item.name} <${item.address}>` : item.address || ""))
            .join(", ") || "";
        const subject = envelope?.subject || "(no subject)";
        const raw = message.source ? message.source.toString("utf8") : "";
        const body = raw.replace(/\r\n/g, "\n").split(/\n\n/).slice(1).join("\n\n").slice(0, 20000) || subject;
        const replyTo =
          headerValue(raw, "Reply-To") ||
          envelope?.replyTo
            ?.map((item: { address?: string }) => item.address || "")
            .filter(Boolean)
            .join(", ");
        const receivedAt = envelope?.date ? Math.floor(new Date(envelope.date).getTime() / 1000) : Math.floor(Date.now() / 1000);
        const id = `imap_${createHash("sha256").update(`${userId}|${row.username}|${uid}|${subject}`).digest("hex").slice(0, 24)}`;
        await upsertMessage(userId, {
          id,
          source: "imap",
          from,
          subject,
          body,
          replyTo,
          receivedAt,
        });
        saved += 1;
      }
    } finally {
      lock.release();
    }
    await client.logout();
    await execute(db, "UPDATE spam_mailboxes SET synced_at = ?, last_error = '' WHERE user_id = ?", [
      Math.floor(Date.now() / 1000),
      userId,
    ]);
    return { ok: true, checked, saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mailbox sync failed.";
    await execute(db, "UPDATE spam_mailboxes SET last_error = ? WHERE user_id = ?", [message.slice(0, 300), userId]);
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    return { ok: false, error: message };
  }
}

export async function syncAllSpamMailboxes() {
  const db = await getDb();
  const people = await queryAll<{ user_id: string }>(db, "SELECT user_id FROM spam_mailboxes");
  let ok = 0;
  let failed = 0;
  for (const person of people) {
    const result = await syncSpamMailbox(person.user_id);
    if (result.ok) ok += 1;
    else failed += 1;
  }
  return { ok, failed, total: people.length };
}
