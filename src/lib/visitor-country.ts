import { headers } from "next/headers";
import { provinceName } from "./campaigns";
import { countryHeader, firstForwardedIp, isPublicIp, lookupIpSource } from "./ip-source";

const ZA_REGIONS: Record<string, string> = {
  EC: "Eastern Cape",
  FS: "Free State",
  GP: "Gauteng",
  KZN: "KwaZulu-Natal",
  LP: "Limpopo",
  MP: "Mpumalanga",
  NC: "Northern Cape",
  NW: "North West",
  WC: "Western Cape",
};

export type VisitorPlace = {
  country: string;
  name: string;
  city: string;
  region: string;
};

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return new Intl.DisplayNames("en", { type: "region" }).of(code) || code;
}

export function namedRegion(country: string, region: string): string {
  const clean = region.trim();
  const code = clean.toUpperCase();
  if (country === "ZA" && ZA_REGIONS[code]) return ZA_REGIONS[code];
  if (/^[A-Z0-9]{1,3}$/.test(code)) return "";
  return provinceName(clean);
}

export function visitPlaceLabel(place: Pick<VisitorPlace, "country" | "city" | "region">): string {
  const name = countryName(place.country);
  if (!name) return "";
  const local = place.city.trim() || namedRegion(place.country, place.region);
  return local ? `${local}, ${name}` : name;
}

function headerText(value: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).replace(/\s+/g, " ").slice(0, 80);
  } catch {
    return raw.replace(/\s+/g, " ").slice(0, 80);
  }
}

export async function visitorPlace(): Promise<VisitorPlace> {
  const headerList = await headers();
  const hinted = countryHeader(headerList.get("x-vercel-ip-country"));
  if (hinted) {
    return {
      country: hinted,
      name: countryName(hinted),
      city: headerText(headerList.get("x-vercel-ip-city")),
      region: headerText(headerList.get("x-vercel-ip-country-region")),
    };
  }
  const ip = firstForwardedIp(headerList.get("x-forwarded-for")) || headerList.get("x-real-ip")?.trim() || "";
  if (!isPublicIp(ip)) return { country: "", name: "", city: "", region: "" };
  const source = await lookupIpSource(ip);
  const country = source ? countryHeader(source.country) : "";
  return {
    country,
    name: countryName(country),
    city: source?.city || "",
    region: source?.region || "",
  };
}

export async function visitorCountry() {
  const place = await visitorPlace();
  return place.country;
}
