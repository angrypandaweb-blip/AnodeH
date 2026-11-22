export type FacebookPostResult =
  | { ok: true; id: string; skipped?: false }
  | { ok: true; id: ""; skipped: true; reason: string }
  | { ok: false; error: string };

export function facebookConfigured() {
  return Boolean(process.env.FACEBOOK_PAGE_ID?.trim() && process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim());
}

/** Publish a link post to the AnodeH Facebook Page via Graph API. */
export async function postToFacebookPage(input: {
  message: string;
  link: string;
}): Promise<FacebookPostResult> {
  const pageId = (process.env.FACEBOOK_PAGE_ID || "").trim();
  const token = (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "").trim();
  if (!pageId || !token) {
    return {
      ok: true,
      id: "",
      skipped: true,
      reason: "Add FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN, then redeploy.",
    };
  }

  const body = new URLSearchParams({
    message: input.message,
    link: input.link,
    access_token: token,
  });

  const response = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.id) {
    return {
      ok: false,
      error: payload?.error?.message || "Facebook refused the page post.",
    };
  }

  return { ok: true, id: payload.id };
}
