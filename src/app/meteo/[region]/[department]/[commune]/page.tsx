import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceByPath } from "@/lib/placeHistory";
import { communePath, departmentLabel } from "@/lib/placeUrl";
import { frenchLanguageAlternates, seoFactsForPlace } from "@/lib/seoContent";
import { communeJsonLd } from "@/lib/seoJsonLd";
import { shareCardPath } from "@/lib/shareCard";
import { getCommuneChildhoodCached, getCommuneYearlyPageCached, getPlaceHistoryCached } from "@/lib/sqliteReadCache";
import { notFound } from "next/navigation";

type CommuneParams = { region: string; department: string; commune: string };

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<CommuneParams>;
  searchParams: Promise<{ date?: string; histoire?: string }>;
}): Promise<Metadata> {
  const { region, department, commune } = await params;
  const query = await searchParams;
  const place = getPlaceByPath(region, department, commune);
  if (!place) {
    return { title: "Commune introuvable — Observatoire Planète" };
  }
  const dept = departmentLabel(place.department_slug);
  const date = query.date && isIsoDate(query.date) ? query.date : defaultDateForPlace(commune);
  const title = `${place.name} — histoire météo | Observatoire Planète`;
  const description = `Températures, pluie et records observés à ${place.name} (${dept}). La station et la source sont indiquées. Ce n’est pas une prévision.`;
  const path = communePath(place);
  const image = shareCardPath(place.slug, date);
  const seo = seoFactsForPlace(place);
  return {
    title,
    description,
    alternates: frenchLanguageAlternates(path),
    robots: seo.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      locale: "fr_FR",
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: `${place.name}, ${date}` }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function CommunePage({
  params,
  searchParams
}: {
  params: Promise<CommuneParams>;
  searchParams: Promise<{ date?: string; histoire?: string }>;
}) {
  const { region, department, commune } = await params;
  const query = await searchParams;
  const place = getPlaceByPath(region, department, commune);
  if (!place) notFound();
  const date = query.date || defaultDateForPlace(commune);
  const histoire = query.histoire === "naissance";
  const path = communePath(place);
  const title = `${place.name} — histoire météo | Observatoire Planète`;
  const description = `Températures, pluie et records observés à ${place.name} (${departmentLabel(place.department_slug)}). La station et la source sont indiquées. Ce n’est pas une prévision.`;
  const birthYear = isIsoDate(date) ? Number(date.slice(0, 4)) : NaN;
  const [history, yearly, childhood] = await Promise.all([
    isIsoDate(date) ? getPlaceHistoryCached(commune, date) : Promise.resolve(null),
    getCommuneYearlyPageCached(place.insee_code),
    histoire && Number.isInteger(birthYear)
      ? getCommuneChildhoodCached(place.insee_code, birthYear)
      : Promise.resolve(null)
  ]);
  const observed =
    history?.observation?.originType === "OBSERVED" && history.preferredStation
      ? {
          originType: history.observation.originType,
          date,
          tmin: history.observation.tmin,
          tmax: history.observation.tmax,
          precipitationMm: history.observation.precipitationMm,
          station: { id: history.preferredStation.id, name: history.preferredStation.name }
        }
      : null;
  return (
    <>
      <JsonLd
        data={communeJsonLd({
          place,
          path,
          title,
          description,
          observation: observed
        })}
      />
      <PlaceExplorer
        slug={commune}
        initialDate={date}
        initialHistory={history}
        initialYearly={yearly}
        initialChildhood={childhood}
        histoire={histoire}
      />
    </>
  );
}
