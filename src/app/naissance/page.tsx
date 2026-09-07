import type { Metadata } from "next";
import Image from "next/image";
import BirthExamples from "@/components/BirthExamples";
import PlaceSearch from "@/components/PlaceSearch";
import { shareBirthLandingCardPath } from "@/lib/landingOg";
import { frenchLanguageAlternates } from "@/lib/seoContent";
import { getBirthExamplesCached } from "@/lib/sqliteReadCache";

const birthTitle = "Jour de naissance — Observatoire Planète";
const birthDescription =
  "Quel temps faisait-il le jour de votre naissance ? Mesure officielle s’il y en a une, jamais une valeur inventée.";
const birthImage = shareBirthLandingCardPath();

export const metadata: Metadata = {
  title: birthTitle,
  description: birthDescription,
  alternates: frenchLanguageAlternates("/naissance"),
  openGraph: {
    title: birthTitle,
    description: birthDescription,
    locale: "fr_FR",
    type: "website",
    images: [{ url: birthImage, width: 1200, height: 630, alt: "Exemple : Grenoble, jour de naissance" }]
  },
  twitter: {
    card: "summary_large_image",
    title: birthTitle,
    description: birthDescription,
    images: [birthImage]
  }
};

export default async function NaissancePage() {
  const examples = await getBirthExamplesCached();
  return (
    <main className="homeVisual">
      <section className="earthHero">
        <Image
          src="/images/hero-earth.jpg"
          alt=""
          fill
          priority
          quality={70}
          decoding="sync"
          sizes="(max-width: 650px) 100vw, 1480px"
        />
        <div className="earthHeroContent">
          <p className="eyebrow">JOUR DE NAISSANCE</p>
          <h1>
            Quel temps faisait-il
            <span> ce jour-là</span>
          </h1>
          <p>
            Une commune, une date. S’il existe une mesure officielle, elle s’affiche. S’il n’y en a pas : non
            disponible — jamais une température inventée. Sur la page suivante, si la série le permet, on compare
            aussi les années de l’enfance aux années récentes — sans inventer ni mélanger les stations.
          </p>
          <PlaceSearch
            autoFocus
            requireDate
            histoire="naissance"
            dateLabel="Date de naissance"
            ctaLabel="Voir ce jour-là"
            dateMax={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </section>
      <BirthExamples cards={examples} />
    </main>
  );
}
