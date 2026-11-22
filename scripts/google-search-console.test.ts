import assert from "node:assert/strict";
import {
  __test,
  googleSearchConsoleConfigured,
  submitSitemapToGoogleSearchConsole,
} from "../src/lib/google-search-console";
import { SITE } from "../src/lib/seo";

async function main() {
  assert.equal(__test.googleSitemapUrl(), `${SITE}/sitemap.xml`);
  assert.equal(__test.googleSearchConsoleSite(), `${SITE}/`);
  assert.equal(googleSearchConsoleConfigured(), false);

  const skipped = await submitSitemapToGoogleSearchConsole();
  assert.equal(skipped.ok, true);
  assert.equal("skipped" in skipped && skipped.skipped === true, true);

  process.env.GOOGLE_CLIENT_ID = "client";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN = "refresh";
  process.env.GOOGLE_SEARCH_CONSOLE_SITE = "sc-domain:anodeh.com";
  assert.equal(googleSearchConsoleConfigured(), true);
  assert.equal(__test.googleSearchConsoleSite(), "sc-domain:anodeh.com");

  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method?: string }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method });
    if (url.includes("oauth2.googleapis.com/token")) {
      return Response.json({ access_token: "access-token" });
    }
    if (url.includes("webmasters/v3/sites/")) {
      assert.match(url, /sc-domain%3Aanodeh\.com/);
      assert.match(url, /sitemap\.xml/);
      assert.equal(init?.method, "PUT");
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.Authorization, "Bearer access-token");
      return new Response(null, { status: 200 });
    }
    return new Response("unexpected", { status: 500 });
  }) as typeof fetch;

  const submitted = await submitSitemapToGoogleSearchConsole();
  assert.equal(submitted.ok, true);
  assert.equal("skipped" in submitted ? submitted.skipped : false, false);
  assert.equal(calls.length, 2);

  globalThis.fetch = originalFetch;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN;
  delete process.env.GOOGLE_SEARCH_CONSOLE_SITE;

  console.log("google-search-console tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
