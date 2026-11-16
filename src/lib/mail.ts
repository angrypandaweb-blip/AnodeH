export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

export function normalizeFrom(raw: string) {
  const value = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!match) return "";
  const email = match[0];
  const name = value.replace(email, "").replace(/[<>"']/g, "").trim();
  return name ? `${name} <${email}>` : email;
}

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY || "";
  const from = normalizeFrom(process.env.MAIL_FROM || "");
  if (!key || !process.env.MAIL_FROM) return { ok: false as const, error: "Add RESEND_API_KEY and MAIL_FROM, then redeploy." };
  if (!from) return { ok: false as const, error: "MAIL_FROM must be an email address, like AnodeH <reports@anodeh.com>." };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    return { ok: false as const, error: payload?.message || "The email service refused the message." };
  }
  return { ok: true as const };
}
