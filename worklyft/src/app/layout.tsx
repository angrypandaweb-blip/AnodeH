import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { SITE_URL, site } from "@/lib/site";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WorkLyft · Crewlyft for business teams",
    template: "%s · WorkLyft",
  },
  description: site.description,
  applicationName: "WorkLyft",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "WorkLyft",
    url: SITE_URL,
    title: "WorkLyft",
    description: site.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkLyft",
    description: site.tagline,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
