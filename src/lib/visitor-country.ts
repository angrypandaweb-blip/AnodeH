import { headers } from "next/headers";
import { countryHeader, firstForwardedIp, isPublicIp, lookupIpSource } from "./ip-source";

export async function visitorCountry() {
  const headerList = await headers();
  const hinted = countryHeader(headerList.get("x-vercel-ip-country"));
  if (hinted) return hinted;
  const ip = firstForwardedIp(headerList.get("x-forwarded-for")) || headerList.get("x-real-ip")?.trim() || "";
  if (!isPublicIp(ip)) return "";
  const source = await lookupIpSource(ip);
  return source ? countryHeader(source.country) : "";
}
