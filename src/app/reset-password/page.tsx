import { resetPassword } from "@/app/actions";
import { Mark } from "@/components/Mark";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token || "";

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
        <p className="kicker">New password</p>
        <h1>Set a password for this account.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>Use at least 8 characters. The old password stops working, including on other signed-in browsers.</p>
        {params.error ? <p className="banner warn">{params.error}</p> : null}
        {token ? (
          <form action={resetPassword} className="form-grid">
            <input type="hidden" name="token" value={token} />
            <label>
              New password
              <input type="password" name="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="btn" type="submit">Save password</button>
          </form>
        ) : (
          <p className="note"><a href="/forgot-password">Request a new reset link.</a></p>
        )}
      </section>
    </div>
  );
}
