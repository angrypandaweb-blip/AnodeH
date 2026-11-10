import { requestPasswordReset } from "@/app/actions";
import { Mark } from "@/components/Mark";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

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
        <p className="kicker">Forgot password</p>
        <h1>Choose a new password.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>Enter the email on the account. The next page lets you set a new password.</p>
        {params.error ? <p className="banner warn">{params.error}</p> : null}
        <form action={requestPasswordReset} className="form-grid">
          <input type="hidden" name="return" value="/forgot-password" />
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <button className="btn" type="submit">Continue</button>
        </form>
      </section>
    </div>
  );
}
