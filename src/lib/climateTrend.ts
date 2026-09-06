import { roundToPrecision } from "../../packages/weather-core/src/units";

/** Au-dessous, aucune pente n’est affichée. */
export const MIN_TREND_COMPLETE_YEARS = 15;
/** Fenêtre « premières / dernières années climatiques », sans chevauchement. */
export const TREND_WINDOW_YEARS = 10;
export const TREND_METHOD = "ols-complete-years-v1";
export const TREND_METHOD_NOTE =
  "Régression linéaire des moyennes (ou compteurs) des années climatiques d’un seul poste. Série brute Météo-France, pas homogénéisée LSH. Ce n’est pas une expertise certifiée, ni la tendance de la commune entière.";

export type TrendSeriesPoint = {
  year: number;
  yearComplete: boolean;
  tminMean: number | null;
  tmaxMean: number | null;
  daysGe30: number | null;
  daysFrost: number | null;
  tropicalNights: number | null;
};

export type LinearTrendFail = { available: false; reason: string };

export type LinearTrendOk = {
  available: true;
  from: number;
  to: number;
  n: number;
  tmaxPerDecade: number | null;
  tminPerDecade: number | null;
  daysGe30PerDecade: number | null;
  frostPerDecade: number | null;
  tropicalNightsPerDecade: number | null;
  shortSeries: boolean;
};

export type WarmingWindow = {
  from: number;
  to: number;
  n: number;
  tminMean: number | null;
  tmaxMean: number | null;
  daysGe30Mean: number | null;
  frostMean: number | null;
  tropicalNightsMean: number | null;
};

export type WarmingWindowsFail = { comparable: false; reason: string };

export type WarmingWindowsOk = {
  comparable: true;
  early: WarmingWindow;
  late: WarmingWindow;
  tminDelta: number | null;
  tmaxDelta: number | null;
  daysGe30Delta: number | null;
  frostDelta: number | null;
  tropicalNightsDelta: number | null;
};

export type WarmingResult = {
  method: typeof TREND_METHOD;
  homogenized: false;
  minYears: typeof MIN_TREND_COMPLETE_YEARS;
  windowYears: typeof TREND_WINDOW_YEARS;
  linear: LinearTrendFail | LinearTrendOk;
  windows: WarmingWindowsFail | WarmingWindowsOk;
  methodNote: string;
};

function completeYears(series: TrendSeriesPoint[]): TrendSeriesPoint[] {
  return series.filter((row) => row.yearComplete).sort((a, b) => a.year - b.year);
}

function meanOf(values: Array<number | null>): number | null {
  const xs = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return b - a;
}

export function ordinaryLeastSquares(
  xs: number[],
  ys: number[]
): { slope: number; intercept: number } | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: meanY - slope * meanX };
}

function slopePerDecade(complete: TrendSeriesPoint[], pick: (row: TrendSeriesPoint) => number | null): number | null {
  const pairs = complete
    .map((row) => ({ x: row.year, y: pick(row) }))
    .filter((row): row is { x: number; y: number } => row.y != null && Number.isFinite(row.y));
  if (pairs.length < MIN_TREND_COMPLETE_YEARS) return null;
  const fit = ordinaryLeastSquares(
    pairs.map((row) => row.x),
    pairs.map((row) => row.y)
  );
  if (!fit) return null;
  return roundToPrecision(fit.slope * 10, 1);
}

function windowStats(rows: TrendSeriesPoint[]): WarmingWindow {
  const tminMean = roundToPrecision(meanOf(rows.map((row) => row.tminMean)), 1);
  const tmaxMean = roundToPrecision(meanOf(rows.map((row) => row.tmaxMean)), 1);
  const daysGe30Mean = roundToPrecision(meanOf(rows.map((row) => row.daysGe30)), 1);
  const frostMean = roundToPrecision(meanOf(rows.map((row) => row.daysFrost)), 1);
  const tropicalNightsMean = roundToPrecision(meanOf(rows.map((row) => row.tropicalNights)), 1);
  return {
    from: rows[0].year,
    to: rows[rows.length - 1].year,
    n: rows.length,
    tminMean,
    tmaxMean,
    daysGe30Mean,
    frostMean,
    tropicalNightsMean
  };
}

export function stationWarmingTrend(series: TrendSeriesPoint[]): WarmingResult {
  const complete = completeYears(series);
  const tooFew = `Pas assez d’années climatiques sur un seul poste (${complete.length}, il en faut ${MIN_TREND_COMPLETE_YEARS}), sans concaténer d’autres stations.`;

  let linear: LinearTrendFail | LinearTrendOk;
  if (complete.length < MIN_TREND_COMPLETE_YEARS) {
    linear = { available: false, reason: tooFew };
  } else {
    linear = {
      available: true,
      from: complete[0].year,
      to: complete[complete.length - 1].year,
      n: complete.length,
      tmaxPerDecade: slopePerDecade(complete, (row) => row.tmaxMean),
      tminPerDecade: slopePerDecade(complete, (row) => row.tminMean),
      daysGe30PerDecade: slopePerDecade(complete, (row) => row.daysGe30),
      frostPerDecade: slopePerDecade(complete, (row) => row.daysFrost),
      tropicalNightsPerDecade: slopePerDecade(complete, (row) => row.tropicalNights),
      shortSeries: complete.length < 30
    };
  }

  let windows: WarmingWindowsFail | WarmingWindowsOk;
  if (complete.length < TREND_WINDOW_YEARS * 2) {
    windows = {
      comparable: false,
      reason: `Il faut ${TREND_WINDOW_YEARS} années climatiques au début et ${TREND_WINDOW_YEARS} à la fin, sans chevauchement et sans mélanger les postes.`
    };
  } else {
    const earlyRows = complete.slice(0, TREND_WINDOW_YEARS);
    const lateRows = complete.slice(-TREND_WINDOW_YEARS);
    if (earlyRows[earlyRows.length - 1].year >= lateRows[0].year) {
      windows = {
        comparable: false,
        reason: "Les fenêtres se chevauchent : aucun écart n’est affiché."
      };
    } else {
      const early = windowStats(earlyRows);
      const late = windowStats(lateRows);
      windows = {
        comparable: true,
        early,
        late,
        tminDelta: roundToPrecision(delta(early.tminMean, late.tminMean), 1),
        tmaxDelta: roundToPrecision(delta(early.tmaxMean, late.tmaxMean), 1),
        daysGe30Delta: roundToPrecision(delta(early.daysGe30Mean, late.daysGe30Mean), 1),
        frostDelta: roundToPrecision(delta(early.frostMean, late.frostMean), 1),
        tropicalNightsDelta: roundToPrecision(delta(early.tropicalNightsMean, late.tropicalNightsMean), 1)
      };
    }
  }

  return {
    method: TREND_METHOD,
    homogenized: false,
    minYears: MIN_TREND_COMPLETE_YEARS,
    windowYears: TREND_WINDOW_YEARS,
    linear,
    windows,
    methodNote: TREND_METHOD_NOTE
  };
}

export function formatSignedPerDecade(value: number | null, unit: "°C" | "j"): string {
  if (value == null || !Number.isFinite(value)) return "non disponible";
  const n = Math.round(value * 10) / 10;
  const abs = Math.abs(n).toFixed(1);
  const body = n === 0 ? `0.0 ${unit}` : `${n > 0 ? "+" : "-"}${abs} ${unit}`;
  return `${body} / 10 ans`;
}
