import assert from "node:assert/strict";
import { activeCompany, companyList, parseCompanies } from "../src/lib/companies";

const stored = JSON.stringify([
  { domain: "https://www.Shop.example.com/path", adsAccount: "1234567890" },
  { domain: "other.co.za", adsAccount: "bad" },
  { domain: "shop.example.com", adsAccount: "999-999-9999" },
]);

const companies = parseCompanies(stored);
assert.deepEqual(companies, [
  { domain: "shop.example.com", adsAccount: "123-456-7890", clickPrice: "" },
  { domain: "other.co.za", adsAccount: "", clickPrice: "" },
]);

assert.equal(activeCompany(companies, "other.co.za"), "other.co.za");
assert.equal(activeCompany(companies, "missing.com"), "shop.example.com");

const savedSite = parseCompanies(JSON.stringify([{ domain: "anodeh.com", adsAccount: "5618283221" }]));
assert.deepEqual(savedSite, [{ domain: "anodeh.com", adsAccount: "561-828-3221", clickPrice: "" }]);

const priced = parseCompanies(JSON.stringify([{ domain: "hungrypanda.co.za", adsAccount: "9537148890", clickPrice: "15.50" }]));
assert.equal(priced[0]?.clickPrice, "15.5");

const legacy = companyList(undefined, "First.com", JSON.stringify(["second.com", "anodeh.com"]), "111-222-3333");
assert.deepEqual(legacy, [
  { domain: "first.com", adsAccount: "111-222-3333", clickPrice: "" },
  { domain: "second.com", adsAccount: "", clickPrice: "" },
]);

console.log("company tests passed");
