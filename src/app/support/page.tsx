import { Mark } from "@/components/Mark";
import { submitSupport } from "@/app/actions";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support · AnodeH",
  description: "Send a support request to AnodeH.",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getUser();

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href={user ? "/dashboard" : "/login"}>{user ? "Account" : "Log in"}</a>
        </nav>
      </header>
      <section className="hero" style={{ textAlign: "left", maxWidth: 560 }}>
        <p className="kicker">Support</p>
        <h1>Tell us what you need.</h1>
        <p className="lede" style={{ marginLeft: 0 }}>
          The request goes to support@anodeh.com. Include the site you want the tag on, and we will reply to the email you enter.
        </p>
        {params.sent ? <p className="banner">Sent. A reply will come to the email you entered.</p> : null}
        {params.error ? <p className="banner warn">{params.error}</p> : null}
        <form action={submitSupport} className="form-grid" style={{ marginTop: 18 }}>
          <label className="hp">
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
          <label>
            Name
            <input type="text" name="name" defaultValue={user?.name || ""} required maxLength={80} />
          </label>
          <label>
            Email
            <input type="email" name="email" defaultValue={user?.email || ""} autoComplete="email" required />
          </label>
          <label>
            How can we help?
            <textarea name="message" rows={6} required minLength={10} maxLength={4000} placeholder="I need help adding the site tag." />
          </label>
          <div>
            <button type="submit">Send request</button>
          </div>
        </form>
      </section>
    </div>
  );
}
