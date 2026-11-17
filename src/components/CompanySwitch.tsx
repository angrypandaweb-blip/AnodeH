"use client";

import { switchCompany } from "@/app/actions";

export function CompanySwitch({ companies, active }: { companies: { domain: string }[]; active: string }) {
  return (
    <form action={switchCompany} className="company-switch">
      <label>
        Company
        <select
          name="domain"
          defaultValue={active}
          aria-label="Company"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {companies.map((company) => (
            <option key={company.domain} value={company.domain}>{company.domain}</option>
          ))}
        </select>
      </label>
    </form>
  );
}
