export function recaptchaSiteKey() {
  return (process.env.RECAPTCHA_SITE_KEY || "").trim();
}

export function recaptchaMode(site = recaptchaSiteKey(), secret = (process.env.RECAPTCHA_SECRET_KEY || "").trim()) {
  if (site && secret) return "on" as const;
  if (!site && !secret) return "off" as const;
  return "broken" as const;
}

export function recaptchaPassed(payload: { success?: boolean } | null) {
  return payload?.success === true;
}

export async function recaptchaError(token: string) {
  const mode = recaptchaMode();
  if (mode === "off") return "";
  if (mode === "broken") return "The form check is not ready. Try again shortly.";
  if (!token.trim()) return "Confirm you are not a robot, then try again.";
  const body = new URLSearchParams({
    secret: (process.env.RECAPTCHA_SECRET_KEY || "").trim(),
    response: token,
  });
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(4000),
    });
    const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
    if (!response.ok || !recaptchaPassed(payload)) return "Confirm you are not a robot, then try again.";
    return "";
  } catch {
    return "The form check did not answer. Try again.";
  }
}
