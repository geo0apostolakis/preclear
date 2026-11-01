import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site, chain, isReal } from "@/config";
import Chrome from "@/components/Chrome";
import Footer from "@/components/Footer";
import StoreProvider from "@/components/StoreProvider";

const display = Geist({ subsets: ["latin"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const title = `${site.name} | ${chain.name}`;
const description = isReal(site.positioning)
  ? site.positioning
  : `${site.name} on ${chain.name} (chain id ${chain.id}).`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${site.name}` },
  description,
  applicationName: site.name,
  openGraph: { type: "website", url: site.url, siteName: site.name, title, description },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="antialiased">
        <StoreProvider>
          <div className="flex min-h-screen flex-col">
            <Chrome />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
