import { registerAccount } from "@/app/actions";
import { Mark } from "@/components/Mark";
import { safePlan } from "@/lib/auth";
import { ANNUAL_CENTS, dollars, INTRO_CENTS, STANDARD_CENTS } from "@/lib/billing";

export const dynamic = "force-dynamic";

const PLAN_COPY = {
  month: `Monthly plan. ${dollars(INTRO_CENTS)} for the first 30 days, then ${dollars(STANDARD_CENTS)} every 30 days. Billing opens after the account is created.`,
  year: `Annual plan. ${dollars(ANNUAL_CENTS)} for 365 days, with no renewal. Billing opens after the account is created.`,
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string }>;
}) {
  const params = await searchParams;
  const plan = safePlan(params.plan);
  const back = plan ? `/register?plan=${plan}` : "/register";

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/#account">Log in</a>
        </nav>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 480 }}>
        <p className="kicker">Create an account</p>
        <h1>Billing is next.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>
          {plan ? PLAN_COPY[plan] : "Create an account. The billing page opens next, where you choose monthly or annual."}
        </p>
        {params.error ? <p className="banner warn">{params.error}</p> : null}
        <form action={registerAccount} className="form-grid">
          <input type="hidden" name="return" value={back} />
          {plan ? <input type="hidden" name="plan" value={plan} /> : null}
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
            Google Ads account number
            <input type="text" name="adsAccount" inputMode="numeric" autoComplete="off" placeholder="123-456-7890" required />
          </label>
          <p className="note">The 10-digit customer ID of the Google Ads account you want to keep track of.</p>
          <button className="btn" type="submit">Create account</button>
        </form>
      </section>
    </div>
  );
}
