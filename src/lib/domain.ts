export function trackedDomain(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
  if (host.length < 4 || host.length > 253) return "";
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) return "";
  return host;
}

export function coveredDomains(primary: string, stored: string | undefined): string[] {
  const parsed: string[] = [];
  if (stored) {
    try {
      const value = JSON.parse(stored) as unknown;
      if (Array.isArray(value)) {
        for (const item of value) {
          const domain = trackedDomain(String(item));
          if (domain && !parsed.includes(domain)) parsed.push(domain);
        }
      }
    } catch {
      parsed.length = 0;
    }
  }
  const first = trackedDomain(primary);
  const domains = first ? [first, ...parsed.filter((domain) => domain !== first)] : parsed;
  return domains;
}
