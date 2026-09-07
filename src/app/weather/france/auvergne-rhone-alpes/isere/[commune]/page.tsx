import PlaceExplorer from "@/components/PlaceExplorer";
import { isIsoDate } from "@/lib/birthDay";
import { climateCopyFromYearly } from "@/lib/communeYearly";
import { defaultDateForPlace, getPlaceBySlug } from "@/lib/placeHistory";
import { getCommuneChildhoodCached, getCommuneYearlyPageCached, getPlaceHistoryCached } from "@/lib/sqliteReadCache";
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
  const dateInQuery = Boolean(query.date && isIsoDate(query.date));
  const birthYear = isIsoDate(date) ? Number(date.slice(0, 4)) : NaN;
  const [history, yearly, childhood] = await Promise.all([
    (dateInQuery || histoire) && isIsoDate(date) ? getPlaceHistoryCached(commune, date) : Promise.resolve(null),
    getCommuneYearlyPageCached(place.insee_code),
    histoire && Number.isInteger(birthYear)
      ? getCommuneChildhoodCached(place.insee_code, birthYear)
      : Promise.resolve(null)
  ]);
  return (
    <PlaceExplorer
      slug={commune}
      initialDate={date}
      initialHistory={history}
      initialYearly={yearly}
      initialChildhood={childhood}
      histoire={histoire}
      dateInQuery={dateInQuery}
      climateLead={!dateInQuery && !histoire ? climateCopyFromYearly(yearly) : null}
    />
  );
}
