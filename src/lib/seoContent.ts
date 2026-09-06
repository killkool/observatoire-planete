import {
  listClimateStationCoverage,
  listObservedStationCoverage,
  resolveClimateStationForPlace,
  resolveObservedStationForPlace,
  type ClimateStationCoverage,
  type ObservedStationCoverage
} from "./climateStations";
import { listPlaces, type PlaceRow } from "./placeHistory";

export const MIN_SEO_CONTENT_SCORE = 50;
export const SEO_CONTENT_METHOD = "seo-content-v1";

export type SeoContentInput = {
  hasPlace: boolean;
  completeClimateYears: number;
  hasDistinctiveHistory: boolean;
};

export function seoContentScore(input: SeoContentInput): { score: number; indexable: boolean } {
  let score = 0;
  if (input.hasPlace) score += 40;
  if (input.completeClimateYears >= 10) score += 40;
  else if (input.completeClimateYears >= 1) score += 20;
  if (input.hasDistinctiveHistory) score += 20;
  return { score, indexable: score >= MIN_SEO_CONTENT_SCORE };
}

export function placeHasOfficialIdentity(place: Pick<PlaceRow, "insee_code" | "name" | "latitude" | "longitude">): boolean {
  return Boolean(place.insee_code && place.name && place.latitude != null && place.longitude != null);
}

export type PlaceSeoFacts = SeoContentInput & {
  score: number;
  indexable: boolean;
  methodVersion: string;
  climateStationId: string | null;
};

export function seoFactsForPlace(
  place: PlaceRow,
  coverage?: {
    stations?: ClimateStationCoverage[];
    observed?: ObservedStationCoverage[];
  }
): PlaceSeoFacts {
  const hasPlace = placeHasOfficialIdentity(place);
  const stations = coverage?.stations ?? listClimateStationCoverage();
  const climate = resolveClimateStationForPlace(place, stations);
  const completeClimateYears = climate?.complete_years ?? 0;
  let hasDistinctiveHistory = (climate?.complete_years ?? 0) >= 1 || (climate?.years ?? 0) >= 1;
  if (!hasDistinctiveHistory) {
    const observed = coverage?.observed ?? listObservedStationCoverage();
    const nearby = resolveObservedStationForPlace(place, observed);
    hasDistinctiveHistory = Boolean(nearby && nearby.observedDays > 0);
  }
  const scored = seoContentScore({ hasPlace, completeClimateYears, hasDistinctiveHistory });
  return {
    hasPlace,
    completeClimateYears,
    hasDistinctiveHistory,
    ...scored,
    methodVersion: SEO_CONTENT_METHOD,
    climateStationId: climate?.id ?? null
  };
}

export function listIndexablePlaces(): PlaceRow[] {
  const stations = listClimateStationCoverage();
  const observed = stations.length ? [] : listObservedStationCoverage();
  return listPlaces().filter((place) => seoFactsForPlace(place, { stations, observed }).indexable);
}

export function publicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function publicAbsoluteUrl(path: string): string {
  const origin = publicSiteOrigin();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** V1 France : une seule langue publiée. Pas d’URL `en` fantôme. Routage anglais = backlog V2. */
export function frenchLanguageAlternates(path: string): {
  canonical: string;
  languages: { fr: string; "x-default": string };
} {
  const url = publicAbsoluteUrl(path);
  return {
    canonical: url,
    languages: {
      fr: url,
      "x-default": url
    }
  };
}
