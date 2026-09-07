import { buildBirthLead, communeHistoryHref, frenchLongDate } from "./birthDay";
import { getPlaceBySlug, getPlaceDayObservation } from "./placeHistory";
import { communePath } from "./placeUrl";
import { officialCopyFromDay } from "./seoContent";
import { formatCelsius, formatMm, roundToPrecision } from "../../packages/weather-core/src/units";

export const BIRTH_EXAMPLE_SPECS = [
  { slug: "grenoble", date: "1983-05-12" },
  { slug: "grenoble", date: "1986-05-12" },
  { slug: "grenoble", date: "1900-01-01" }
] as const;

export type BirthExampleCard = {
  slug: string;
  date: string;
  when: string;
  placeName: string;
  path: string;
  observation: {
    tmin: number | null;
    tmax: number | null;
    precipitationMm: number | null;
    stationName: string;
    distanceKm: number | null;
  } | null;
  lead: string;
};

/** Exemples d’accueil naissance : mesure officielle seulement, pas d’ERA5. */
export function birthExampleCards(): BirthExampleCard[] {
  const cards: BirthExampleCard[] = [];
  for (const spec of BIRTH_EXAMPLE_SPECS) {
    const place = getPlaceBySlug(spec.slug);
    if (!place) continue;
    const official = officialCopyFromDay(getPlaceDayObservation(spec.slug, spec.date));
    const km =
      official?.distanceKm != null ? roundToPrecision(official.distanceKm, 1) : null;
    const observation = official
      ? {
          tmin: official.tmin,
          tmax: official.tmax,
          precipitationMm: official.precipitationMm,
          stationName: official.stationName,
          distanceKm: km
        }
      : null;
    cards.push({
      slug: spec.slug,
      date: spec.date,
      when: frenchLongDate(spec.date) || spec.date,
      placeName: place.name,
      path: communeHistoryHref(communePath(place), spec.date, "naissance"),
      observation,
      lead: buildBirthLead({
        hasObservation: Boolean(observation),
        tminDisplay: observation ? formatCelsius(observation.tmin) : null,
        tmaxDisplay: observation ? formatCelsius(observation.tmax) : null,
        precipDisplay: observation ? formatMm(observation.precipitationMm) : null,
        stationDisclaimer: observation
          ? `Mesures provenant de la station ${observation.stationName} située à ${km} km.`
          : null
      })
    });
  }
  return cards;
}
