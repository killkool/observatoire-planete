import type { YearClimatePoint } from "./compareClimate";
import { annualMeanAmplitudeC } from "../../packages/weather-core/src/units";

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
  /** Max de jours Tmax ≥ 30 °C, années climatiques seulement. 0 est un vrai zéro. */
  mostDaysGe30: ObservedYearRecord | null;
  /** Max de jours Tmin < 0 °C, années climatiques seulement. 0 est un vrai zéro. */
  mostFrost: ObservedYearRecord | null;
  /** Max de nuits Tmin ≥ 20 °C, années climatiques seulement. 0 est un vrai zéro. */
  mostTropicalNights: ObservedYearRecord | null;
  /** Max de jours Tmax ≥ 35 °C, années climatiques seulement. 0 est un vrai zéro. */
  mostDaysGe35: ObservedYearRecord | null;
  /** Max de jours Tmax ≥ 25 °C, années climatiques seulement. 0 est un vrai zéro. */
  mostDaysGe25: ObservedYearRecord | null;
  /** Max de jours à précipitation > 0 mm, années climatiques à pluie complète seulement. 0 est un vrai zéro. */
  mostDaysRain: ObservedYearRecord | null;
  /** Max de l’écart min-max annuel dérivé Tmin/Tmax, années climatiques seulement. 0.0 est un vrai zéro. */
  largestAmplitude: ObservedYearRecord | null;
  /** Min de la pluie annuelle, années climatiques à pluie complète seulement. 0.0 est un vrai zéro. */
  driest: ObservedYearRecord | null;
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
  const driest = withPrecip.reduce<YearClimatePoint | null>(
    (best, row) =>
      best == null || (row.precipitationSum as number) < (best.precipitationSum as number) ? row : best,
    null
  );
  const mostDaysGe30 = complete.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || row.daysGe30 > best.daysGe30 ? row : best),
    null
  );
  const withFrost = complete.filter((row) => row.daysFrost != null);
  const mostFrost = withFrost.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.daysFrost as number) > (best.daysFrost as number) ? row : best),
    null
  );
  const withTropicalNights = complete.filter((row) => row.tropicalNights != null);
  const mostTropicalNights = withTropicalNights.reduce<YearClimatePoint | null>(
    (best, row) =>
      best == null || (row.tropicalNights as number) > (best.tropicalNights as number) ? row : best,
    null
  );
  const withDaysGe35 = complete.filter((row) => row.daysGe35 != null);
  const mostDaysGe35 = withDaysGe35.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.daysGe35 as number) > (best.daysGe35 as number) ? row : best),
    null
  );
  const withDaysGe25 = complete.filter((row) => row.daysGe25 != null);
  const mostDaysGe25 = withDaysGe25.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.daysGe25 as number) > (best.daysGe25 as number) ? row : best),
    null
  );
  const withDaysRain = complete.filter((row) => row.precipComplete && row.daysRain != null);
  const mostDaysRain = withDaysRain.reduce<YearClimatePoint | null>(
    (best, row) => (best == null || (row.daysRain as number) > (best.daysRain as number) ? row : best),
    null
  );
  const withAmplitude = complete.filter((row) => annualMeanAmplitudeC(row.tminMean, row.tmaxMean) != null);
  const largestAmplitude = withAmplitude.reduce<YearClimatePoint | null>(
    (best, row) => {
      const amp = annualMeanAmplitudeC(row.tminMean, row.tmaxMean) as number;
      const bestAmp = best == null ? null : (annualMeanAmplitudeC(best.tminMean, best.tmaxMean) as number);
      return best == null || amp > (bestAmp as number) ? row : best;
    },
    null
  );
  const largestAmplitudeValue =
    largestAmplitude != null ? annualMeanAmplitudeC(largestAmplitude.tminMean, largestAmplitude.tmaxMean) : null;
  return {
    periodFrom: complete[0]?.year ?? null,
    periodTo: complete[complete.length - 1]?.year ?? null,
    yearsUsed: complete.length,
    hottest: hottest?.tmaxMean != null ? { year: hottest.year, value: hottest.tmaxMean } : null,
    coldest: coldest?.tminMean != null ? { year: coldest.year, value: coldest.tminMean } : null,
    wettest: wettest?.precipitationSum != null ? { year: wettest.year, value: wettest.precipitationSum } : null,
    mostDaysGe30: mostDaysGe30 != null ? { year: mostDaysGe30.year, value: mostDaysGe30.daysGe30 } : null,
    mostFrost: mostFrost?.daysFrost != null ? { year: mostFrost.year, value: mostFrost.daysFrost } : null,
    mostTropicalNights:
      mostTropicalNights?.tropicalNights != null
        ? { year: mostTropicalNights.year, value: mostTropicalNights.tropicalNights }
        : null,
    mostDaysGe35: mostDaysGe35?.daysGe35 != null ? { year: mostDaysGe35.year, value: mostDaysGe35.daysGe35 } : null,
    mostDaysGe25: mostDaysGe25?.daysGe25 != null ? { year: mostDaysGe25.year, value: mostDaysGe25.daysGe25 } : null,
    mostDaysRain: mostDaysRain?.daysRain != null ? { year: mostDaysRain.year, value: mostDaysRain.daysRain } : null,
    largestAmplitude:
      largestAmplitudeValue != null && largestAmplitude != null
        ? { year: largestAmplitude.year, value: largestAmplitudeValue }
        : null,
    driest: driest?.precipitationSum != null ? { year: driest.year, value: driest.precipitationSum } : null
  };
}
