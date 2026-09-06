import PlaceExplorer from "@/components/PlaceExplorer";
import { defaultDateForPlace, getPlaceBySlug } from "@/lib/placeHistory";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function CommunePage({
  params,
  searchParams
}: {
  params: Promise<{ commune: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { commune } = await params;
  const query = await searchParams;
  const place = getPlaceBySlug(commune);
  if (!place) notFound();
  const date = query.date || defaultDateForPlace(commune);
  return (
    <Suspense fallback={<p className="note loadingNote">Chargement des observations…</p>}>
      <PlaceExplorer slug={commune} initialDate={date} />
    </Suspense>
  );
}

