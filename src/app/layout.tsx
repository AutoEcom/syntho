import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/components/layout/site-footer";
import { TopNav } from "@/components/layout/top-nav";
import { AppProviders } from "@/components/providers";
import { data } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://syntho.cc"),
  title: {
    default: "Syntho — Autonomous trading intelligence on the Internet Computer",
    template: "%s · Syntho",
  },
  description:
    "Autonomous trading intelligence native to the Internet Computer. Transparent performance, predictable compute, institutional-grade risk telemetry.",
  applicationName: "Syntho",
  openGraph: {
    type: "website",
    url: "https://syntho.cc",
    siteName: "Syntho",
    title: "Syntho — Autonomous trading intelligence on the Internet Computer",
    description:
      "Transparent performance. Predictable compute. Institutional-grade risk telemetry.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Syntho",
    description:
      "Autonomous trading intelligence native to the Internet Computer.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0f",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const asOf = await data.getAsOf();

  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <TopNav />
            <main className="flex-1">{children}</main>
            <SiteFooter asOf={asOf} />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
