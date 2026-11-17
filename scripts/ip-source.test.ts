import assert from "node:assert/strict";
import { assistantReply } from "../src/lib/assistant";
import { provinceName, visitCampaignName } from "../src/lib/campaigns";
import { scoreTone } from "../src/lib/format";
import { actionForChannel } from "../src/lib/score";
import { countryHeader, firstForwardedIp, isPublicIp, isPublicIpv4, publicIpv4, publicVisitorIp, readIpSource } from "../src/lib/ip-source";

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
assert.match(assistantReply("How much is the plan?").text, /\$34\.50/);
assert.match(assistantReply("How much is the plan?").text, /\$69/);
assert.match(assistantReply("How much is the plan?").text, /\$94\.50/);
assert.match(assistantReply("How much is the plan?").text, /\$189/);
assert.match(assistantReply("How much is the plan?").text, /\$144\.50/);
assert.match(assistantReply("How much is the plan?").text, /\$289/);
assert.doesNotMatch(assistantReply("How much is the plan?").text, /\$759/);
assert.doesNotMatch(assistantReply("How much is the plan?").text, /free for 7 days/);
const shopify = assistantReply("How do I paste the script on Shopify?");
assert.match(shopify.text, /theme\.liquid/);
assert.match(shopify.text, /WordPress/);
assert.match(shopify.text, /Google Tag Manager/);
assert.equal(shopify.links[0]?.href, "/settings");
assert.match(assistantReply("Where does this go on Wix?").text, /Custom code/);
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
assert.equal(publicIpv4("102.182.56.44, 10.0.0.1"), "102.182.56.44");
assert.equal(publicIpv4("::ffff:102.182.56.44"), "102.182.56.44");
assert.equal(publicIpv4("10.0.0.1"), "");
assert.equal(publicIpv4("2001:4860:4860::8888"), "");
assert.equal(publicVisitorIp("102.182.56.44, 10.0.0.1", "127.0.0.1"), "102.182.56.44");
assert.equal(publicVisitorIp("10.0.0.1", "2001:4860:4860::8888"), "2001:4860:4860::8888");
assert.equal(publicVisitorIp("127.0.0.1", "::1"), "");
assert.equal(countryHeader("za"), "ZA");
assert.equal(countryHeader("XX"), "");
function hue(score: number) {
  return Number(scoreTone(score).background.match(/hsl\((\d+)/)?.[1]);
}
assert.ok(hue(0) > hue(28) && hue(28) > hue(45) && hue(45) > hue(80));
assert.equal(scoreTone(90).color, "#ffffff");
assert.notEqual(scoreTone(28).color, "#ffffff");

console.log("ip source tests passed");
