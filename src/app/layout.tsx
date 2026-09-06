import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import { frenchLanguageAlternates, publicSiteOrigin } from "@/lib/seoContent";
import { websiteJsonLd } from "@/lib/seoJsonLd";
import "./globals.css";

const homeTitle = "Observatoire Planète — histoire météo de la France";
const homeDescription =
  "Recherchez une commune et une date. Températures, pluie, records et sources, en langage simple.";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin()),
  title: homeTitle,
  description: homeDescription,
  alternates: frenchLanguageAlternates("/")
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <JsonLd data={websiteJsonLd()} />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
