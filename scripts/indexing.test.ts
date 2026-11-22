import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { INDEXNOW_KEY, submitIndexNow } from "../src/lib/indexing";
import { SITE } from "../src/lib/seo";

async function main() {
  assert.equal(INDEXNOW_KEY.length >= 8, true);
  assert.equal(existsSync(`public/${INDEXNOW_KEY}.txt`), true);
  assert.equal(readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8").trim(), INDEXNOW_KEY);

  const empty = await submitIndexNow(["https://example.com/nope"]);
  assert.equal(empty.ok, false);

  const originalFetch = globalThis.fetch;
  let sawBody: unknown;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    sawBody = JSON.parse(String(init?.body || "{}"));
    return new Response("", { status: 200 });
  }) as typeof fetch;

  const result = await submitIndexNow([`${SITE}/blog/demo`, `${SITE}/blog`]);
  assert.equal(result.ok, true);
  assert.deepEqual(sawBody, {
    host: "anodeh.com",
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
    urlList: [`${SITE}/blog/demo`, `${SITE}/blog`],
  });

  globalThis.fetch = originalFetch;
  console.log("indexing tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
