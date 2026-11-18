"use client";

import { useState } from "react";
import { registerAccount } from "@/app/actions";
import { Recaptcha } from "@/components/Recaptcha";

type Quote = {
  currency: string;
  half: string;
  standard: string;
  half10: string;
  sites10: string;
  half20: string;
  sites20: string;
};

export function RegisterForm({
  plan,
  back,
  error,
  countries,
  quotes,
  fallback,
  detectedCountry,
  detectedName,
  ip,
  siteKey,
}: {
  plan: "" | "month" | "sites10" | "sites20";
  back: string;
  error?: string;
  countries: { code: string; name: string }[];
  quotes: Record<string, Quote>;
  fallback: Quote;
  detectedCountry: string;
  detectedName: string;
  ip: string;
  siteKey: string;
}) {
  const known = countries.some((item) => item.code === detectedCountry) ? detectedCountry : "";
  const [country, setCountry] = useState(known);
  const price = quotes[country] || fallback;
  const paypal = price.currency === "USD" ? "" : " PayPal collects the US dollar price.";
  const copy = plan === "month"
    ? `1 website. Free for 7 days, then ${price.standard} every 30 days. PayPal starts the trial and charges automatically after it ends.${paypal} The plan page opens after the account is created.`
    : plan === "sites10"
      ? `10 websites. ${price.half10} for the first 30 days, then ${price.sites10} every 30 days. PayPal deducts that automatically.${paypal} After payment, the other websites are added in Settings.`
      : plan === "sites20"
        ? `20 websites. ${price.half20} for the first 30 days, then ${price.sites20} every 30 days. PayPal deducts that automatically.${paypal} After payment, the other websites are added in Settings.`
        : "Create an account and the scored clicks, exclusions, and settings are on the next page.";

  return (
    <>
      <p className="lede" style={{ marginLeft: 0 }}>{copy}</p>
      {ip || detectedName ? (
        <p className="note">
          {ip ? <>Your IP address is <span className="mono">{ip}</span>. </> : null}
          {detectedName ? <>This IP is in {detectedName}, so the prices start in that country&apos;s currency.</> : null}
        </p>
      ) : null}
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
        <Recaptcha siteKey={siteKey} />
        <button className="btn" type="submit">Create account</button>
      </form>
    </>
  );
}
