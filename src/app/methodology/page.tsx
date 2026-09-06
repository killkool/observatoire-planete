import type { Metadata } from "next";
import Link from "next/link";
import OriginKinds from "@/components/OriginKinds";
import PageBanner from "@/components/PageBanner";
import { frenchLanguageAlternates } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "Méthode — Observatoire Planète",
  description:
    "Comment les valeurs sont calculées : mesure, matching de station, comparaison sans fusion. Une IA n’invente jamais une donnée manquante.",
  alternates: frenchLanguageAlternates("/methodology")
};

export default function MethodologyPage() {
  return (
    <main className="docVisual">
      <PageBanner
        image="/images/origin-reanalysis.png"
        eyebrow="TRANSPARENCE"
        title={
          <>
            Comment <span>nous calculons</span>
          </>
        }
        lead="Les valeurs numériques viennent du moteur de données, jamais d’une IA générative."
      />

      <OriginKinds />

      <section className="methodSteps">
        <article>
          <strong>1</strong>
          <h2>Mesure</h2>
          <p>On lit Tmin, Tmax, pluie telles que publiées par la station, avec unité et origine OBSERVED.</p>
        </article>
        <article>
          <strong>2</strong>
          <h2>Matching</h2>
          <p>On ne prend pas le poste le plus proche s’il n’a pas de donnée ce jour-là. Score distance, altitude, couverture.</p>
        </article>
        <article>
          <strong>3</strong>
          <h2>Comparaison</h2>
          <p>ERA5 arrive à côté, jamais fusionnée. NULL = absence ; 0 = zéro mesuré.</p>
        </article>
      </section>

      <section className="panel chartPanel docPanel">
        <ul className="metaList">
          <li>Documents du dépôt : matching, confiance, climat, océan, licences — dossier docs/.</li>
          <li>Observation de station ≠ réanalyse ERA5 ≠ prévision ECMWF.</li>
          <li>Pas de moyenne aveugle entre sources. ERA5 assimile des observations : ce n’est pas une confirmation indépendante.</li>
          <li>Score de confiance v1 : brouillon documenté, poids à calibrer.</li>
        </ul>
        <p className="note">
          Détail : docs/STATION_MATCHING.md, docs/CONFIDENCE_MODEL.md, docs/CLIMATE_METHODOLOGY.md, docs/DATA_LINEAGE.md
        </p>
        <p className="note">
          <Link href="/sources">Registre des sources</Link>
        </p>
      </section>
    </main>
  );
}
