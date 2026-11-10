import { loginAccount } from "@/app/actions";
import { Mark } from "@/components/Mark";
import { safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/register">Register</a>
        </nav>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 480 }}>
        <p className="kicker">Log in</p>
        <h1>Back to the dashboard.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>Use the email and password from the account you created.</p>
        {params.reset ? <p className="banner">Password updated. Log in with the new one.</p> : null}
        {params.error ? <p className="banner warn">{params.error}</p> : null}
        <form action={loginAccount} className="form-grid">
          <input type="hidden" name="return" value={`/login?next=${encodeURIComponent(next)}`} />
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <p className="form-extra"><a href="/forgot-password">Forgot password</a></p>
          <button className="btn" type="submit">Log in</button>
        </form>
      </section>
    </div>
  );
}
