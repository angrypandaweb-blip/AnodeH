import assert from "node:assert/strict";
import { activeCompany, companyList, parseCompanies } from "../src/lib/companies";

const stored = JSON.stringify([
  { domain: "https://www.Shop.example.com/path", adsAccount: "1234567890" },
  { domain: "other.co.za", adsAccount: "bad" },
  { domain: "shop.example.com", adsAccount: "999-999-9999" },
]);

const companies = parseCompanies(stored);
assert.deepEqual(companies, [
  { domain: "shop.example.com", adsAccount: "123-456-7890" },
  { domain: "other.co.za", adsAccount: "" },
]);

assert.equal(activeCompany(companies, "other.co.za"), "other.co.za");
assert.equal(activeCompany(companies, "missing.com"), "shop.example.com");

const legacy = companyList(undefined, "First.com", JSON.stringify(["second.com", "anodeh.com"]), "111-222-3333");
assert.deepEqual(legacy, [
  { domain: "first.com", adsAccount: "111-222-3333" },
  { domain: "second.com", adsAccount: "" },
]);

console.log("company tests passed");
