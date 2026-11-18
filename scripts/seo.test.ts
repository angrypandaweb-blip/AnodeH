import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { home, homeJsonLd, LOGO, searchPages, SITE } from "../src/lib/seo";

assert.equal(home.title.length <= 60, true, home.title);
for (const page of searchPages) {
  assert.ok(page.description.length >= 70 && page.description.length <= 160, `${page.path} ${page.description.length}`);
  const title = page.path === "/" ? page.title : `${page.title} · AnodeH`;
  assert.ok(title.length <= 70, title);
}

assert.equal(LOGO, `${SITE}/logo.png`);
assert.equal(existsSync("public/logo.png"), true);
assert.equal(existsSync("public/favicon-48.png"), true);
assert.equal(existsSync("src/app/icon.png"), true);
assert.equal(existsSync("src/app/opengraph-image.png"), true);

const graph = homeJsonLd()["@graph"] as Array<Record<string, unknown>>;
const org = graph.find((item) => item["@type"] === "Organization") as { logo?: { url?: string } };
assert.equal(org?.logo?.url, LOGO);

console.log("seo tests passed");
