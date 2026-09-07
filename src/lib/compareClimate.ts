export type YearClimatePoint = {
  year: number;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysRain?: number;
  daysGe25?: number;
  daysGe30: number;
  daysGe35?: number;
  daysGe40?: number;
  daysFrost?: number;
  tropicalNights?: number;
  amplitude?: number;
  yearComplete: boolean;
  precipComplete: boolean;
  tminAnomaly?: number | null;
  tmaxAnomaly?: number | null;
};

export type SeasonClimatePoint = {
  year: number;
  season: "DJF" | "MAM" | "JJA" | "SON";
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  daysGe30: number;
  seasonComplete: boolean;
  precipComplete: boolean;
};

export type CompareFail = { comparable: false; reason: string };

export type YearCompareOk = {
  comparable: true;
  yearA: number;
  yearB: number;
  tminDelta: number | null;
  tmaxDelta: number | null;
  daysGe30Delta: number;
  precipDelta: number | null;
};

export type ChildhoodCompareOk = {
  comparable: true;
  childhood: { from: number; to: number; n: number; tminMean: number | null; tmaxMean: number | null };
  recent: { from: number; to: number; n: number; tminMean: number | null; tmaxMean: number | null };
  tminDelta: number | null;
  tmaxDelta: number | null;
};

function meanOf(values: Array<number | null>): number | null {
  const xs = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return b - a;
}

export function compareCompleteYears(
  a: YearClimatePoint | undefined,
  b: YearClimatePoint | undefined
): CompareFail | YearCompareOk {
  if (!a || !b) {
    return { comparable: false, reason: "Année inconnue pour cette station." };
  }
  if (a.year === b.year) {
    return { comparable: false, reason: "Choisissez deux années différentes." };
  }
  if (!a.yearComplete || !b.yearComplete) {
    return {
      comparable: false,
      reason: "Une année incomplète n’est pas une année climatique : la comparaison n’est pas affichée."
    };
  }
  return {
    comparable: true,
    yearA: a.year,
    yearB: b.year,
    tminDelta: delta(a.tminMean, b.tminMean),
    tmaxDelta: delta(a.tmaxMean, b.tmaxMean),
    daysGe30Delta: b.daysGe30 - a.daysGe30,
    precipDelta: a.precipComplete && b.precipComplete ? delta(a.precipitationSum, b.precipitationSum) : null
  };
}

export function compareCompleteSeasons(
  a: SeasonClimatePoint | undefined,
  b: SeasonClimatePoint | undefined
): CompareFail | YearCompareOk {
  if (!a || !b) {
    return { comparable: false, reason: "Saison inconnue pour cette station." };
  }
  if (a.year === b.year && a.season === b.season) {
    return { comparable: false, reason: "Choisissez deux saisons différentes." };
  }
  if (a.season !== b.season) {
    return { comparable: false, reason: "Ne pas comparer deux saisons différentes (été vs hiver)." };
  }
  if (!a.seasonComplete || !b.seasonComplete) {
    return {
      comparable: false,
      reason: "Une saison incomplète n’est pas une climatologie : la comparaison n’est pas affichée."
    };
  }
  return {
    comparable: true,
    yearA: a.year,
    yearB: b.year,
    tminDelta: delta(a.tminMean, b.tminMean),
    tmaxDelta: delta(a.tmaxMean, b.tmaxMean),
    daysGe30Delta: b.daysGe30 - a.daysGe30,
    precipDelta: a.precipComplete && b.precipComplete ? delta(a.precipitationSum, b.precipitationSum) : null
  };
}

export function hottestCompleteSeason(rows: SeasonClimatePoint[]): SeasonClimatePoint | null {
  const complete = rows.filter((row) => row.seasonComplete && row.tmaxMean != null);
  if (!complete.length) return null;
  return complete.reduce((best, row) => ((row.tmaxMean as number) > (best.tmaxMean as number) ? row : best));
}

export function childhoodVsRecent(
  years: YearClimatePoint[],
  birthYear: number,
  asOfYear: number,
  options?: { childhoodSpan?: number; recentSpan?: number; minCompleteYears?: number }
): CompareFail | ChildhoodCompareOk {
  if (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > asOfYear) {
    return { comparable: false, reason: "Date de naissance hors série." };
  }
  const childhoodSpan = options?.childhoodSpan ?? 12;
  const recentSpan = options?.recentSpan ?? 10;
  const minN = options?.minCompleteYears ?? 5;
  const childhoodUntil = birthYear + childhoodSpan;
  const recentFrom = asOfYear - recentSpan;
  const complete = years.filter((row) => row.yearComplete);
  const childhoodRows = complete.filter((row) => row.year >= birthYear && row.year <= childhoodUntil);
  const recentRows = complete.filter(
    (row) => row.year > childhoodUntil && row.year >= recentFrom && row.year <= asOfYear
  );
  if (childhoodRows.length < minN || recentRows.length < minN) {
    return {
      comparable: false,
      reason: "Pas assez d’années complètes, sans chevauchement, pour comparer l’enfance et les années récentes."
    };
  }
  const childhoodTmin = meanOf(childhoodRows.map((row) => row.tminMean));
  const childhoodTmax = meanOf(childhoodRows.map((row) => row.tmaxMean));
  const recentTmin = meanOf(recentRows.map((row) => row.tminMean));
  const recentTmax = meanOf(recentRows.map((row) => row.tmaxMean));
  return {
    comparable: true,
    childhood: {
      from: childhoodRows[0].year,
      to: childhoodRows[childhoodRows.length - 1].year,
      n: childhoodRows.length,
      tminMean: childhoodTmin,
      tmaxMean: childhoodTmax
    },
    recent: {
      from: recentRows[0].year,
      to: recentRows[recentRows.length - 1].year,
      n: recentRows.length,
      tminMean: recentTmin,
      tmaxMean: recentTmax
    },
    tminDelta: delta(childhoodTmin, recentTmin),
    tmaxDelta: delta(childhoodTmax, recentTmax)
  };
}

export function formatSignedCelsius(deltaC: number | null): string {
  if (deltaC == null || !Number.isFinite(deltaC)) return "non disponible";
  const n = Math.round(deltaC * 10) / 10;
  const abs = Math.abs(n).toFixed(1);
  if (n === 0) return "0.0 °C";
  return n > 0 ? `+${abs} °C` : `-${abs} °C`;
}

export function formatSignedMm(deltaMm: number | null): string {
  if (deltaMm == null || !Number.isFinite(deltaMm)) return "non disponible";
  const n = Math.round(deltaMm * 10) / 10;
  const abs = Math.abs(n).toFixed(1);
  if (n === 0) return "0.0 mm";
  return n > 0 ? `+${abs} mm` : `-${abs} mm`;
}

export const MIN_CITY_OVERLAP_YEARS = 5;

export type CityClimateSide = {
  insee: string;
  name: string;
  station: { id: string; name: string; distanceKm: number | null } | null;
  years: YearClimatePoint[];
  normal: {
    available: boolean;
    sameStation: boolean;
    period: string;
    tminMean: number | null;
    tmaxMean: number | null;
    precipitationMean: number | null;
    precipAvailable: boolean;
    stationId: string | null;
  };
};

export type CityOverlapOk = {
  comparable: true;
  from: number;
  to: number;
  n: number;
  tminMeanA: number | null;
  tmaxMeanA: number | null;
  tminMeanB: number | null;
  tmaxMeanB: number | null;
  tminDelta: number | null;
  tmaxDelta: number | null;
  precipMeanA: number | null;
  precipMeanB: number | null;
  precipDelta: number | null;
  precipYears: number;
};

export type CityNormalOk = {
  comparable: true;
  period: string;
  tminMeanA: number | null;
  tmaxMeanA: number | null;
  tminMeanB: number | null;
  tmaxMeanB: number | null;
  tminDelta: number | null;
  tmaxDelta: number | null;
  precipMeanA: number | null;
  precipMeanB: number | null;
  precipDelta: number | null;
};

export function compareCityClimate(a: CityClimateSide, b: CityClimateSide): {
  sameStation: boolean;
  overlap: CompareFail | CityOverlapOk;
  normals: CompareFail | CityNormalOk;
} {
  if (a.insee === b.insee) {
    const reason = "Choisissez deux communes différentes.";
    return {
      sameStation: Boolean(a.station?.id && a.station.id === b.station?.id),
      overlap: { comparable: false, reason },
      normals: { comparable: false, reason }
    };
  }

  const sameStation = Boolean(a.station?.id && b.station?.id && a.station.id === b.station.id);
  if (sameStation) {
    const reason = `Les deux communes s’appuient sur le même poste climatique (${a.station?.name}). Ce n’est pas deux séries indépendantes : aucun écart n’est affiché.`;
    return {
      sameStation: true,
      overlap: { comparable: false, reason },
      normals: { comparable: false, reason }
    };
  }

  if (!a.station || !b.station) {
    const reason = "Une des communes n’a pas de série climatique précalculée.";
    return { sameStation: false, overlap: { comparable: false, reason }, normals: { comparable: false, reason } };
  }

  const yearsA = new Map(a.years.filter((row) => row.yearComplete).map((row) => [row.year, row]));
  const overlapYears = b.years
    .filter((row) => row.yearComplete && yearsA.has(row.year))
    .map((row) => row.year)
    .sort((x, y) => x - y);

  let overlap: CompareFail | CityOverlapOk;
  if (overlapYears.length < MIN_CITY_OVERLAP_YEARS) {
    overlap = {
      comparable: false,
      reason: `Pas assez d’années climatiques communes (${overlapYears.length}, il en faut ${MIN_CITY_OVERLAP_YEARS}), sans mélanger les postes.`
    };
  } else {
    const rowsA = overlapYears.map((year) => yearsA.get(year)!);
    const rowsB = overlapYears.map((year) => b.years.find((row) => row.year === year)!);
    const precipPairs = overlapYears
      .map((year) => ({ a: yearsA.get(year)!, b: rowsB.find((row) => row.year === year)! }))
      .filter((pair) => pair.a.precipComplete && pair.b.precipComplete);
    const precipMeanA = precipPairs.length >= MIN_CITY_OVERLAP_YEARS ? meanOf(precipPairs.map((pair) => pair.a.precipitationSum)) : null;
    const precipMeanB = precipPairs.length >= MIN_CITY_OVERLAP_YEARS ? meanOf(precipPairs.map((pair) => pair.b.precipitationSum)) : null;
    const tminMeanA = meanOf(rowsA.map((row) => row.tminMean));
    const tmaxMeanA = meanOf(rowsA.map((row) => row.tmaxMean));
    const tminMeanB = meanOf(rowsB.map((row) => row.tminMean));
    const tmaxMeanB = meanOf(rowsB.map((row) => row.tmaxMean));
    overlap = {
      comparable: true,
      from: overlapYears[0],
      to: overlapYears[overlapYears.length - 1],
      n: overlapYears.length,
      tminMeanA,
      tmaxMeanA,
      tminMeanB,
      tmaxMeanB,
      tminDelta: delta(tminMeanA, tminMeanB),
      tmaxDelta: delta(tmaxMeanA, tmaxMeanB),
      precipMeanA,
      precipMeanB,
      precipDelta: delta(precipMeanA, precipMeanB),
      precipYears: precipPairs.length
    };
  }

  let normals: CompareFail | CityNormalOk;
  if (!a.normal.available || !a.normal.sameStation || !b.normal.available || !b.normal.sameStation) {
    normals = {
      comparable: false,
      reason:
        "Normale 1991-2020 comparable seulement si chaque commune a sa propre station avec au moins 24 années climatiques sur la période."
    };
  } else if (a.normal.stationId && a.normal.stationId === b.normal.stationId) {
    normals = {
      comparable: false,
      reason: "Les deux normales viennent du même poste : ce n’est pas une comparaison entre deux climats."
    };
  } else if (a.normal.period !== b.normal.period) {
    normals = { comparable: false, reason: "Les périodes de normale ne sont pas les mêmes." };
  } else {
    const precipA = a.normal.precipAvailable ? a.normal.precipitationMean : null;
    const precipB = b.normal.precipAvailable ? b.normal.precipitationMean : null;
    normals = {
      comparable: true,
      period: a.normal.period,
      tminMeanA: a.normal.tminMean,
      tmaxMeanA: a.normal.tmaxMean,
      tminMeanB: b.normal.tminMean,
      tmaxMeanB: b.normal.tmaxMean,
      tminDelta: delta(a.normal.tminMean, b.normal.tminMean),
      tmaxDelta: delta(a.normal.tmaxMean, b.normal.tmaxMean),
      precipMeanA: precipA,
      precipMeanB: precipB,
      precipDelta: delta(precipA, precipB)
    };
  }

  return { sameStation: false, overlap, normals };
}
