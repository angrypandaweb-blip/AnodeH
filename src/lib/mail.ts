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

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.MAIL_FROM || "";
  if (!key || !from) return { ok: false as const, error: "Add RESEND_API_KEY and MAIL_FROM, then redeploy." };
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
