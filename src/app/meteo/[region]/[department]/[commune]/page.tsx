import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceByPath, getPlaceDayObservation } from "@/lib/placeHistory";
import { climateCopyFromYearly } from "@/lib/communeYearly";
import { communePath, departmentLabel } from "@/lib/placeUrl";
import { communePageCopy, frenchLanguageAlternates, officialCopyFromDay, seoFactsForPlace } from "@/lib/seoContent";
import { communeJsonLd } from "@/lib/seoJsonLd";
import { shareCardPath, shareClimateCardPath } from "@/lib/shareCard";
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
  const dateInQuery = Boolean(query.date && isIsoDate(query.date));
  const naissance = query.histoire === "naissance";
  const date = dateInQuery ? (query.date as string) : defaultDateForPlace(commune);
  const climate =
    !dateInQuery && !naissance
      ? climateCopyFromYearly(await getCommuneYearlyPageCached(place.insee_code))
      : null;
  const copy = communePageCopy({
    placeName: place.name,
    department: dept,
    isoDate: date,
    dateInQuery,
    naissance,
    observation: dateInQuery || naissance ? officialCopyFromDay(getPlaceDayObservation(commune, date)) : null,
    climate
  });
  const path = communePath(place);
  const image =
    dateInQuery || naissance
      ? shareCardPath(place.slug, date)
      : climate
        ? shareClimateCardPath(place.slug)
        : null;
  const imageAlt = climate ? `${place.name}, ${climate.year}` : `${place.name}, ${date}`;
  const seo = seoFactsForPlace(place);
  return {
    title: copy.title,
    description: copy.description,
    alternates: frenchLanguageAlternates(path),
    robots: seo.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: copy.title,
      description: copy.description,
      locale: "fr_FR",
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: imageAlt }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
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
  const dateInQuery = Boolean(query.date && isIsoDate(query.date));
  const isoDate = isIsoDate(date) ? date : defaultDateForPlace(commune);
  const path = communePath(place);
  const birthYear = isIsoDate(date) ? Number(date.slice(0, 4)) : NaN;
  const [history, yearly, childhood] = await Promise.all([
    (dateInQuery || histoire) && isIsoDate(date) ? getPlaceHistoryCached(commune, date) : Promise.resolve(null),
    getCommuneYearlyPageCached(place.insee_code),
    histoire && Number.isInteger(birthYear)
      ? getCommuneChildhoodCached(place.insee_code, birthYear)
      : Promise.resolve(null)
  ]);
  const climate = !dateInQuery && !histoire ? climateCopyFromYearly(yearly) : null;
  const copy = communePageCopy({
    placeName: place.name,
    department: departmentLabel(place.department_slug),
    isoDate,
    dateInQuery,
    naissance: histoire,
    observation: dateInQuery || histoire ? officialCopyFromDay(getPlaceDayObservation(commune, isoDate)) : null,
    climate
  });
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
          title: copy.title,
          description: copy.description,
          observation: dateInQuery || histoire ? observed : null
        })}
      />
      <PlaceExplorer
        slug={commune}
        initialDate={date}
        initialHistory={history}
        initialYearly={yearly}
        initialChildhood={childhood}
        histoire={histoire}
        dateInQuery={dateInQuery}
        climateLead={climate}
      />
    </>
  );
}
