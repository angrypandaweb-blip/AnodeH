import { SITE } from "@/lib/seo";

export type SitemapSubmitResult =
  | { ok: true; site: string; sitemap: string; skipped?: false }
  | { ok: true; site: string; sitemap: string; skipped: true; reason: string }
  | { ok: false; error: string; status?: number };

const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

export function googleSearchConsoleSite() {
  const configured = (process.env.GOOGLE_SEARCH_CONSOLE_SITE || "").trim();
  if (configured) return configured.endsWith("/") || configured.startsWith("sc-domain:") ? configured : `${configured}/`;
  return `${SITE}/`;
}

export function googleSitemapUrl() {
  return `${SITE}/sitemap.xml`;
}

export function googleSearchConsoleConfigured() {
  return Boolean(
    (process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN || "").trim() &&
      (process.env.GOOGLE_CLIENT_ID || "").trim() &&
      (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
  );
}

async function gscAccessToken(): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const refreshToken = (process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN || "").trim();
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  if (!refreshToken || !clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "Add GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN plus GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel, then redeploy.",
    };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  } | null;
  if (!response.ok || !payload?.access_token) {
    return {
      ok: false,
      error: payload?.error_description || payload?.error || "Google did not return a Search Console access token.",
    };
  }
  return { ok: true, accessToken: payload.access_token };
}

/** Submit / resubmit the live sitemap to Google Search Console. */
export async function submitSitemapToGoogleSearchConsole(): Promise<SitemapSubmitResult> {
  const site = googleSearchConsoleSite();
  const sitemap = googleSitemapUrl();

  if (!googleSearchConsoleConfigured()) {
    return {
      ok: true,
      skipped: true,
      site,
      sitemap,
      reason:
        "Add GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN (webmasters scope) with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then redeploy.",
    };
  }

  const token = await gscAccessToken();
  if (!token.ok) return { ok: false, error: token.error };

  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemap)}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      error: detail.slice(0, 300) || `Search Console returned ${response.status}.`,
    };
  }

  return { ok: true, site, sitemap };
}

export const __test = { WEBMASTERS_SCOPE, googleSearchConsoleSite, googleSitemapUrl };
