import { frenchLongDate } from "./birthDay";
import { formatCelsius, formatMm } from "../../packages/weather-core/src/units";

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
  tmaxDisplay: string;
  precipDisplay: string | null;
  stationLine: string;
  attribution: string;
  note: string;
};

export function buildClimateShareCardModel(input: {
  placeName: string;
  year: number;
  tmaxMean: number | null;
  precipitationSum: number | null;
  precipComplete: boolean;
  stationName: string;
  distanceKm: number | null;
}): ClimateShareCardModel | null {
  if (input.tmaxMean == null) return null;
  const km = input.distanceKm != null ? ` · ${input.distanceKm} km` : "";
  return {
    placeName: input.placeName,
    year: input.year,
    tmaxDisplay: formatCelsius(input.tmaxMean),
    precipDisplay:
      input.precipComplete && input.precipitationSum != null ? formatMm(input.precipitationSum) : null,
    stationLine: `Année climatique complète · ${input.stationName}${km}`,
    attribution:
      "Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0.",
    note: "Ce n’est pas une prévision."
  };
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
