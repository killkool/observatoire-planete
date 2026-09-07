import { frenchLongDate } from "./birthDay";
import { annualMeanAmplitudeC, formatCelsius, formatDaysFrost, formatDaysGe25, formatDaysGe30, formatDaysGe35, formatDaysGe40, formatDaysRain, formatMeanAmplitudeC, formatMm, formatTropicalNights } from "../../packages/weather-core/src/units";

export type ShareCardModel = {
  placeName: string;
  dateLabel: string;
  hasObservation: boolean;
  tminDisplay: string;
  tmaxDisplay: string;
  precipDisplay: string;
  stationLine: string | null;
  attribution: string;
  note: string;
};

export function shareCardPath(slug: string, isoDate: string): string | null {
  if (!slug.trim() || !frenchLongDate(isoDate)) return null;
  return `/og/${encodeURIComponent(slug.trim())}/${isoDate}`;
}

/** Carte de partage de l’URL canonique : année climatique, pas le jour par défaut. */
export function shareClimateCardPath(slug: string): string | null {
  if (!slug.trim()) return null;
  return `/og/climat/${encodeURIComponent(slug.trim())}`;
}

export type ClimateShareCardModel = {
  placeName: string;
  year: number;
  tminDisplay: string | null;
  tmaxDisplay: string;
  amplitudeDisplay: string | null;
  precipDisplay: string | null;
  daysRainDisplay: string | null;
  daysGe25Display: string | null;
  daysGe30Display: string | null;
  daysGe35Display: string | null;
  daysGe40Display: string | null;
  daysFrostDisplay: string | null;
  tropicalNightsDisplay: string | null;
  stationLine: string;
  attribution: string;
  note: string;
};

export function buildClimateShareCardModel(input: {
  placeName: string;
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
}): ClimateShareCardModel | null {
  if (input.tmaxMean == null) return null;
  const km = input.distanceKm != null ? ` · ${input.distanceKm} km` : "";
  const amplitude = annualMeanAmplitudeC(input.tminMean, input.tmaxMean);
  return {
    placeName: input.placeName,
    year: input.year,
    tminDisplay: input.tminMean != null ? formatCelsius(input.tminMean) : null,
    tmaxDisplay: formatCelsius(input.tmaxMean),
    amplitudeDisplay: amplitude != null ? formatCelsius(amplitude) : null,
    precipDisplay:
      input.precipComplete && input.precipitationSum != null ? formatMm(input.precipitationSum) : null,
    daysRainDisplay:
      input.precipComplete && input.daysRain != null ? `${input.daysRain} j` : null,
    daysGe25Display: input.daysGe25 != null ? `${input.daysGe25} j` : null,
    daysGe30Display: input.daysGe30 != null ? `${input.daysGe30} j` : null,
    daysGe35Display: input.daysGe35 != null ? `${input.daysGe35} j` : null,
    daysGe40Display: input.daysGe40 != null ? `${input.daysGe40} j` : null,
    daysFrostDisplay: input.daysFrost != null ? `${input.daysFrost} j` : null,
    tropicalNightsDisplay:
      input.tropicalNights != null ? `${input.tropicalNights} nuit${input.tropicalNights > 1 ? "s" : ""}` : null,
    stationLine: `Année climatique complète · ${input.stationName}${km}`,
    attribution:
      "Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0.",
    note: "Ce n’est pas une prévision."
  };
}

export function buildClimateShareText(input: {
  placeName: string;
  year: number;
  tminMean: number | null;
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
  url: string;
}): string {
  const tminBit = input.tminMean != null ? `minimale moyenne ${formatCelsius(input.tminMean)}, ` : "";
  const tmax = formatCelsius(input.tmaxMean);
  const amplitude = annualMeanAmplitudeC(input.tminMean, input.tmaxMean);
  const ampBit = amplitude != null ? `, ${formatMeanAmplitudeC(amplitude)}` : "";
  const rain =
    input.precipComplete && input.precipitationSum != null
      ? `, pluie ${formatMm(input.precipitationSum)}`
      : "";
  const rainDays =
    input.precipComplete && input.daysRain != null ? `, ${formatDaysRain(input.daysRain)}` : "";
  const warmDays = input.daysGe25 != null ? `, ${formatDaysGe25(input.daysGe25)}` : "";
  const hotDays = input.daysGe30 != null ? `, ${formatDaysGe30(input.daysGe30)}` : "";
  const veryHotDays = input.daysGe35 != null ? `, ${formatDaysGe35(input.daysGe35)}` : "";
  const extremeHotDays = input.daysGe40 != null ? `, ${formatDaysGe40(input.daysGe40)}` : "";
  const frost = input.daysFrost != null ? `, ${formatDaysFrost(input.daysFrost)}` : "";
  const tropical =
    input.tropicalNights != null ? `, ${formatTropicalNights(input.tropicalNights)}` : "";
  const km = input.distanceKm != null ? `, ${input.distanceKm} km` : "";
  return `${input.placeName}, année climatique ${input.year} : ${tminBit}maximale moyenne ${tmax}${ampBit}${rain}${rainDays}${warmDays}${hotDays}${veryHotDays}${extremeHotDays}${frost}${tropical}. Station ${input.stationName}${km}. Ce n’est pas une prévision. ${input.url}`;
}

export function buildShareCardModel(input: {
  placeName: string;
  isoDate: string;
  hasObservation: boolean;
  tminDisplay?: string | null;
  tmaxDisplay?: string | null;
  precipDisplay?: string | null;
  stationName?: string | null;
  distanceKm?: number | null;
  attribution?: string | null;
}): ShareCardModel {
  const dateLabel = frenchLongDate(input.isoDate) || input.isoDate;
  if (!input.hasObservation) {
    return {
      placeName: input.placeName,
      dateLabel,
      hasObservation: false,
      tminDisplay: "non disponible",
      tmaxDisplay: "non disponible",
      precipDisplay: "non disponible",
      stationLine: null,
      attribution: "Observatoire Planète. Aucune valeur n’est inventée.",
      note: "Aucune mesure officielle pour cette date."
    };
  }
  const stationLine =
    input.stationName && input.distanceKm != null
      ? `Mesure officielle · ${input.stationName} · ${input.distanceKm} km`
      : input.stationName
        ? `Mesure officielle · ${input.stationName}`
        : "Mesure officielle";
  return {
    placeName: input.placeName,
    dateLabel,
    hasObservation: true,
    tminDisplay: input.tminDisplay || "non disponible",
    tmaxDisplay: input.tmaxDisplay || "non disponible",
    precipDisplay: input.precipDisplay || "non disponible",
    stationLine,
    attribution: input.attribution?.trim() || "Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0.",
    note: "Ce n’est pas une prévision."
  };
}
