import { frenchLongDate } from "./birthDay";

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
