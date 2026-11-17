import assert from "node:assert/strict";
import { home, searchPages } from "../src/lib/seo";

assert.equal(home.title.length <= 60, true, home.title);
for (const page of searchPages) {
  assert.ok(page.description.length >= 70 && page.description.length <= 160, `${page.path} ${page.description.length}`);
  const title = page.path === "/" ? page.title : `${page.title} · AnodeH`;
  assert.ok(title.length <= 70, title);
}

console.log("seo tests passed");
