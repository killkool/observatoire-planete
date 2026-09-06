import type { Metadata } from "next";
import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceByPath } from "@/lib/placeHistory";
import { communePath, departmentLabel } from "@/lib/placeUrl";
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
  return {
    title,
    description,
    alternates: { canonical: path },
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
  return (
    <Suspense fallback={<p className="note loadingNote">Chargement des observations…</p>}>
      <PlaceExplorer slug={commune} initialDate={date} />
    </Suspense>
  );
}
