import type { Metadata } from "next";
import { Suspense } from "react";
import CompareCities from "@/components/CompareCities";
import CompareExamples from "@/components/CompareExamples";
import { comparePageCopy, frenchLanguageAlternates } from "@/lib/seoContent";
import { shareCompareLandingCardPath } from "@/lib/landingOg";
import { getCommuneCityCompareCached, getCompareExamplesCached } from "@/lib/sqliteReadCache";

type CompareQuery = { a?: string; b?: string };

function copyFromQuery(
  pairInQuery: boolean,
  compare: Awaited<ReturnType<typeof getCommuneCityCompareCached>>
) {
  if (!pairInQuery) return comparePageCopy({ pairInQuery: false });
  if (!compare) return comparePageCopy({ pairInQuery: true, missing: true });
  return comparePageCopy({
    pairInQuery: true,
    communeA: compare.communeA.name,
    communeB: compare.communeB.name,
    sameStation: compare.sameStation,
    stationA: compare.stationA?.name ?? null,
    stationB: compare.stationB?.name ?? null,
    overlap: compare.overlap
  });
}

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<CompareQuery>;
}): Promise<Metadata> {
  const query = await searchParams;
  const inseeA = query.a?.trim() ?? "";
  const inseeB = query.b?.trim() ?? "";
  const pairInQuery = Boolean(inseeA && inseeB);
  const compare = pairInQuery ? await getCommuneCityCompareCached(inseeA, inseeB) : null;
  const copy = copyFromQuery(pairInQuery, compare);
  const landingImage = pairInQuery ? null : shareCompareLandingCardPath();
  return {
    title: copy.title,
    description: copy.description,
    alternates: frenchLanguageAlternates("/comparer"),
    openGraph: {
      title: copy.title,
      description: copy.description,
      locale: "fr_FR",
      type: "website",
      images: landingImage
        ? [{ url: landingImage, width: 1200, height: 630, alt: "Exemple : Grenoble vs Voiron" }]
        : undefined
    },
    twitter: {
      card: landingImage ? "summary_large_image" : "summary",
      title: copy.title,
      description: copy.description,
      images: landingImage ? [landingImage] : undefined
    }
  };
}

export default async function ComparerPage({
  searchParams
}: {
  searchParams: Promise<CompareQuery>;
}) {
  const query = await searchParams;
  const inseeA = query.a?.trim() ?? "";
  const inseeB = query.b?.trim() ?? "";
  const initialCompare =
    inseeA && inseeB ? await getCommuneCityCompareCached(inseeA, inseeB) : null;
  const examples = inseeA && inseeB ? [] : await getCompareExamplesCached();
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
        <CompareCities initialCompare={initialCompare} />
      </Suspense>
      {examples.length ? <CompareExamples cards={examples} /> : null}
    </main>
  );
}
