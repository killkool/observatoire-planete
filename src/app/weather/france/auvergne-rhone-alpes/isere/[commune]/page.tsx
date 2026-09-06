import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceBySlug } from "@/lib/placeHistory";
import { getCommuneYearlyCached, getPlaceHistoryCached } from "@/lib/sqliteReadCache";
import { notFound } from "next/navigation";

export default async function CommunePage({
  params,
  searchParams
}: {
  params: Promise<{ commune: string }>;
  searchParams: Promise<{ date?: string; histoire?: string }>;
}) {
  const { commune } = await params;
  const query = await searchParams;
  const place = getPlaceBySlug(commune);
  if (!place) notFound();
  const date = query.date || defaultDateForPlace(commune);
  const history = isIsoDate(date) ? await getPlaceHistoryCached(commune, date) : null;
  const yearly = await getCommuneYearlyCached(place.insee_code);
  return (
    <PlaceExplorer
      slug={commune}
      initialDate={date}
      initialHistory={history}
      initialYearly={yearly}
      histoire={query.histoire === "naissance"}
    />
  );
}
