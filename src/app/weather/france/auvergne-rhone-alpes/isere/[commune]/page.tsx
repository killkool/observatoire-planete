import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { defaultDateForPlace, getPlaceBySlug } from "@/lib/placeHistory";
import { getCommuneChildhoodCached, getCommuneYearlyCached, getPlaceHistoryCached } from "@/lib/sqliteReadCache";
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
  const histoire = query.histoire === "naissance";
  const history = isIsoDate(date) ? await getPlaceHistoryCached(commune, date) : null;
  const yearly = await getCommuneYearlyCached(place.insee_code);
  const birthYear = isIsoDate(date) ? Number(date.slice(0, 4)) : NaN;
  const childhood =
    histoire && Number.isInteger(birthYear)
      ? await getCommuneChildhoodCached(place.insee_code, birthYear)
      : null;
  return (
    <PlaceExplorer
      slug={commune}
      initialDate={date}
      initialHistory={history}
      initialYearly={yearly}
      initialChildhood={childhood}
      histoire={histoire}
    />
  );
}
