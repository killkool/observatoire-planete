import type { Metadata } from "next";
import ObservatoryHome from "@/components/ObservatoryHome";
import { buildHomeOgModel, shareHomeCardPath } from "@/lib/landingOg";
import { getFeaturedClimateCached } from "@/lib/sqliteReadCache";

const homeTitle = "Observatoire Planète — histoire météo de la France";
const homeDescription =
  "Recherchez une commune et une date. Températures, pluie, records et sources, en langage simple.";

export async function generateMetadata(): Promise<Metadata> {
  const climate = buildHomeOgModel();
  const image = shareHomeCardPath();
  const imageAlt = climate?.exampleLine ?? "Histoire météo de la France";
  return {
    openGraph: {
      title: homeTitle,
      description: homeDescription,
      locale: "fr_FR",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }]
    },
    twitter: {
      card: "summary_large_image",
      title: homeTitle,
      description: homeDescription,
      images: [image]
    }
  };
}

export default async function Home() {
  return <ObservatoryHome cards={await getFeaturedClimateCached()} />;
}
