"use client";

import { useState } from "react";
import { registerAccount } from "@/app/actions";

type Quote = { currency: string; intro: string; standard: string; annual: string };

export function RegisterForm({
  plan,
  back,
  error,
  countries,
  quotes,
  fallback,
}: {
  plan: "" | "month" | "year";
  back: string;
  error?: string;
  countries: { code: string; name: string }[];
  quotes: Record<string, Quote>;
  fallback: Quote;
}) {
  const [country, setCountry] = useState("");
  const price = quotes[country] || fallback;
  const paypal = price.currency === "USD" ? "" : " PayPal collects the US dollar price.";
  const copy = plan === "month"
    ? `Monthly plan. 7 days free, then ${price.standard} every 30 days. PayPal deducts that automatically.${paypal} The plan page opens after the account is created.`
    : plan === "year"
      ? `Annual plan. ${price.annual} for 365 days, with no renewal.${paypal} The plan page opens after the account is created.`
      : "Create an account and the scored clicks, exclusions, and settings are on the next page.";

  return (
    <>
      <p className="lede" style={{ marginLeft: 0 }}>{copy}</p>
      {error ? <p className="banner warn">{error}</p> : null}
      <form action={registerAccount} className="form-grid">
        <input type="hidden" name="return" value={back} />
        <input type="hidden" name="plan" value={plan} />
        <label>
          Name
          <input type="text" name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Country
          <select name="country" autoComplete="country" required value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="" disabled>Choose a country</option>
            {countries.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Domain to track
          <input type="text" name="domain" placeholder="example.com" autoComplete="url" required />
          <small>The site where you will paste the AnodeH tag.</small>
        </label>
        <button className="btn" type="submit">Create account</button>
      </form>
    </>
  );
}
