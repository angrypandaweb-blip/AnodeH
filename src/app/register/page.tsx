import { RegisterForm } from "@/components/RegisterForm";
import { Mark } from "@/components/Mark";
import { safePlan } from "@/lib/auth";
import { INTRO_CENTS, SITES_10_CENTS, SITES_10_INTRO_CENTS, SITES_20_CENTS, SITES_20_INTRO_CENTS, STANDARD_CENTS, quotesFor } from "@/lib/billing";
import { allUsdRates, convertUsdCents, countryChoices, currencyForCountry, formatMoney, rateOrFallback } from "@/lib/residence-currency";
import { recaptchaSiteKey } from "@/lib/recaptcha";
import { pageMeta } from "@/lib/seo";
import { visitorIp, visitorPlace } from "@/lib/visitor-country";

export const dynamic = "force-dynamic";

export const metadata = pageMeta("/register");

function quote(cents: number, currency: string, rates: Record<string, number>) {
  const rate = rateOrFallback(currency, currency === "USD" ? 1 : rates[currency]);
  if (!rate) return { currency: "USD", text: formatMoney(convertUsdCents(cents, 1), "USD") };
  return { currency, text: formatMoney(convertUsdCents(cents, rate), currency) };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string }>;
}) {
  const params = await searchParams;
  const plan = safePlan(params.plan);
  const [place, ip] = await Promise.all([visitorPlace(), visitorIp()]);
  const back = plan ? `/register?plan=${plan}` : "/register";
  const countries = countryChoices();
  const rates = await allUsdRates();
  const quotes: Record<string, { currency: string; half: string; standard: string; half10: string; sites10: string; half20: string; sites20: string }> = {};
  for (const country of countries) {
    const currency = currencyForCountry(country.code);
    const half = quote(INTRO_CENTS, currency, rates);
    const standard = quote(STANDARD_CENTS, currency, rates);
    const half10 = quote(SITES_10_INTRO_CENTS, currency, rates);
    const sites10 = quote(SITES_10_CENTS, currency, rates);
    const half20 = quote(SITES_20_INTRO_CENTS, currency, rates);
    const sites20 = quote(SITES_20_CENTS, currency, rates);
    const priced = [half, standard, half10, sites10, half20, sites20];
    const same = priced.every((item) => item.currency === currency);
    quotes[country.code] = {
      currency: same ? currency : "USD",
      half: half.text,
      standard: standard.text,
      half10: half10.text,
      sites10: sites10.text,
      half20: half20.text,
      sites20: sites20.text,
    };
  }
  const seeded = (place.country && quotes[place.country]) || quotes.US || (await quotesFor("", place.country || "US"));
  const fallback = {
    currency: seeded.currency,
    half: seeded.half,
    standard: seeded.standard,
    half10: seeded.half10,
    sites10: seeded.sites10,
    half20: seeded.half20,
    sites20: seeded.sites20,
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
        <RegisterForm
          plan={plan}
          back={back}
          error={params.error}
          countries={countries}
          quotes={quotes}
          fallback={fallback}
          detectedCountry={place.country}
          detectedName={place.name}
          ip={ip}
          siteKey={recaptchaSiteKey()}
        />
      </section>
    </div>
  );
}
