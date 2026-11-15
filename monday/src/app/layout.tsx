import type { Metadata, Viewport } from "next";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/600-italic.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import { TabBar } from "@/components/TabBar";
import { viewer } from "@/lib/viewer";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monday",
  description: "Add ideas during the week. Every Monday, give each one a person and a due date until the app launches.",
  applicationName: "Monday",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Monday", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#241c16",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const current = await viewer();
  return (
    <html lang="en">
      <body>
        <div className="phone">
          {!current || current === "key" ? (
            <main className="sheet">
              <p className="kicker">Monday</p>
              <h1>{current === "key" ? "Open it as a person" : "Sign in to take part"}</h1>
              <p className="lede">
                {current === "key"
                  ? "An API key cannot add an idea or take a task. Open Monday in the browser while you are signed in."
                  : "Every idea and every task keeps the name of a person. Open Monday while you are signed in."}
              </p>
            </main>
          ) : (
            <>
              {children}
              <TabBar name={current.name.trim() || "Teammate"} />
            </>
          )}
        </div>
      </body>
    </html>
  );
}
