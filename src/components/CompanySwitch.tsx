"use client";

import { switchCompany } from "@/app/actions";

export function CompanySwitch({
  companies,
  active,
  spread = false,
}: {
  companies: { domain: string; adsAccount: string }[];
  active: string;
  spread?: boolean;
}) {
  return (
    <div className={spread ? "company-list spread" : "company-list"}>
      <p>Companies</p>
      {companies.map((company) => (
        <form key={company.domain} action={switchCompany}>
          <input type="hidden" name="domain" value={company.domain} />
          <button type="submit" className={company.domain === active ? "active" : undefined} aria-current={company.domain === active ? "true" : undefined}>
            <strong>{company.domain}</strong>
            <small>{company.adsAccount || "No Ads account yet"}</small>
          </button>
        </form>
      ))}
    </div>
  );
}
