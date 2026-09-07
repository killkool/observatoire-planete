import { birthExampleCards } from "./birthExamples";
import { COMPARE_EXAMPLE_SPECS } from "./compareExamples";
import { climateCopyFromYearly, getCommuneCityCompare, getCommuneYearly } from "./communeYearly";
import { getPlaceBySlug } from "./placeHistory";
import {
  buildClimateShareCardModel,
  buildShareCardModel,
  type ClimateShareCardModel,
  type ShareCardModel
} from "./shareCard";
import { formatCelsius, formatMm } from "../../packages/weather-core/src/units";

export const HOME_OG_PLACE_SLUG = "grenoble";

export function shareHomeCardPath(): string {
  return "/og/accueil";
}

export function shareBirthLandingCardPath(): string {
  return "/og/naissance";
}

export function shareCompareLandingCardPath(): string {
  return "/og/comparer";
}

export type HomeOgModel = ClimateShareCardModel & {
  kicker: string;
  exampleLine: string;
};

/** Accueil : exemple Grenoble, pas une moyenne France, pas le premier lieu alphabétique (Crolles). */
export function buildHomeOgModel(): HomeOgModel | null {
  const place = getPlaceBySlug(HOME_OG_PLACE_SLUG);
  if (!place) return null;
  const climate = climateCopyFromYearly(getCommuneYearly(place.insee_code, { includeDetailRows: false }));
  if (!climate) return null;
  const card = buildClimateShareCardModel({
    placeName: place.name,
    year: climate.year,
    tminMean: climate.tminMean,
    tmaxMean: climate.tmaxMean,
    precipitationSum: climate.precipitationSum,
    precipComplete: climate.precipComplete,
    daysGe30: climate.daysGe30,
    stationName: climate.stationName,
    distanceKm: climate.distanceKm
  });
  if (!card) return null;
  return {
    ...card,
    kicker: "LA MÉMOIRE MÉTÉO DE LA FRANCE",
    exampleLine: `Exemple : ${card.placeName}, année climatique ${card.year}`
  };
}

export type BirthLandingOgModel = ShareCardModel & { kicker: string };

/** Naissance : premier exemple avec une mesure officielle (1983), pas 1900, pas une réanalyse. */
export function buildBirthLandingOgModel(): BirthLandingOgModel | null {
  const example = birthExampleCards().find((card) => card.observation);
  if (!example?.observation) return null;
  return {
    ...buildShareCardModel({
      placeName: example.placeName,
      isoDate: example.date,
      hasObservation: true,
      tminDisplay: formatCelsius(example.observation.tmin),
      tmaxDisplay: formatCelsius(example.observation.tmax),
      precipDisplay: formatMm(example.observation.precipitationMm),
      stationName: example.observation.stationName,
      distanceKm: example.observation.distanceKm
    }),
    kicker: "EXEMPLE · JOUR DE NAISSANCE"
  };
}

export type CompareLandingOgModel = {
  communeA: string;
  communeB: string;
  tmaxA: string;
  tmaxB: string;
  stationLine: string;
  attribution: string;
  note: string;
};

/** Comparer : premier exemple à deux postes (Voiron), pas Crolles (même station). */
export function buildCompareLandingOgModel(): CompareLandingOgModel | null {
  for (const spec of COMPARE_EXAMPLE_SPECS) {
    const compare = getCommuneCityCompare(spec.inseeA, spec.inseeB);
    if (!compare || compare.sameStation) continue;
    if (!compare.overlap.comparable) continue;
    if (compare.overlap.tmaxMeanA == null || compare.overlap.tmaxMeanB == null) continue;
    const stationA = compare.stationA?.name;
    const stationB = compare.stationB?.name;
    if (!stationA || !stationB) continue;
    return {
      communeA: compare.communeA.name,
      communeB: compare.communeB.name,
      tmaxA: formatCelsius(compare.overlap.tmaxMeanA),
      tmaxB: formatCelsius(compare.overlap.tmaxMeanB),
      stationLine: `${stationA} / ${stationB} · ${compare.overlap.n} années ${compare.overlap.from}–${compare.overlap.to}`,
      attribution:
        "Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0.",
      note: "Exemple. Chaque ville garde sa station. Ce n’est pas une prévision."
    };
  }
  return null;
}
