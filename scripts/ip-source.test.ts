import assert from "node:assert/strict";
import { countryHeader, firstForwardedIp, isPublicIp, isPublicIpv4, readIpSource } from "../src/lib/ip-source";

const source = readIpSource({
  success: true,
  country_code: "za",
  city: "Johannesburg",
  connection: { isp: "AFRIHOST SP PTY LTD", org: "AFRIHOST SP PTY LTD" },
});
assert.equal(source?.country, "ZA");
assert.equal(source?.isp, "AFRIHOST SP PTY LTD");
assert.equal(source?.city, "Johannesburg");
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

console.log("ip source tests passed");
