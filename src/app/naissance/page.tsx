import type { Metadata } from "next";
import Image from "next/image";
import PlaceSearch from "@/components/PlaceSearch";
import { frenchLanguageAlternates } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "Jour de naissance — Observatoire Planète",
  description: "Quel temps faisait-il le jour de votre naissance ? Mesure officielle s’il y en a une, jamais une valeur inventée.",
  alternates: frenchLanguageAlternates("/naissance")
};

export default function NaissancePage() {
  return (
    <main className="homeVisual">
      <section className="earthHero">
        <Image
          src="/images/hero-earth.png"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
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
    </main>
  );
}
