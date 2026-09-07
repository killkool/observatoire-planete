import { getCommuneCityCompare } from "./communeYearly";
import { comparePageCopy } from "./seoContent";

export const COMPARE_EXAMPLE_SPECS = [
  { inseeA: "38185", inseeB: "38563" },
  { inseeA: "38185", inseeB: "38140" }
] as const;

export type CompareExampleCard = {
  inseeA: string;
  inseeB: string;
  path: string;
  communeA: string;
  communeB: string;
  sameStation: boolean;
  summary: string;
  description: string;
};

function stripSiteSuffix(title: string): string {
  return title.replace(/\s+\|\s+Observatoire Planète$/, "");
}

/** Exemples d’accueil comparer : stations officielles, même poste = pas d’écart inventé. */
export function compareExampleCards(): CompareExampleCard[] {
  const cards: CompareExampleCard[] = [];
  for (const spec of COMPARE_EXAMPLE_SPECS) {
    const compare = getCommuneCityCompare(spec.inseeA, spec.inseeB);
    if (!compare) continue;
    const copy = comparePageCopy({
      pairInQuery: true,
      communeA: compare.communeA.name,
      communeB: compare.communeB.name,
      sameStation: compare.sameStation,
      stationA: compare.stationA?.name ?? null,
      stationB: compare.stationB?.name ?? null,
      overlap: compare.overlap
    });
    cards.push({
      inseeA: spec.inseeA,
      inseeB: spec.inseeB,
      path: `/comparer?a=${spec.inseeA}&b=${spec.inseeB}`,
      communeA: compare.communeA.name,
      communeB: compare.communeB.name,
      sameStation: compare.sameStation,
      summary: stripSiteSuffix(copy.title),
      description: copy.description
    });
  }
  return cards;
}
