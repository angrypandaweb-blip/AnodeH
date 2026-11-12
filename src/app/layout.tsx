import { Fraunces, Outfit } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Mark } from "@/components/Mark";
import { Nav } from "@/components/Nav";
import { logoutAccount } from "@/app/actions";
import { getUser } from "@/lib/auth";
import { getAccess, planSummary } from "@/lib/billing";
import { getPolicy } from "@/lib/engine";
import { unreadCount } from "@/lib/queries";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AnodeH",
  description: "Click fraud protection for paid traffic.",
  verification: {
    google: "jDX_WTdutPb1ZMxbs55K_XFQtc0xrytxYSfb4gW9bj0",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-pathname") || "/";
  const bare = path === "/" || path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password";
  if (bare) {
    return (
      <html lang="en">
        <body className={`${display.variable} ${sans.variable}`}>{children}</body>
      </html>
    );
  }
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  const access = await getAccess();
  if (access.status === "unpaid" && path !== "/billing" && !path.startsWith("/billing/")) {
    redirect("/billing");
  }
  const plan = planSummary(access);
  const policy = await getPolicy();
  const unread = await unreadCount();
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <div className="app">
          <aside className="sidebar">
            <a className="brand" href="/dashboard">
              <Mark />
              <span>
                <span className="brand-name">AnodeH</span>
                <small>{policy.domain}</small>
              </span>
            </a>
            <Nav unread={unread} />
            <a className="plan-link" href="/billing">
              <strong>{plan.title}</strong>
              <span>{plan.detail}</span>
            </a>
            <p className="side-foot">
              <strong>{user.name}</strong>
              {user.email}
            </p>
            <form action={logoutAccount}>
              <button className="btn ghost" type="submit">Log out</button>
            </form>
            <p className="side-foot">
              <strong>Google Ads</strong>
              {user.adsAccount ? (
                <>
                  {user.adsAccount}
                  <br />
                  This is the account AnodeH is watching.
                </>
              ) : (
                <a href="/settings">Add the account number you want to track</a>
              )}
            </p>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
