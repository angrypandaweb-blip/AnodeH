import assert from "node:assert/strict";

async function main() {
  process.env.GOOGLE_CLIENT_ID = "client";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  const { googleAdsConfigured, googleAdsSetupError } = await import("../src/lib/google-ads");

  assert.equal(googleAdsSetupError(), null);
  assert.equal(googleAdsConfigured(), true);

  delete process.env.GOOGLE_CLIENT_SECRET;
  assert.match(googleAdsSetupError() || "", /GOOGLE_CLIENT_SECRET/);
  assert.equal(googleAdsConfigured(), false);

  console.log("google ads setup tests passed");
}

main();
