import { formatCelsius, formatDaysFrost, formatDaysGe25, formatDaysGe30, formatDaysGe35, formatDaysGe40, formatDaysRain, formatMm, formatTropicalNights, roundToPrecision } from "../../packages/weather-core/src/units";
import { frenchLongDate } from "./birthDay";
import { formatSignedCelsius, formatSignedMm } from "./compareClimate";
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

export type CommuneCopyObservation = {
  tmin: number | null;
  tmax: number | null;
  precipitationMm: number | null;
  stationName: string;
  distanceKm: number | null;
};

export function officialCopyFromDay(
  obs: {
    originType: string;
    tmin: number | null;
    tmax: number | null;
    precipitationMm: number | null;
    station: { name: string; distanceKm: number | null };
  } | null
): CommuneCopyObservation | null {
  if (!obs || obs.originType !== "OBSERVED") return null;
  if (obs.tmin == null && obs.tmax == null && obs.precipitationMm == null) return null;
  return {
    tmin: obs.tmin,
    tmax: obs.tmax,
    precipitationMm: obs.precipitationMm,
    stationName: obs.station.name,
    distanceKm: obs.station.distanceKm
  };
}

export type CommuneCopyClimate = {
  year: number;
  tminMean?: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  precipComplete: boolean;
  daysRain?: number | null;
  daysGe25?: number | null;
  daysGe30?: number | null;
  daysGe35?: number | null;
  daysGe40?: number | null;
  daysFrost?: number | null;
  tropicalNights?: number | null;
  stationName: string;
  distanceKm: number | null;
};

function isoSlashDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** Titre et description d’une commune. Mesure officielle seulement ; pas d’ERA5 ; NULL ≠ 0. Canonical inchangé. */
export function communePageCopy(input: {
  placeName: string;
  department: string;
  isoDate: string;
  dateInQuery: boolean;
  naissance: boolean;
  observation: CommuneCopyObservation | null;
  climate?: CommuneCopyClimate | null;
}): { title: string; description: string } {
  const genericTitle = `${input.placeName} — histoire météo | Observatoire Planète`;
  const genericDescription = `Températures, pluie et records observés à ${input.placeName} (${input.department}). La station et la source sont indiquées. Ce n’est pas une prévision.`;
  if (!input.dateInQuery && !input.naissance) {
    if (input.climate && input.climate.tmaxMean != null) {
      const tmax = formatCelsius(input.climate.tmaxMean);
      const rain =
        input.climate.precipComplete && input.climate.precipitationSum != null
          ? formatMm(input.climate.precipitationSum)
          : null;
      const km =
        input.climate.distanceKm != null ? roundToPrecision(input.climate.distanceKm, 1) : null;
      const station =
        km != null ? `${input.climate.stationName} (${km} km)` : input.climate.stationName;
      const rainBit = rain ? `, pluie ${rain}` : "";
      const rainDaysBit =
        input.climate.precipComplete && input.climate.daysRain != null
          ? `, ${formatDaysRain(input.climate.daysRain)}`
          : "";
      const tminBit =
        input.climate.tminMean != null ? `minimale moyenne ${formatCelsius(input.climate.tminMean)}, ` : "";
      const warmDaysBit =
        input.climate.daysGe25 != null ? `, ${formatDaysGe25(input.climate.daysGe25)}` : "";
      const hotDaysBit =
        input.climate.daysGe30 != null ? `, ${formatDaysGe30(input.climate.daysGe30)}` : "";
      const veryHotDaysBit =
        input.climate.daysGe35 != null ? `, ${formatDaysGe35(input.climate.daysGe35)}` : "";
      const extremeHotDaysBit =
        input.climate.daysGe40 != null ? `, ${formatDaysGe40(input.climate.daysGe40)}` : "";
      const frostBit =
        input.climate.daysFrost != null ? `, ${formatDaysFrost(input.climate.daysFrost)}` : "";
      const tropicalBit =
        input.climate.tropicalNights != null
          ? `, ${formatTropicalNights(input.climate.tropicalNights)}`
          : "";
      return {
        title: `${input.placeName} — ${input.climate.year} · max. ${tmax} | Observatoire Planète`,
        description: `Dernière année climatique complète observée pour ${input.placeName} (${input.department}) : ${input.climate.year}, ${tminBit}maximale moyenne ${tmax}${rainBit}${rainDaysBit}${warmDaysBit}${hotDaysBit}${veryHotDaysBit}${extremeHotDaysBit}${frostBit}${tropicalBit}. Station ${station}. Ce n’est pas une prévision.`
      };
    }
    return { title: genericTitle, description: genericDescription };
  }
  const when = frenchLongDate(input.isoDate) || input.isoDate;
  const shortWhen = isoSlashDate(input.isoDate);
  const prefix = input.naissance ? `Naissance à ${input.placeName}` : input.placeName;
  if (!input.observation) {
    return {
      title: `${prefix}, ${shortWhen} : aucune mesure officielle | Observatoire Planète`,
      description: `Aucune mesure officielle n’est disponible pour ${input.placeName} le ${when}. Aucune valeur n’est inventée. Ce n’est pas une prévision.`
    };
  }
  const tmin = formatCelsius(input.observation.tmin);
  const tmax = formatCelsius(input.observation.tmax);
  const rain = formatMm(input.observation.precipitationMm);
  const km =
    input.observation.distanceKm != null ? roundToPrecision(input.observation.distanceKm, 1) : null;
  const station =
    km != null
      ? `${input.observation.stationName} (${km} km)`
      : input.observation.stationName;
  return {
    title: `${prefix}, ${shortWhen} : ${tmin} / ${tmax} | Observatoire Planète`,
    description: `Mesure officielle le ${when} à ${input.placeName} : minimale ${tmin}, maximale ${tmax}, pluie ${rain}. Station ${station}. Ce n’est pas une prévision.`
  };
}

const COMPARE_GENERIC_TITLE = "Comparer deux communes — Observatoire Planète";
const COMPARE_GENERIC_DESCRIPTION =
  "Comparez le climat observé de deux communes Isère. Chaque ville garde sa station. On ne mélange pas les postes, on n’invente pas d’écart.";

export type CompareCopyOverlap =
  | { comparable: false; reason: string }
  | {
      comparable: true;
      from: number;
      to: number;
      n: number;
      tmaxMeanA: number | null;
      tmaxMeanB: number | null;
      tminMeanA: number | null;
      tminMeanB: number | null;
      precipMeanA: number | null;
      precipMeanB: number | null;
      tmaxDelta: number | null;
      precipDelta: number | null;
      precipYears: number;
    };

/** Titre / description ville vs ville. Mesure officielle seulement ; même poste = pas d’écart inventé ; canonical `/comparer`. */
export function comparePageCopy(input: {
  pairInQuery: boolean;
  missing?: boolean;
  communeA?: string;
  communeB?: string;
  sameStation?: boolean;
  stationA?: string | null;
  stationB?: string | null;
  overlap?: CompareCopyOverlap;
}): { title: string; description: string } {
  if (!input.pairInQuery) {
    return { title: COMPARE_GENERIC_TITLE, description: COMPARE_GENERIC_DESCRIPTION };
  }
  if (input.missing || !input.communeA || !input.communeB) {
    return {
      title: "Comparaison introuvable — Observatoire Planète",
      description: "Une commune n’est pas dans le référentiel Isère. Aucune valeur n’est inventée."
    };
  }
  const a = input.communeA;
  const b = input.communeB;
  if (input.sameStation) {
    const station = input.stationA || input.stationB || "le même poste";
    return {
      title: `${a} et ${b} : même station ${station} | Observatoire Planète`,
      description: `${a} et ${b} s’appuient sur le même poste climatique ${station}. Ce n’est pas deux séries indépendantes : aucun écart n’est inventé. Ce n’est pas une prévision.`
    };
  }
  const overlap = input.overlap;
  if (!overlap?.comparable) {
    return {
      title: `${a} vs ${b} : pas d’écart affiché | Observatoire Planète`,
      description: `${overlap && "reason" in overlap ? overlap.reason : "Aucun écart n’est affiché."} On ne mélange pas les postes, on n’invente pas de différence. Ce n’est pas une prévision.`
    };
  }
  const tmaxA = formatCelsius(overlap.tmaxMeanA);
  const tmaxB = formatCelsius(overlap.tmaxMeanB);
  const rainA = formatMm(overlap.precipMeanA);
  const rainB = formatMm(overlap.precipMeanB);
  const stationA = input.stationA || "station inconnue";
  const stationB = input.stationB || "station inconnue";
  const rainLine =
    overlap.precipYears >= 5 && overlap.precipMeanA != null && overlap.precipMeanB != null
      ? ` Pluie annuelle moyenne ${rainA} → ${rainB} (${formatSignedMm(overlap.precipDelta)}).`
      : " Pluie annuelle : pas assez d’années complètes, aucun 0 inventé.";
  return {
    title: `${a} vs ${b} : ${tmaxA} → ${tmaxB} | Observatoire Planète`,
    description: `Moyenne des maximales sur ${overlap.n} années climatiques ${overlap.from}–${overlap.to} : ${a} ${tmaxA} (${stationA}), ${b} ${tmaxB} (${stationB}). Écart max. ${formatSignedCelsius(overlap.tmaxDelta)}.${rainLine} Écart = ${b} − ${a}. Ce n’est pas une prévision.`
  };
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
