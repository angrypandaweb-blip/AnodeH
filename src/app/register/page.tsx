import { RegisterForm } from "@/components/RegisterForm";
import { Mark } from "@/components/Mark";
import { safePlan } from "@/lib/auth";
import { ANNUAL_CENTS, dollars, STANDARD_CENTS } from "@/lib/billing";
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
  const quotes: Record<string, { currency: string; intro: string; standard: string; annual: string }> = {};
  for (const country of countries) {
    const currency = currencyForCountry(country.code);
    const standard = quote(STANDARD_CENTS, currency, rates);
    const annual = quote(ANNUAL_CENTS, currency, rates);
    const same = standard.currency === currency && annual.currency === currency;
    quotes[country.code] = {
      currency: same ? currency : "USD",
      intro: "Free",
      standard: standard.text,
      annual: annual.text,
    };
  }
  const fallback = {
    currency: "USD",
    intro: "Free",
    standard: dollars(STANDARD_CENTS),
    annual: dollars(ANNUAL_CENTS),
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
        </nav>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 480 }}>
        <p className="kicker">Create an account</p>
        <h1>Open the dashboard.</h1>
        <RegisterForm plan={plan} back={back} error={params.error} countries={countries} quotes={quotes} fallback={fallback} />
      </section>
    </div>
  );
}
