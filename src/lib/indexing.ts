import { submitSitemapToGoogleSearchConsole } from "@/lib/google-search-console";
import { SITE } from "@/lib/seo";

/** Public IndexNow ownership key (also hosted at /{key}.txt). */
export const INDEXNOW_KEY = "de3d3e277b34a911643b10a07c969585";

export type IndexSubmitResult =
  | { ok: true; engine: string; status: number }
  | { ok: false; engine: string; error: string; status?: number };

function hostFromSite() {
  return new URL(SITE).host;
}

function keyLocation() {
  return `${SITE}/${INDEXNOW_KEY}.txt`;
}

/** Notify IndexNow engines (Bing and others). Google does not use IndexNow. */
export async function submitIndexNow(urls: string[]): Promise<IndexSubmitResult> {
  const unique = [...new Set(urls.filter((url) => url.startsWith(SITE)))];
  if (unique.length === 0) {
    return { ok: false, engine: "indexnow", error: "No site URLs to submit." };
  }

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: hostFromSite(),
        key: INDEXNOW_KEY,
        keyLocation: keyLocation(),
        urlList: unique,
      }),
    });

    // IndexNow may return 200 or 202; some engines also return 204.
    if (response.ok || response.status === 202) {
      return { ok: true, engine: "indexnow", status: response.status };
    }

    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      engine: "indexnow",
      status: response.status,
      error: detail.slice(0, 200) || `IndexNow returned ${response.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      engine: "indexnow",
      error: error instanceof Error ? error.message : "IndexNow request failed.",
    };
  }
}

/** After a blog post goes live, notify IndexNow and resubmit the Google sitemap. */
export async function notifyPublishedUrls(postUrl: string) {
  const urls = [postUrl, `${SITE}/blog`, `${SITE}/sitemap.xml`];
  const [indexNow, googleSitemap] = await Promise.all([
    submitIndexNow(urls),
    submitSitemapToGoogleSearchConsole(),
  ]);
  return { indexNow, googleSitemap, urls };
}

/** Daily: tell Google Search Console the sitemap is current, and ping IndexNow for the sitemap. */
export async function notifyDailySitemap() {
  const urls = [`${SITE}/`, `${SITE}/blog`, `${SITE}/sitemap.xml`];
  const [googleSitemap, indexNow] = await Promise.all([
    submitSitemapToGoogleSearchConsole(),
    submitIndexNow(urls),
  ]);
  return { googleSitemap, indexNow, urls };
}
