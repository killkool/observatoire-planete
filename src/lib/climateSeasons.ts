import type { SeasonClimatePoint } from "./compareClimate";

export type SeasonCode = SeasonClimatePoint["season"];

export const SEASON_CODES: SeasonCode[] = ["DJF", "MAM", "JJA", "SON"];

export function seasonPublicLabel(season: SeasonCode): {
  eyebrow: string;
  title: string;
  months: string;
  recordKind: "coldest" | "hottest";
} {
  if (season === "DJF") {
    return {
      eyebrow: "LES HIVERS",
      title: "Décembre à février, assez observés",
      months: "Hiver météorologique : décembre, janvier, février. L’hiver est étiqueté par l’année de janvier : le décembre 2009 compte pour l’hiver 2010.",
      recordKind: "coldest"
    };
  }
  if (season === "MAM") {
    return {
      eyebrow: "LES PRINTEMPS",
      title: "Mars à mai, assez observés",
      months: "Printemps météorologique : mars, avril, mai.",
      recordKind: "hottest"
    };
  }
  if (season === "SON") {
    return {
      eyebrow: "LES AUTOMNES",
      title: "Septembre à novembre, assez observés",
      months: "Automne météorologique : septembre, octobre, novembre.",
      recordKind: "hottest"
    };
  }
  return {
    eyebrow: "LES ÉTÉS",
    title: "Juin à août, assez observés",
    months: "Été météorologique : juin, juillet, août.",
    recordKind: "hottest"
  };
}

export function seasonSelectLabel(season: SeasonCode): string {
  if (season === "DJF") return "Hiver";
  if (season === "MAM") return "Printemps";
  if (season === "SON") return "Automne";
  return "Été";
}

export function coldestCompleteSeason(rows: SeasonClimatePoint[]): SeasonClimatePoint | null {
  const complete = rows.filter((row) => row.seasonComplete && row.tminMean != null);
  if (!complete.length) return null;
  return complete.reduce((best, row) => ((row.tminMean as number) < (best.tminMean as number) ? row : best));
}

export function hottestCompleteSeasonOf(rows: SeasonClimatePoint[], season: SeasonCode): SeasonClimatePoint | null {
  const complete = rows.filter((row) => row.season === season && row.seasonComplete && row.tmaxMean != null);
  if (!complete.length) return null;
  return complete.reduce((best, row) => ((row.tmaxMean as number) > (best.tmaxMean as number) ? row : best));
}

export function coldestCompleteSeasonOf(rows: SeasonClimatePoint[], season: SeasonCode): SeasonClimatePoint | null {
  return coldestCompleteSeason(rows.filter((row) => row.season === season));
}

export function isSeasonCode(value: string): value is SeasonCode {
  return SEASON_CODES.includes(value as SeasonCode);
}
