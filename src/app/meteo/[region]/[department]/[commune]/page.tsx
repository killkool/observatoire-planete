import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceByPath, getPlaceDayObservation } from "@/lib/placeHistory";
import { communePath, departmentLabel } from "@/lib/placeUrl";
import { frenchLanguageAlternates, seoFactsForPlace } from "@/lib/seoContent";
import { communeJsonLd } from "@/lib/seoJsonLd";
import { shareCardPath } from "@/lib/shareCard";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type CommuneParams = { region: string; department: string; commune: string };

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<CommuneParams>;
  searchParams: Promise<{ date?: string }>;
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
  searchParams: Promise<{ date?: string }>;
}) {
  const { region, department, commune } = await params;
  const query = await searchParams;
  const place = getPlaceByPath(region, department, commune);
  if (!place) notFound();
  const date = query.date || defaultDateForPlace(commune);
  const path = communePath(place);
  const title = `${place.name} — histoire météo | Observatoire Planète`;
  const description = `Températures, pluie et records observés à ${place.name} (${departmentLabel(place.department_slug)}). La station et la source sont indiquées. Ce n’est pas une prévision.`;
  const day = isIsoDate(date) ? getPlaceDayObservation(commune, date) : null;
  return (
    <>
      <JsonLd
        data={communeJsonLd({
          place,
          path,
          title,
          description,
          observation: day
            ? {
                originType: day.originType,
                date,
                tmin: day.tmin,
                tmax: day.tmax,
                precipitationMm: day.precipitationMm,
                station: { id: day.station.id, name: day.station.name }
              }
            : null
        })}
      />
      <Suspense fallback={<p className="note loadingNote">Chargement des observations…</p>}>
        <PlaceExplorer slug={commune} initialDate={date} />
      </Suspense>
    </>
  );
}
