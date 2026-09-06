import type { Metadata } from "next";
import { Suspense } from "react";
import CompareCities from "@/components/CompareCities";
import { frenchLanguageAlternates } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "Comparer deux communes — Observatoire Planète",
  description:
    "Comparez le climat observé de deux communes Isère. Chaque ville garde sa station. On ne mélange pas les postes, on n’invente pas d’écart.",
  alternates: frenchLanguageAlternates("/comparer")
};

export default function ComparerPage() {
  return (
    <main className="compareShell">
      <p className="eyebrow">VILLE VS VILLE</p>
      <h1>
        Deux communes,
        <span> deux stations</span>
      </h1>
      <p className="compareLead">
        Chaque série reste sur un seul poste. Si les deux villes partagent la même station, on le dit — on n’invente
        pas une différence. La normale 1991-2020 n’apparaît que si chaque poste a 24 années climatiques.
      </p>
      <Suspense fallback={<p className="note">Chargement…</p>}>
        <CompareCities />
      </Suspense>
    </main>
  );
}
