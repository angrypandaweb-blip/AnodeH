import assert from "node:assert/strict";

async function main() {
  process.env.GOOGLE_CLIENT_ID = "client";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  const { googleAdsConfigured, googleAdsSetupError } = await import("../src/lib/google-ads.ts");

  assert.equal(googleAdsConfigured(), false);
  assert.match(googleAdsSetupError() || "", /GOOGLE_ADS_DEVELOPER_TOKEN/);

  process.env.GOOGLE_ADS_DEVELOPER_TOKEN = " sample-token ";
  assert.equal(googleAdsSetupError(), null);
  assert.equal(googleAdsConfigured(), true);

  console.log("google ads setup tests passed");
}

main();
