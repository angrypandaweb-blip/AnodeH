import { Fraunces, Outfit } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Assistant } from "@/components/Assistant";
import { CompanySwitch } from "@/components/CompanySwitch";
import { GoogleTag } from "@/components/GoogleTag";
import { Mark } from "@/components/Mark";
import { Nav } from "@/components/Nav";
import { logoutAccount } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { loadCompanies } from "@/lib/companies";
import { getAccess, planSummary, quotesFor } from "@/lib/billing";
import { getPolicy } from "@/lib/engine";
import { sendDueDailyReport, sendWelcomeSampleOnce } from "@/lib/email-reports";
import { unreadCount } from "@/lib/queries";
import { home } from "@/lib/seo";
import { visitorIp } from "@/lib/visitor-country";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });

export const dynamic = "force-dynamic";

export const metadata = {
  metadataBase: new URL("https://anodeh.com"),
  title: { default: "AnodeH", template: "%s · AnodeH" },
  description: home.description,
  applicationName: "AnodeH",
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "AnodeH",
    url: "https://anodeh.com",
    title: home.title,
    description: home.description,
  },
  twitter: {
    card: "summary_large_image",
    title: home.title,
    description: home.description,
  },
  robots: { index: true, follow: true },
  verification: {
    google: "jDX_WTdutPb1ZMxbs55K_XFQtc0xrytxYSfb4gW9bj0",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await sendWelcomeSampleOnce().catch(() => undefined);
  const path = (await headers()).get("x-pathname") || "/";
  const bare = path === "/" || path === "/blocked" || path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password" || path === "/privacy" || path === "/terms" || path === "/support";
  if (bare) {
    return (
      <html lang="en">
        <body className={`${display.variable} ${sans.variable}`}>
          <GoogleTag />
          {children}
          <Assistant />
          <script src="https://anodeh.com/cf.js" data-key="cf_502ff663e79ffa28" async />
        </body>
      </html>
    );
  }
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  await sendDueDailyReport(user.id).catch(() => undefined);
  const access = await getAccess();
  if (access.status === "unpaid" && path !== "/billing" && path !== "/thank-you" && !path.startsWith("/billing/")) {
    redirect("/billing");
  }
  const plan = planSummary(access, await quotesFor(user.email, user.country));
  const policy = await getPolicy();
  const unread = await unreadCount();
  const companies = access.sites > 1 ? await loadCompanies(user.id) : null;
  const openCompany = companies?.companies.find((company) => company.domain === companies.active);
  const watching = openCompany ? openCompany.adsAccount : user.adsAccount;
  const brandDomain = openCompany?.domain || policy.domain;
  const ip = await visitorIp();
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <div className="app">
          <aside className="sidebar">
            <a className="brand" href="/dashboard">
              <Mark />
              <span>
                <span className="brand-name">AnodeH</span>
                <small>{brandDomain}</small>
                {ip ? <small className="mono">{ip}</small> : null}
              </span>
            </a>
            {companies && companies.companies.length > 0 ? (
              <CompanySwitch companies={companies.companies} active={companies.active} />
            ) : null}
            {companies ? <p className="company-empty"><a href="/settings#add-company">Add a company</a></p> : null}
            <Nav unread={unread} />
          </aside>
          <main className="main">{children}</main>
          <footer className="account-foot">
            <a className="plan-link" href="/billing">
              <strong>{plan.title}</strong>
              <span>{plan.detail}</span>
            </a>
            <p className="side-foot">
              <strong>{user.name}</strong>
              {user.email}
            </p>
            <p className="side-foot">
              <strong>Google Ads</strong>
              {watching ? (
                <>
                  {watching}
                  <br />
                  This is the account AnodeH is watching.
                </>
              ) : (
                <a href="/settings">Add the account number you want to track</a>
              )}
            </p>
            <p className="side-foot">
              <a href="/support">Support</a>
            </p>
            <form action={logoutAccount}>
              <button className="btn ghost" type="submit">Log out</button>
            </form>
          </footer>
        </div>
        <GoogleTag />
        <Assistant />
        <script src="https://anodeh.com/cf.js" data-key="cf_502ff663e79ffa28" async />
      </body>
    </html>
  );
}
