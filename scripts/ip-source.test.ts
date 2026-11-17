import assert from "node:assert/strict";
import { assistantReply } from "../src/lib/assistant";
import { provinceName, visitCampaignName } from "../src/lib/campaigns";
import { scoreTone } from "../src/lib/format";
import { actionForChannel } from "../src/lib/score";
import { countryHeader, firstForwardedIp, isPublicIp, isPublicIpv4, readIpSource } from "../src/lib/ip-source";

const source = readIpSource({
  success: true,
  country_code: "za",
  city: "Johannesburg",
  region: "Gauteng",
  connection: { isp: "AFRIHOST SP PTY LTD", org: "AFRIHOST SP PTY LTD" },
});
assert.equal(source?.country, "ZA");
assert.equal(source?.isp, "AFRIHOST SP PTY LTD");
assert.equal(source?.city, "Johannesburg");
assert.equal(source?.region, "Gauteng");
assert.equal(provinceName("Kwazulu-Natal"), "KwaZulu-Natal");
assert.equal(visitCampaignName("", "Gauteng"), "Gauteng");
assert.equal(visitCampaignName("", "Kwazulu-Natal"), "KwaZulu-Natal");
assert.equal(visitCampaignName("Brand — Exact", "Gauteng"), "Brand — Exact");
assert.equal(visitCampaignName("  ", ""), "Unassigned");
assert.equal(actionForChannel("block", "organic"), "flag");
assert.equal(actionForChannel("block", "paid"), "block");
assert.equal(actionForChannel("flag", "organic"), "flag");
assert.match(assistantReply("Do you block organic searches?").text, /not blocked/);
assert.match(assistantReply("How much is the plan?").text, /free for 7 days/);
assert.match(assistantReply("How much is the plan?").text, /\$69/);
assert.match(assistantReply("I need support with the tag").text, /support@anodeh.com/);
assert.equal(assistantReply("I need support with the tag").links[0]?.href, "/support");
assert.equal(assistantReply("   ").links.length, 0);
assert.equal(readIpSource({ success: false, message: "reserved range" }), null);
assert.equal(readIpSource({ success: true, connection: { org: "Fallback Org" } }), null);

assert.equal(isPublicIpv4("102.182.56.44"), true);
assert.equal(isPublicIpv4("127.0.0.1"), false);
assert.equal(isPublicIpv4("10.1.1.1"), false);
assert.equal(isPublicIpv4("192.168.0.4"), false);
assert.equal(isPublicIp("2001:4860:4860::8888"), true);
assert.equal(isPublicIp("::1"), false);
assert.equal(firstForwardedIp("102.182.56.44, 10.0.0.1"), "102.182.56.44");
assert.equal(countryHeader("za"), "ZA");
assert.equal(countryHeader("XX"), "");
function hue(score: number) {
  return Number(scoreTone(score).background.match(/hsl\((\d+)/)?.[1]);
}
assert.ok(hue(0) > hue(28) && hue(28) > hue(45) && hue(45) > hue(80));
assert.equal(scoreTone(90).color, "#ffffff");
assert.notEqual(scoreTone(28).color, "#ffffff");

console.log("ip source tests passed");
