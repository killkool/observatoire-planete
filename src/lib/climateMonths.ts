import type { CompareFail, YearCompareOk } from "./compareClimate";
import { roundToPrecision } from "../../packages/weather-core/src/units";

export const MONTH_NAMES_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
] as const;

export const MONTH_SHORT_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc."
] as const;

export type MonthClimatePoint = {
  year: number;
  month: number;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysGe30: number;
  monthComplete: boolean;
  precipComplete: boolean;
};

export type ObservedMonthRecord = {
  year: number;
  month: number;
  value: number;
};

export type ObservedMonthRecords = {
  hottest: ObservedMonthRecord | null;
  coldest: ObservedMonthRecord | null;
  wettest: ObservedMonthRecord | null;
};

export const MONTH_NORMAL_METHOD = "month-normal-1991-2020-v1";

export type MonthNormalPoint = {
  month: number;
  yearsUsed: number;
  yearsPrecip: number;
  available: boolean;
  precipAvailable: boolean;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationMean: number | null;
};

function meanOf(values: Array<number | null>): number | null {
  const known = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!known.length) return null;
  return roundToPrecision(known.reduce((sum, v) => sum + v, 0) / known.length, 1);
}

export function monthNormalsFromStats(
  rows: MonthClimatePoint[],
  periodStart: number,
  periodEnd: number,
  minYears: number
): MonthNormalPoint[] {
  return MONTH_NAMES_FR.map((_, i) => {
    const month = i + 1;
    const inPeriod = rows.filter((row) => row.month === month && row.year >= periodStart && row.year <= periodEnd);
    const complete = inPeriod.filter((row) => row.monthComplete);
    const precipOk = inPeriod.filter((row) => row.precipComplete && row.precipitationSum != null);
    const tminMean = meanOf(complete.map((row) => row.tminMean));
    const tmaxMean = meanOf(complete.map((row) => row.tmaxMean));
    const available = complete.length >= minYears && tminMean != null && tmaxMean != null;
    const precipitationMean = meanOf(precipOk.map((row) => row.precipitationSum));
    const precipAvailable = precipOk.length >= minYears && precipitationMean != null;
    return {
      month,
      yearsUsed: complete.length,
      yearsPrecip: precipOk.length,
      available,
      precipAvailable,
      tminMean: available ? tminMean : null,
      tmaxMean: available ? tmaxMean : null,
      precipitationMean: precipAvailable ? precipitationMean : null
    };
  });
}

export function monthNormalProfileComplete(points: MonthNormalPoint[]): boolean {
  return points.length === 12 && points.every((row) => row.available);
}

export function monthNameFr(month: number): string {
  if (month < 1 || month > 12) return "mois inconnu";
  return MONTH_NAMES_FR[month - 1];
}

export function monthShortFr(month: number): string {
  if (month < 1 || month > 12) return "?";
  return MONTH_SHORT_FR[month - 1];
}

export function formatMonthYear(year: number, month: number): string {
  return `${monthNameFr(month)} ${year}`;
}

function completeMonths(rows: MonthClimatePoint[]): MonthClimatePoint[] {
  return rows.filter((row) => row.monthComplete);
}

export function hottestCompleteMonth(rows: MonthClimatePoint[]): MonthClimatePoint | null {
  const complete = completeMonths(rows).filter((row) => row.tmaxMean != null);
  if (!complete.length) return null;
  return complete.reduce((best, row) => ((row.tmaxMean as number) > (best.tmaxMean as number) ? row : best));
}

export function coldestCompleteMonth(rows: MonthClimatePoint[]): MonthClimatePoint | null {
  const complete = completeMonths(rows).filter((row) => row.tminMean != null);
  if (!complete.length) return null;
  return complete.reduce((best, row) => ((row.tminMean as number) < (best.tminMean as number) ? row : best));
}

export function wettestCompleteMonth(rows: MonthClimatePoint[]): MonthClimatePoint | null {
  const wet = rows.filter((row) => row.monthComplete && row.precipComplete && row.precipitationSum != null);
  if (!wet.length) return null;
  return wet.reduce((best, row) => ((row.precipitationSum as number) > (best.precipitationSum as number) ? row : best));
}

export function observedMonthRecords(rows: MonthClimatePoint[]): ObservedMonthRecords {
  const hottest = hottestCompleteMonth(rows);
  const coldest = coldestCompleteMonth(rows);
  const wettest = wettestCompleteMonth(rows);
  return {
    hottest: hottest?.tmaxMean != null ? { year: hottest.year, month: hottest.month, value: hottest.tmaxMean } : null,
    coldest: coldest?.tminMean != null ? { year: coldest.year, month: coldest.month, value: coldest.tminMean } : null,
    wettest: wettest?.precipitationSum != null ? { year: wettest.year, month: wettest.month, value: wettest.precipitationSum } : null
  };
}

export function yearsWithTwelveCompleteMonths(rows: MonthClimatePoint[]): number[] {
  const counts = new Map<number, number>();
  for (const row of completeMonths(rows)) {
    counts.set(row.year, (counts.get(row.year) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 12)
    .map(([year]) => year)
    .sort((a, b) => a - b);
}

export function yearsWithAnyCompleteMonth(rows: MonthClimatePoint[]): number[] {
  return [...new Set(completeMonths(rows).map((row) => row.year))].sort((a, b) => a - b);
}

export function monthChartRows(
  rows: MonthClimatePoint[],
  year: number,
  normals?: MonthNormalPoint[] | null
): Array<{
  month: number;
  label: string;
  tmin: number | null;
  tmax: number | null;
  normalTmin: number | null;
  normalTmax: number | null;
}> {
  const byMonth = new Map(rows.filter((row) => row.year === year).map((row) => [row.month, row]));
  const normalsByMonth = new Map((normals || []).map((row) => [row.month, row]));
  return MONTH_NAMES_FR.map((_, i) => {
    const month = i + 1;
    const row = byMonth.get(month);
    const complete = Boolean(row?.monthComplete);
    const normal = normalsByMonth.get(month);
    return {
      month,
      label: monthShortFr(month),
      tmin: complete ? row?.tminMean ?? null : null,
      tmax: complete ? row?.tmaxMean ?? null : null,
      normalTmin: normal?.available ? normal.tminMean : null,
      normalTmax: normal?.available ? normal.tmaxMean : null
    };
  });
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return roundToPrecision(b - a, 1);
}

export function compareCompleteMonths(
  a: MonthClimatePoint | undefined,
  b: MonthClimatePoint | undefined
): CompareFail | (YearCompareOk & { month: number }) {
  if (!a || !b) {
    return { comparable: false, reason: "Mois inconnu pour cette station." };
  }
  if (a.month !== b.month) {
    return { comparable: false, reason: "Ne pas comparer deux mois différents (juillet vs janvier)." };
  }
  if (a.year === b.year) {
    return { comparable: false, reason: "Choisissez deux années différentes." };
  }
  if (!a.monthComplete || !b.monthComplete) {
    return {
      comparable: false,
      reason: "Un mois incomplet n’est pas une climatologie : la comparaison n’est pas affichée."
    };
  }
  return {
    comparable: true,
    month: a.month,
    yearA: a.year,
    yearB: b.year,
    tminDelta: delta(a.tminMean, b.tminMean),
    tmaxDelta: delta(a.tmaxMean, b.tmaxMean),
    daysGe30Delta: b.daysGe30 - a.daysGe30,
    precipDelta: a.precipComplete && b.precipComplete ? delta(a.precipitationSum, b.precipitationSum) : null
  };
}
