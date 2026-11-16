import { execute, getDb, queryAll, queryOne } from "./db";
import { escapeHtml, mailConfigured, sendMail } from "./mail";
import { formatMoney, reportCurrency } from "./residence-currency";

const APP = "https://anodeh.com";

export type PurchaseReceipt = {
  userId: string;
  paymentId: string;
  amountCents: number;
  periodEnd: number;
  planName: string;
};

type Person = { id: string; email: string; name: string };

export function previousJohannesburgDay(now = Date.now()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  const startToday = Date.parse(`${today}T00:00:00+02:00`);
  const start = Math.floor(startToday / 1000) - 86400;
  const end = Math.floor(startToday / 1000);
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(start * 1000));
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(start * 1000));
  return { start, end, key, label };
}

function dollars(cents: number) {
  const amount = cents / 100;
  return `$${cents % 100 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

function paidThrough(ts: number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts * 1000));
}

async function people() {
  return queryAll<Person>(
    await getDb(),
    "SELECT id, email, name FROM users WHERE email LIKE '%@%' AND lower(email) NOT LIKE '%@example.com' ORDER BY created_at",
  );
}

async function alreadySent(kind: string, ref: string) {
  const row = await queryOne<{ id: string }>(await getDb(), "SELECT id FROM email_log WHERE kind = ? AND ref = ?", [kind, ref]);
  return Boolean(row);
}

async function markSent(userId: string, kind: string, ref: string) {
  await execute(await getDb(), "INSERT INTO email_log (id, user_id, kind, ref, sent_at) VALUES (?, ?, ?, ?, ?)", [
    `${kind}:${ref}`,
    userId,
    kind,
    ref,
    Math.floor(Date.now() / 1000),
  ]);
}

export async function sendPurchaseReceipt(receipt: PurchaseReceipt) {
  if (!mailConfigured()) return { ok: false as const, error: "Email is not configured." };
  if (await alreadySent("purchase", receipt.paymentId)) return { ok: true as const, skipped: true };
  const user = await queryOne<Person>(await getDb(), "SELECT id, email, name FROM users WHERE id = ?", [receipt.userId]);
  if (!user || !user.email.includes("@") || user.email.toLowerCase().endsWith("@example.com")) {
    return { ok: false as const, error: "This account has no deliverable email." };
  }
  const amount = dollars(receipt.amountCents);
  const through = paidThrough(receipt.periodEnd);
  const subject = "Your AnodeH payment was received";
  const text = [
    `Hello ${user.name},`,
    "",
    `PayPal confirmed your ${receipt.planName} payment of ${amount}.`,
    `This workspace is covered through ${through}.`,
    "",
    `Open the dashboard: ${APP}/dashboard`,
    "",
    "AnodeH",
  ].join("\n");
  const html = `<p>Hello ${escapeHtml(user.name)},</p>
<p>PayPal confirmed your ${escapeHtml(receipt.planName)} payment of <strong>${escapeHtml(amount)}</strong>.</p>
<p>This workspace is covered through ${escapeHtml(through)}.</p>
<p><a href="${APP}/dashboard">Open the dashboard</a></p>
<p>AnodeH</p>`;
  const sent = await sendMail(user.email, subject, text, html);
  if (!sent.ok) return sent;
  await markSent(user.id, "purchase", receipt.paymentId);
  return { ok: true as const };
}

async function clickSummary(userId: string, start: number, end: number) {
  const totals = await queryOne<{ clicks: number; invalid: number | null; spend: number | null; waste: number | null }>(
    await getDb(),
    `SELECT COUNT(*) AS clicks,
            SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid,
            SUM(cost) AS spend,
            SUM(CASE WHEN action != 'allow' THEN cost ELSE 0 END) AS waste
     FROM clicks WHERE user_id = ? AND ts >= ? AND ts < ?`,
    [userId, start, end],
  );
  const campaigns = await queryAll<{ campaign: string; c: number }>(
    await getDb(),
    `SELECT campaign, COUNT(*) AS c FROM clicks
     WHERE user_id = ? AND ts >= ? AND ts < ?
     GROUP BY campaign ORDER BY c DESC LIMIT 5`,
    [userId, start, end],
  );
  const google = await queryOne<{ c: number }>(
    await getDb(),
    "SELECT COUNT(*) AS c FROM google_clicks WHERE user_id = ? AND ts >= ? AND ts < ?",
    [userId, start, end],
  );
  return {
    clicks: totals?.clicks ?? 0,
    invalid: totals?.invalid ?? 0,
    spend: totals?.spend ?? 0,
    waste: totals?.waste ?? 0,
    campaigns,
    googleClicks: google?.c ?? 0,
  };
}

function johannesburgHour(now: number) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date(now));
  return Number(hour);
}

async function rememberMailError(userId: string, error: string) {
  await execute(
    await getDb(),
    "INSERT INTO user_settings (user_id, key, value) VALUES (?, 'mail_last_error', ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
    [userId, error.slice(0, 300)],
  );
}

async function clearMailError(userId: string) {
  await execute(await getDb(), "DELETE FROM user_settings WHERE user_id = ? AND key = 'mail_last_error'", [userId]);
}

export async function lastMailError(userId: string) {
  const row = await queryOne<{ value: string }>(
    await getDb(),
    "SELECT value FROM user_settings WHERE user_id = ? AND key = 'mail_last_error'",
    [userId],
  );
  return row?.value || "";
}

async function sendDailyReportTo(user: Person, day: ReturnType<typeof previousJohannesburgDay>, force = false) {
  const ref = `${user.id}:${day.key}`;
  if (!force && (await alreadySent("daily", ref))) return { ok: true as const, skipped: true };
  if (force) {
    await execute(await getDb(), "DELETE FROM email_log WHERE kind = 'daily' AND ref = ?", [ref]);
  }
  const summary = await clickSummary(user.id, day.start, day.end);
  const local = await reportCurrency(user.email);
  const spendText = formatMoney(summary.spend * local.rate, local.currency);
  const wasteText = formatMoney(summary.waste * local.rate, local.currency);
  const currencyNote = local.currency === "USD" ? "" : `Amounts are in ${local.name}, for where this account is based.`;
  const campaignLines = summary.campaigns.map((row) => `${row.campaign}: ${row.c}`);
  const lines = [
    `Hello ${user.name},`,
    "",
    `Dashboard clicks for ${day.label}:`,
    `${summary.clicks} clicks`,
    `${summary.invalid} flagged or blocked`,
    `${spendText} monitored`,
    `${wasteText} invalid cost`,
  ];
  if (summary.googleClicks) lines.push(`${summary.googleClicks} clicks downloaded from Google Ads`);
  lines.push(
    "",
    campaignLines.length ? "Campaigns:" : "No clicks were recorded on this day.",
    ...campaignLines,
    "",
    `Open the dashboard: ${APP}/dashboard`,
    "",
    ...(currencyNote ? [currencyNote, ""] : []),
    "This report is sent every morning at 7:00am SAST.",
    "AnodeH",
  );
  const text = lines.join("\n");
  const campaignHtml = campaignLines.length
    ? `<ul>${campaignLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "<p>No clicks were recorded on this day.</p>";
  const html = `<p>Hello ${escapeHtml(user.name)},</p>
<p>Dashboard clicks for ${escapeHtml(day.label)}:</p>
<ul>
<li>${summary.clicks} clicks</li>
<li>${summary.invalid} flagged or blocked</li>
<li>${escapeHtml(spendText)} monitored</li>
<li>${escapeHtml(wasteText)} invalid cost</li>
${summary.googleClicks ? `<li>${summary.googleClicks} clicks downloaded from Google Ads</li>` : ""}
</ul>
${campaignHtml}
<p><a href="${APP}/dashboard">Open the dashboard</a></p>
${currencyNote ? `<p>${escapeHtml(currencyNote)}</p>` : ""}
<p>This report is sent every morning at 7:00am SAST.</p>`;
  const result = await sendMail(user.email, `AnodeH clicks for ${day.label}`, text, html);
  if (!result.ok) {
    await rememberMailError(user.id, result.error);
    return result;
  }
  await markSent(user.id, "daily", ref);
  await clearMailError(user.id);
  return { ok: true as const, skipped: false };
}

export async function sendDailyReports(now = Date.now()) {
  if (!mailConfigured()) return { ok: false as const, error: "Email is not configured.", sent: 0 };
  const day = previousJohannesburgDay(now);
  let sent = 0;
  let error = "";
  for (const user of await people()) {
    const result = await sendDailyReportTo(user, day);
    if (!result.ok) {
      error = result.error;
      continue;
    }
    if (!result.skipped) sent += 1;
  }
  if (sent === 0 && error) return { ok: false as const, error, sent };
  return { ok: true as const, sent };
}

export async function resendDailyReport(email: string, now = Date.now()) {
  if (!mailConfigured()) return { ok: false as const, error: "Email is not configured.", sent: 0 };
  const user = await queryOne<Person>(await getDb(), "SELECT id, email, name FROM users WHERE lower(email) = ?", [email.trim().toLowerCase()]);
  if (!user) return { ok: false as const, error: "Account not found.", sent: 0 };
  const result = await sendDailyReportTo(user, previousJohannesburgDay(now), true);
  if (!result.ok) return { ok: false as const, error: result.error, sent: 0 };
  return { ok: true as const, sent: result.skipped ? 0 : 1 };
}

export async function sendDueDailyReport(userId: string, now = Date.now()) {
  if (johannesburgHour(now) < 7) return { ok: true as const, sent: 0 };
  if (!mailConfigured()) {
    const error = "Email is not configured.";
    await rememberMailError(userId, error);
    return { ok: false as const, error, sent: 0 };
  }
  const user = await queryOne<Person>(await getDb(), "SELECT id, email, name FROM users WHERE id = ?", [userId]);
  if (!user || !user.email.includes("@") || user.email.toLowerCase().endsWith("@example.com")) {
    return { ok: true as const, sent: 0 };
  }
  const result = await sendDailyReportTo(user, previousJohannesburgDay(now));
  if (!result.ok) return { ok: false as const, error: result.error, sent: 0 };
  return { ok: true as const, sent: result.skipped ? 0 : 1 };
}

export async function sendBuildNotices() {
  if (!mailConfigured()) return { ok: false as const, error: "Email is not configured.", sent: 0 };
  let sent = 0;
  for (const user of await people()) {
    if (await alreadySent("build-notice", user.id)) continue;
    const subject = "AnodeH will email your receipt and a daily click report";
    const text = [
      `Hello ${user.name},`,
      "",
      "Two emails are now part of your AnodeH account.",
      "",
      "When PayPal confirms a payment, AnodeH sends a receipt with the amount and the date the workspace is covered through.",
      "Each morning at 7:00am SAST, AnodeH sends the previous day's dashboard clicks: the total, how many were flagged or blocked, the cost, and the campaigns.",
      "",
      `Open the dashboard: ${APP}/dashboard`,
      "",
      "AnodeH",
    ].join("\n");
    const html = `<p>Hello ${escapeHtml(user.name)},</p>
<p>Two emails are now part of your AnodeH account.</p>
<p>When PayPal confirms a payment, AnodeH sends a receipt with the amount and the date the workspace is covered through.</p>
<p>Each morning at 7:00am SAST, AnodeH sends the previous day's dashboard clicks: the total, how many were flagged or blocked, the cost, and the campaigns.</p>
<p><a href="${APP}/dashboard">Open the dashboard</a></p>`;
    const result = await sendMail(user.email, subject, text, html);
    if (!result.ok) continue;
    await markSent(user.id, "build-notice", user.id);
    sent += 1;
  }
  return { ok: true as const, sent };
}

export async function sendMissingReceipts() {
  if (!mailConfigured()) return { ok: false as const, sent: 0 };
  const rows = await queryAll<{ id: string; user_id: string; amount: number; period_end: number }>(
    await getDb(),
    `SELECT p.id, p.user_id, p.amount, p.period_end
     FROM payments p
     LEFT JOIN email_log e ON e.kind = 'purchase' AND e.ref = p.id
     WHERE e.id IS NULL AND p.user_id != ''`,
  );
  let sent = 0;
  for (const row of rows) {
    const result = await sendPurchaseReceipt({
      userId: row.user_id,
      paymentId: row.id,
      amountCents: row.amount,
      periodEnd: row.period_end,
      planName: row.amount === 3450 ? "First 30 days" : row.amount === 75900 ? "1 year" : "30 days",
    });
    if (result.ok) sent += 1;
  }
  return { ok: true as const, sent };
}

export async function runDailyMail(now = Date.now()) {
  const notices = await sendBuildNotices();
  const receipts = await sendMissingReceipts();
  const reports = await sendDailyReports(now);
  if (!reports.ok) return { ok: false as const, error: reports.error };
  return {
    ok: true as const,
    notices: notices.sent,
    receipts: receipts.sent,
    reports: reports.ok ? reports.sent : 0,
  };
}
