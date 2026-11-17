import { RegisterForm } from "@/components/RegisterForm";
import { Mark } from "@/components/Mark";
import { safePlan } from "@/lib/auth";
import { ANNUAL_CENTS, dollars, SITES_10_CENTS, SITES_20_CENTS, STANDARD_CENTS } from "@/lib/billing";
import { allUsdRates, convertUsdCents, countryChoices, currencyForCountry, formatMoney } from "@/lib/residence-currency";

export const dynamic = "force-dynamic";

function quote(cents: number, currency: string, rates: Record<string, number>) {
  const rate = currency === "USD" ? 1 : rates[currency];
  if (!rate) return { currency: "USD", text: dollars(cents) };
  return { currency, text: formatMoney(convertUsdCents(cents, rate), currency) };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string }>;
}) {
  const params = await searchParams;
  const plan = safePlan(params.plan);
  const back = plan ? `/register?plan=${plan}` : "/register";
  const countries = countryChoices();
  const rates = await allUsdRates();
  const quotes: Record<string, { currency: string; intro: string; standard: string; annual: string; sites10: string; sites20: string }> = {};
  for (const country of countries) {
    const currency = currencyForCountry(country.code);
    const standard = quote(STANDARD_CENTS, currency, rates);
    const annual = quote(ANNUAL_CENTS, currency, rates);
    const sites10 = quote(SITES_10_CENTS, currency, rates);
    const sites20 = quote(SITES_20_CENTS, currency, rates);
    const same = [standard, annual, sites10, sites20].every((item) => item.currency === currency);
    quotes[country.code] = {
      currency: same ? currency : "USD",
      intro: "Free",
      standard: standard.text,
      annual: annual.text,
      sites10: sites10.text,
      sites20: sites20.text,
    };
  }
  const fallback = {
    currency: "USD",
    intro: "Free",
    standard: dollars(STANDARD_CENTS),
    annual: dollars(ANNUAL_CENTS),
    sites10: dollars(SITES_10_CENTS),
    sites20: dollars(SITES_20_CENTS),
  };

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/login">Log in</a>
          <a href="/support">Support</a>
        </nav>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 480 }}>
        <p className="kicker">Create an account</p>
        <h1>Create your account.</h1>
        <RegisterForm plan={plan} back={back} error={params.error} countries={countries} quotes={quotes} fallback={fallback} />
      </section>
    </div>
  );
}
