import type { YearClimatePoint } from "./compareClimate";

export const DEFAULT_NORMAL_PERIOD = "1991-2020";
export const DEFAULT_NORMAL_START = 1991;
export const DEFAULT_NORMAL_END = 2020;
/** 80 % d’une normale trentenaire (30 × 0,8). */
export const MIN_NORMAL_COMPLETE_YEARS = 24;

export function isNormalComplete(yearsUsed: number, minYears = MIN_NORMAL_COMPLETE_YEARS): boolean {
  return yearsUsed >= minYears;
}

export function anomaly(value: number | null | undefined, normal: number | null | undefined): number | null {
  if (value == null || normal == null || !Number.isFinite(value) || !Number.isFinite(normal)) return null;
  return value - normal;
}

export type ObservedYearRecord = {
  year: number;
  value: number;
};

export type ObservedYearRecords = {
  periodFrom: number | null;
  periodTo: number | null;
  yearsUsed: number;
  hottest: ObservedYearRecord | null;
  coldest: ObservedYearRecord | null;
  wettest: ObservedYearRecord | null;
};

export function observedYearRecords(years: YearClimatePoint[]): ObservedYearRecords {
  const complete = years.filter((row) => row.yearComplete);
  const withTmax = complete.filter((row) => row.tmaxMean != null);
  const withTmin = complete.filter((row) => row.tminMean != null);
  const withPrecip = complete.filter((row) => row.precipComplete && row.precipitationSum != null);
  const hottest = withTmax.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.tmaxMean as number) > (best.tmaxMean as number) ? row : best),
    null
  );
  const coldest = withTmin.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.tminMean as number) < (best.tminMean as number) ? row : best),
    null
  );
  const wettest = withPrecip.reduce<YearClimatePoint | null>(
    (best, row) =>
      best == null || (row.precipitationSum as number) > (best.precipitationSum as number) ? row : best,
    null
  );
  return {
    periodFrom: complete[0]?.year ?? null,
    periodTo: complete[complete.length - 1]?.year ?? null,
    yearsUsed: complete.length,
    hottest: hottest?.tmaxMean != null ? { year: hottest.year, value: hottest.tmaxMean } : null,
    coldest: coldest?.tminMean != null ? { year: coldest.year, value: coldest.tminMean } : null,
    wettest: wettest?.precipitationSum != null ? { year: wettest.year, value: wettest.precipitationSum } : null
  };
}
