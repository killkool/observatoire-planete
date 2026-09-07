import { rankStationsForPlace } from "../../packages/source-engine/src/stationMatch";
import { annualMeanAmplitudeC, roundToPrecision } from "../../packages/weather-core/src/units";
import {
  childhoodVsRecent,
  compareCityClimate,
  compareCompleteYears,
  hottestCompleteSeason,
  type ChildhoodCompareOk,
  type CompareFail,
  type SeasonClimatePoint,
  type YearClimatePoint
} from "./compareClimate";
import {
  anomaly,
  DEFAULT_NORMAL_PERIOD,
  DEFAULT_NORMAL_END,
  DEFAULT_NORMAL_START,
  MIN_NORMAL_COMPLETE_YEARS,
  observedYearRecords,
  type ObservedYearRecords
} from "./climateNormals";
import { stationWarmingTrend, type WarmingResult } from "./climateTrend";
import { emptyHeatStreaks, stationHeatStreaks, type DailyTmax, type HeatStreakResult } from "./climateHeatStreaks";
import { coldestCompleteSeasonOf } from "./climateSeasons";
import {
  monthNormalProfileComplete,
  monthNormalsFromStats,
  MONTH_NORMAL_METHOD,
  observedMonthRecords,
  type MonthClimatePoint,
  type MonthNormalPoint,
  type ObservedMonthRecords
} from "./climateMonths";
import {
  listClimateStationCoverage,
  resolveClimateStationForPlace
} from "./climateStations";
import {
  listAnnualStats,
  listCompleteNormalStations,
  listCompleteMonthNormalStations,
  listMonthlyStats,
  listSeasonalStats,
  getStationNormal,
  STATS_METHOD,
  COMPLETE_DAY_THRESHOLD,
  COMPLETE_MONTH_DAY_THRESHOLD,
  COMPLETE_SEASON_DAY_THRESHOLD
} from "./computeStatistics";
import db from "./db";
import { getPlaceByInsee, type PlaceRow } from "./placeHistory";
import { communePath } from "./placeUrl";

type ChildhoodEligibleRow = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  child_n: number;
  recent_n: number;
};

export type CommuneNormalPayload = {
  period: string;
  minYearsRequired: number;
  available: boolean;
  sameStation: boolean;
  yearsUsed: number;
  station: {
    id: string;
    name: string;
    distanceKm: number | null;
  } | null;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationMean: number | null;
  precipAvailable: boolean;
  reason: string | null;
};

export type CommuneMonthNormalPayload = {
  period: string;
  methodVersion: string;
  minYearsRequired: number;
  available: boolean;
  sameStation: boolean;
  yearsUsed: number;
  station: {
    id: string;
    name: string;
    distanceKm: number | null;
  } | null;
  reason: string | null;
  months: MonthNormalPoint[];
};

export type CommuneYearlyPayload = {
  computed: boolean;
  /** false = page HTML sans mois / saisons / chaleur ; l’API /yearly reste complète. */
  detailRows: boolean;
  methodVersion: string;
  completeDayThreshold: number;
  completeMonthDayThreshold: number;
  completeSeasonDayThreshold: number;
  commune: {
    insee: string;
    name: string;
    slug: string;
  };
  station: {
    id: string;
    name: string;
    distanceKm: number | null;
    altitudeDeltaM: number | null;
    completeYears: number;
    yearsInTable: number;
  } | null;
  disclaimer: string | null;
  years: YearClimatePoint[];
  seasons: SeasonClimatePoint[];
  summers: SeasonClimatePoint[];
  hottestSummer: SeasonClimatePoint | null;
  coldestWinter: SeasonClimatePoint | null;
  months: MonthClimatePoint[];
  monthRecords: ObservedMonthRecords;
  normal: CommuneNormalPayload;
  monthNormal: CommuneMonthNormalPayload;
  yearRecords: ObservedYearRecords;
  warming: WarmingResult;
  heat: HeatStreakResult;
};

export function getCommuneYearly(
  insee: string,
  options?: { includeMonthRows?: boolean; includeDetailRows?: boolean }
): CommuneYearlyPayload | null {
  const place = getPlaceByInsee(insee);
  if (!place) return null;

  const computed = (db.prepare(`SELECT COUNT(*) AS c FROM annual_statistics`).get() as { c: number }).c > 0;
  if (!computed) {
    return emptyPayload(place, false);
  }

  const stations = listClimateStationCoverage();
  const preferred = resolveClimateStationForPlace(place, stations);
  if (!preferred) return emptyPayload(place, true);

  const meta = stations.find((s) => s.id === preferred.id);
  const altitudeDeltaM =
    preferred.altitude != null && place.altitude_m != null ? preferred.altitude - place.altitude_m : preferred.altitude;
  const distanceKm = roundToPrecision(preferred.distanceKm, 2);
  const seasons: SeasonClimatePoint[] = listSeasonalStats(preferred.id).map((row) => ({
    year: row.year,
    season: row.season,
    tminMean: roundToPrecision(row.tmin_mean, 1),
    tmaxMean: roundToPrecision(row.tmax_mean, 1),
    precipitationSum: row.precip_complete ? roundToPrecision(row.precipitation_sum, 1) : null,
    daysGe30: row.days_ge_30,
    seasonComplete: row.season_complete === 1,
    precipComplete: row.precip_complete === 1
  }));
  const summers = seasons.filter((row) => row.season === "JJA");
  const months: MonthClimatePoint[] = listMonthlyStats(preferred.id).map((row) => ({
    year: row.year,
    month: row.month,
    tminMean: roundToPrecision(row.tmin_mean, 1),
    tmaxMean: roundToPrecision(row.tmax_mean, 1),
    precipitationSum: row.precip_complete ? roundToPrecision(row.precipitation_sum, 1) : null,
    daysGe30: row.days_ge_30,
    monthComplete: row.month_complete === 1,
    precipComplete: row.precip_complete === 1
  }));

  const ownNormalRow = getStationNormal(preferred.id);
  const ownComplete = ownNormalRow?.normal_complete === 1;
  const ownTmin = ownComplete && ownNormalRow ? roundToPrecision(ownNormalRow.tmin_mean, 1) : null;
  const ownTmax = ownComplete && ownNormalRow ? roundToPrecision(ownNormalRow.tmax_mean, 1) : null;
  const annualRows = listAnnualStats(preferred.id);
  const years: YearClimatePoint[] = annualRows.map((row) => {
    const tminMean = roundToPrecision(row.tmin_mean, 1);
    const tmaxMean = roundToPrecision(row.tmax_mean, 1);
    const yearComplete = row.year_complete === 1;
    return {
      year: row.year,
      tminMean,
      tmaxMean,
      precipitationSum: row.precip_complete ? roundToPrecision(row.precipitation_sum, 1) : null,
      daysRain: row.precip_complete === 1 ? row.days_rain : undefined,
      daysGe25: row.days_ge_25,
      daysGe30: row.days_ge_30,
      daysGe35: row.days_ge_35,
      daysGe40: row.days_ge_40,
      daysFrost: row.days_frost,
      tropicalNights: row.tropical_nights,
      amplitude: annualMeanAmplitudeC(tminMean, tmaxMean) ?? undefined,
      yearComplete,
      precipComplete: row.precip_complete === 1,
      tminAnomaly: yearComplete && ownComplete ? roundToPrecision(anomaly(tminMean, ownTmin), 1) : null,
      tmaxAnomaly: yearComplete && ownComplete ? roundToPrecision(anomaly(tmaxMean, ownTmax), 1) : null
    };
  });
  const warming = stationWarmingTrend(
    annualRows.map((row) => ({
      year: row.year,
      yearComplete: row.year_complete === 1,
      tminMean: row.tmin_mean,
      tmaxMean: row.tmax_mean,
      daysGe30: row.days_ge_30,
      daysFrost: row.days_frost,
      tropicalNights: row.tropical_nights
    }))
  );

  const normal = resolveCommuneNormal({
    place,
    climateStationId: preferred.id,
    climateStationName: preferred.name,
    climateDistanceKm: roundToPrecision(preferred.distanceKm, 1),
    ownRow: ownNormalRow
  });
  const monthNormal = resolveCommuneMonthNormal({
    place,
    climateStationId: preferred.id,
    climateStationName: preferred.name,
    climateDistanceKm: roundToPrecision(preferred.distanceKm, 1),
    ownMonths: months
  });
  const includeDetailRows = options?.includeDetailRows ?? options?.includeMonthRows ?? true;

  return {
    computed: true,
    detailRows: includeDetailRows,
    methodVersion: STATS_METHOD,
    completeDayThreshold: COMPLETE_DAY_THRESHOLD,
    completeMonthDayThreshold: COMPLETE_MONTH_DAY_THRESHOLD,
    completeSeasonDayThreshold: COMPLETE_SEASON_DAY_THRESHOLD,
    commune: { insee: place.insee_code, name: place.name, slug: place.slug },
    station: {
      id: preferred.id,
      name: preferred.name,
      distanceKm,
      altitudeDeltaM: altitudeDeltaM != null ? roundToPrecision(altitudeDeltaM, 0) : null,
      completeYears: meta?.complete_years ?? 0,
      yearsInTable: meta?.years ?? years.length
    },
    disclaimer: `Évolution d’après la station ${preferred.name} à ${roundToPrecision(preferred.distanceKm, 1)} km. Ce n’est pas une concaténation de plusieurs postes, ni une moyenne de la commune.`,
    years,
    seasons: includeDetailRows ? seasons : [],
    summers: includeDetailRows ? summers : [],
    hottestSummer: hottestCompleteSeason(summers),
    coldestWinter: coldestCompleteSeasonOf(seasons, "DJF"),
    months: includeDetailRows ? months : [],
    monthRecords: observedMonthRecords(months),
    normal,
    monthNormal,
    yearRecords: observedYearRecords(years),
    warming,
    heat: includeDetailRows ? stationHeatStreaks(listStationDailyTemps(preferred.id)) : emptyHeatStreaks()
  };
}

/** Dernière année climatique (seuil 330 j), pas le record le plus chaud. */
export function lastCompleteClimateYear(years: YearClimatePoint[]): YearClimatePoint | null {
  let last: YearClimatePoint | null = null;
  for (const row of years) {
    if (!row.yearComplete) continue;
    if (!last || row.year > last.year) last = row;
  }
  return last;
}

/** SEO page commune sans `?date=` : dernière année climatique, pas le record, pas un jour. */
export function climateCopyFromYearly(yearly: CommuneYearlyPayload | null): {
  year: number;
  tminMean: number | null;
  tmaxMean: number | null;
  precipitationSum: number | null;
  precipComplete: boolean;
  daysRain?: number;
  daysGe25?: number;
  daysGe30: number;
  daysGe35?: number;
  daysGe40?: number;
  daysFrost?: number;
  tropicalNights?: number;
  amplitude?: number;
  stationName: string;
  distanceKm: number | null;
} | null {
  if (!yearly?.station) return null;
  const last = lastCompleteClimateYear(yearly.years);
  if (!last || last.tmaxMean == null) return null;
  return {
    year: last.year,
    tminMean: last.tminMean,
    tmaxMean: last.tmaxMean,
    precipitationSum: last.precipitationSum,
    precipComplete: last.precipComplete,
    daysRain: last.precipComplete ? last.daysRain : undefined,
    daysGe25: last.daysGe25,
    daysGe30: last.daysGe30,
    daysGe35: last.daysGe35,
    daysGe40: last.daysGe40,
    daysFrost: last.daysFrost,
    tropicalNights: last.tropicalNights,
    amplitude: annualMeanAmplitudeC(last.tminMean, last.tmaxMean) ?? undefined,
    stationName: yearly.station.name,
    distanceKm: yearly.station.distanceKm != null ? roundToPrecision(yearly.station.distanceKm, 1) : null
  };
}

export type FeaturedClimateCard = {
  place: PlaceRow;
  path: string;
  station: { id: string; name: string; distanceKm: number | null } | null;
  lastComplete: {
    year: number;
    tminMean: number | null;
    tmaxMean: number | null;
    precipitationSum: number | null;
    precipComplete: boolean;
    daysRain?: number;
    daysGe25?: number;
    daysGe30: number;
    daysGe35?: number;
    daysGe40?: number;
    daysFrost?: number;
    tropicalNights?: number;
    amplitude?: number;
  } | null;
};

/** Cartes d’accueil : climat officiel d’un poste, sans écart inventé entre communes. */
export function featuredClimateCards(places: PlaceRow[]): FeaturedClimateCard[] {
  return places.map((place) => {
    const yearly = getCommuneYearly(place.insee_code, { includeDetailRows: false });
    const last = yearly ? lastCompleteClimateYear(yearly.years) : null;
    return {
      place,
      path: communePath(place),
      station: yearly?.station
        ? {
            id: yearly.station.id,
            name: yearly.station.name,
            distanceKm:
              yearly.station.distanceKm != null ? roundToPrecision(yearly.station.distanceKm, 1) : null
          }
        : null,
      lastComplete: last
        ? {
            year: last.year,
            tminMean: last.tminMean,
            tmaxMean: last.tmaxMean,
            precipitationSum: last.precipitationSum,
            precipComplete: last.precipComplete,
            daysRain: last.precipComplete ? last.daysRain : undefined,
            daysGe25: last.daysGe25,
            daysGe30: last.daysGe30,
            daysGe35: last.daysGe35,
            daysGe40: last.daysGe40,
            daysFrost: last.daysFrost,
            tropicalNights: last.tropicalNights,
            amplitude: annualMeanAmplitudeC(last.tminMean, last.tmaxMean) ?? undefined
          }
        : null
    };
  });
}

export function getCommuneYearCompare(insee: string, yearA: number, yearB: number) {
  const yearly = getCommuneYearly(insee);
  if (!yearly) return null;
  const a = yearly.years.find((row) => row.year === yearA);
  const b = yearly.years.find((row) => row.year === yearB);
  return {
    computed: yearly.computed,
    methodVersion: yearly.methodVersion,
    commune: yearly.commune,
    station: yearly.station,
    disclaimer: yearly.disclaimer,
    yearA: a ?? null,
    yearB: b ?? null,
    comparison: compareCompleteYears(a, b)
  };
}

function toCitySide(yearly: CommuneYearlyPayload) {
  return {
    insee: yearly.commune.insee,
    name: yearly.commune.name,
    station: yearly.station
      ? { id: yearly.station.id, name: yearly.station.name, distanceKm: yearly.station.distanceKm }
      : null,
    years: yearly.years,
    normal: {
      available: yearly.normal.available,
      sameStation: yearly.normal.sameStation,
      period: yearly.normal.period,
      tminMean: yearly.normal.tminMean,
      tmaxMean: yearly.normal.tmaxMean,
      precipitationMean: yearly.normal.precipitationMean,
      precipAvailable: yearly.normal.precipAvailable,
      stationId: yearly.normal.station?.id ?? null
    }
  };
}

function roundCityNumber(value: number | null): number | null {
  return roundToPrecision(value, 1);
}

export function getCommuneCityCompare(inseeA: string, inseeB: string) {
  const yearlyA = getCommuneYearly(inseeA);
  const yearlyB = getCommuneYearly(inseeB);
  if (!yearlyA || !yearlyB) return null;
  const placeA = getPlaceByInsee(inseeA);
  const placeB = getPlaceByInsee(inseeB);
  const comparison = compareCityClimate(toCitySide(yearlyA), toCitySide(yearlyB));
  const overlap =
    comparison.overlap.comparable
      ? {
          ...comparison.overlap,
          tminMeanA: roundCityNumber(comparison.overlap.tminMeanA),
          tmaxMeanA: roundCityNumber(comparison.overlap.tmaxMeanA),
          tminMeanB: roundCityNumber(comparison.overlap.tminMeanB),
          tmaxMeanB: roundCityNumber(comparison.overlap.tmaxMeanB),
          tminDelta: roundCityNumber(comparison.overlap.tminDelta),
          tmaxDelta: roundCityNumber(comparison.overlap.tmaxDelta),
          precipMeanA: roundCityNumber(comparison.overlap.precipMeanA),
          precipMeanB: roundCityNumber(comparison.overlap.precipMeanB),
          precipDelta: roundCityNumber(comparison.overlap.precipDelta)
        }
      : comparison.overlap;
  const normals =
    comparison.normals.comparable
      ? {
          ...comparison.normals,
          tminMeanA: roundCityNumber(comparison.normals.tminMeanA),
          tmaxMeanA: roundCityNumber(comparison.normals.tmaxMeanA),
          tminMeanB: roundCityNumber(comparison.normals.tminMeanB),
          tmaxMeanB: roundCityNumber(comparison.normals.tmaxMeanB),
          tminDelta: roundCityNumber(comparison.normals.tminDelta),
          tmaxDelta: roundCityNumber(comparison.normals.tmaxDelta),
          precipMeanA: roundCityNumber(comparison.normals.precipMeanA),
          precipMeanB: roundCityNumber(comparison.normals.precipMeanB),
          precipDelta: roundCityNumber(comparison.normals.precipDelta)
        }
      : comparison.normals;

  return {
    computed: yearlyA.computed && yearlyB.computed,
    methodVersion: yearlyA.methodVersion,
    communeA: {
      ...yearlyA.commune,
      path: placeA ? communePath(placeA) : null
    },
    communeB: {
      ...yearlyB.commune,
      path: placeB ? communePath(placeB) : null
    },
    stationA: yearlyA.station,
    stationB: yearlyB.station,
    sameStation: comparison.sameStation,
    overlap,
    normals,
    disclaimer:
      "Chaque commune garde sa station climatique. On ne mélange pas les postes, on ne moyenne pas les deux villes. L’écart = B − A, sur les années climatiques communes ou sur la normale 1991-2020 du poste de chaque commune."
  };
}

export type CommuneChildhoodPayload = {
  computed: boolean;
  methodVersion: string;
  commune: CommuneYearlyPayload["commune"];
  station: CommuneYearlyPayload["station"];
  disclaimer: string | null;
  birthYear: number;
  comparison: CompareFail | ChildhoodCompareOk;
};

export function getCommuneChildhood(
  insee: string,
  birthYear: number,
  asOfYear = new Date().getFullYear()
): CommuneChildhoodPayload | null {
  const place = getPlaceByInsee(insee);
  if (!place) return null;
  const computed = (db.prepare(`SELECT COUNT(*) AS c FROM annual_statistics`).get() as { c: number }).c > 0;
  if (!computed) {
    return {
      computed: false,
      methodVersion: STATS_METHOD,
      commune: { insee: place.insee_code, name: place.name, slug: place.slug },
      station: null,
      disclaimer: "Statistiques non calculées. Lancer npm run stats:compute — une page vue ne déclenche pas ce calcul.",
      birthYear,
      comparison: { comparable: false, reason: "Statistiques non calculées." }
    };
  }

  const childhoodSpan = 12;
  const minN = 5;
  const childhoodUntil = birthYear + childhoodSpan;
  const recentFrom = asOfYear - 10;
  const stations = db
    .prepare(
      `
      SELECT s.id, s.name, s.latitude, s.longitude, s.altitude,
             SUM(CASE WHEN a.year BETWEEN ? AND ? AND a.year_complete = 1 THEN 1 ELSE 0 END) AS child_n,
             SUM(CASE WHEN a.year >= ? AND a.year <= ? AND a.year > ? AND a.year_complete = 1 THEN 1 ELSE 0 END) AS recent_n
      FROM annual_statistics a
      JOIN stations s ON s.id = a.station_id
      GROUP BY s.id
      HAVING child_n >= ? AND recent_n >= ?
      `
    )
    .all(birthYear, childhoodUntil, recentFrom, asOfYear, childhoodUntil, minN, minN) as ChildhoodEligibleRow[];

  const ranked = rankStationsForPlace(
    place.latitude,
    place.longitude,
    place.altitude_m,
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      altitude: s.altitude,
      coverageDays: 10000,
      hasTempOnDate: true
    }))
  );
  const preferred = ranked[0];
  if (!preferred) {
    return {
      computed: true,
      methodVersion: STATS_METHOD,
      commune: { insee: place.insee_code, name: place.name, slug: place.slug },
      station: null,
      disclaimer: null,
      birthYear,
      comparison: {
        comparable: false,
        reason:
          "Aucune station unique n’a assez d’années climatiques complètes à la fois pendant l’enfance et récemment. On ne mélange pas les postes."
      }
    };
  }

  const years: YearClimatePoint[] = listAnnualStats(preferred.id).map((row) => ({
    year: row.year,
    tminMean: roundToPrecision(row.tmin_mean, 1),
    tmaxMean: roundToPrecision(row.tmax_mean, 1),
    precipitationSum: row.precip_complete ? roundToPrecision(row.precipitation_sum, 1) : null,
    daysGe30: row.days_ge_30,
    yearComplete: row.year_complete === 1,
    precipComplete: row.precip_complete === 1
  }));
  const comparison = childhoodVsRecent(years, birthYear, asOfYear, {
    childhoodSpan,
    minCompleteYears: minN
  });
  const rounded =
    comparison.comparable
      ? {
          ...comparison,
          childhood: {
            ...comparison.childhood,
            tminMean: roundToPrecision(comparison.childhood.tminMean, 1),
            tmaxMean: roundToPrecision(comparison.childhood.tmaxMean, 1)
          },
          recent: {
            ...comparison.recent,
            tminMean: roundToPrecision(comparison.recent.tminMean, 1),
            tmaxMean: roundToPrecision(comparison.recent.tmaxMean, 1)
          },
          tminDelta: roundToPrecision(comparison.tminDelta, 1),
          tmaxDelta: roundToPrecision(comparison.tmaxDelta, 1)
        }
      : comparison;
  const altitudeDeltaM =
    preferred.altitude != null && place.altitude_m != null ? preferred.altitude - place.altitude_m : preferred.altitude;
  const meta = stations.find((s) => s.id === preferred.id);

  return {
    computed: true,
    methodVersion: STATS_METHOD,
    commune: { insee: place.insee_code, name: place.name, slug: place.slug },
    station: {
      id: preferred.id,
      name: preferred.name,
      distanceKm: roundToPrecision(preferred.distanceKm, 2),
      altitudeDeltaM: altitudeDeltaM != null ? roundToPrecision(altitudeDeltaM, 0) : null,
      completeYears: (meta?.child_n ?? 0) + (meta?.recent_n ?? 0),
      yearsInTable: years.length
    },
    disclaimer: `Moyenne des années climatiques de la station ${preferred.name} à ${roundToPrecision(preferred.distanceKm, 1)} km — un seul poste, pas une concaténation. « Récent » = années complètes depuis ${recentFrom}, pas les années juste après l’enfance. Ce n’est pas une température quotidienne d’enfance ni une étude certifiée.`,
    birthYear,
    comparison: rounded
  };
}

function emptyNormal(): CommuneNormalPayload {
  return {
    period: DEFAULT_NORMAL_PERIOD,
    minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
    available: false,
    sameStation: false,
    yearsUsed: 0,
    station: null,
    tminMean: null,
    tmaxMean: null,
    precipitationMean: null,
    precipAvailable: false,
    reason: "Statistiques non calculées. Lancer npm run stats:compute — une page vue ne déclenche pas ce calcul."
  };
}

function emptyMonthNormal(computed: boolean): CommuneMonthNormalPayload {
  return {
    period: DEFAULT_NORMAL_PERIOD,
    methodVersion: MONTH_NORMAL_METHOD,
    minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
    available: false,
    sameStation: false,
    yearsUsed: 0,
    station: null,
    reason: computed
      ? "Aucune série mensuelle précalculée n’est disponible pour une station proche."
      : "Statistiques non calculées. Lancer npm run stats:compute — une page vue ne déclenche pas ce calcul.",
    months: monthNormalsFromStats([], DEFAULT_NORMAL_START, DEFAULT_NORMAL_END, MIN_NORMAL_COMPLETE_YEARS)
  };
}

function monthNormalPayload(
  points: MonthNormalPoint[],
  station: { id: string; name: string; distanceKm: number | null },
  sameStation: boolean,
  reason: string | null
): CommuneMonthNormalPayload {
  return {
    period: DEFAULT_NORMAL_PERIOD,
    methodVersion: MONTH_NORMAL_METHOD,
    minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
    available: true,
    sameStation,
    yearsUsed: Math.min(...points.map((row) => row.yearsUsed)),
    station,
    reason,
    months: points
  };
}

function resolveCommuneMonthNormal(input: {
  place: PlaceRow;
  climateStationId: string;
  climateStationName: string;
  climateDistanceKm: number | null;
  ownMonths: MonthClimatePoint[];
}): CommuneMonthNormalPayload {
  const ownPoints = monthNormalsFromStats(
    input.ownMonths,
    DEFAULT_NORMAL_START,
    DEFAULT_NORMAL_END,
    MIN_NORMAL_COMPLETE_YEARS
  );
  const ownOk = monthNormalProfileComplete(ownPoints);
  if (ownOk) {
    return monthNormalPayload(
      ownPoints,
      {
        id: input.climateStationId,
        name: input.climateStationName,
        distanceKm: input.climateDistanceKm
      },
      true,
      null
    );
  }

  const missingReason = `La station ${input.climateStationName} n’a pas 12 mois avec chacun ${MIN_NORMAL_COMPLETE_YEARS} mois complets entre ${DEFAULT_NORMAL_START} et ${DEFAULT_NORMAL_END} (minimum observé : ${Math.min(...ownPoints.map((row) => row.yearsUsed))} mois). Ce n’est pas une normale mensuelle ${DEFAULT_NORMAL_PERIOD}.`;

  const eligible = listCompleteMonthNormalStations().filter((row) => row.station_id !== input.climateStationId);
  const ranked = rankStationsForPlace(
    input.place.latitude,
    input.place.longitude,
    input.place.altitude_m,
    eligible.map((row) => ({
      id: row.station_id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      altitude: row.altitude,
      coverageDays: 10000,
      hasTempOnDate: true
    }))
  );
  const nearby = ranked[0];
  if (!nearby) {
    return {
      ...emptyMonthNormal(true),
      yearsUsed: Math.min(...ownPoints.map((row) => row.yearsUsed)),
      reason: missingReason
    };
  }
  const nearbyMonths: MonthClimatePoint[] = listMonthlyStats(nearby.id).map((row) => ({
    year: row.year,
    month: row.month,
    tminMean: roundToPrecision(row.tmin_mean, 1),
    tmaxMean: roundToPrecision(row.tmax_mean, 1),
    precipitationSum: row.precip_complete ? roundToPrecision(row.precipitation_sum, 1) : null,
    daysGe30: row.days_ge_30,
    monthComplete: row.month_complete === 1,
    precipComplete: row.precip_complete === 1
  }));
  const nearbyPoints = monthNormalsFromStats(
    nearbyMonths,
    DEFAULT_NORMAL_START,
    DEFAULT_NORMAL_END,
    MIN_NORMAL_COMPLETE_YEARS
  );
  if (!monthNormalProfileComplete(nearbyPoints)) {
    return {
      ...emptyMonthNormal(true),
      yearsUsed: Math.min(...ownPoints.map((row) => row.yearsUsed)),
      reason: missingReason
    };
  }
  return monthNormalPayload(
    nearbyPoints,
    {
      id: nearby.id,
      name: nearby.name,
      distanceKm: roundToPrecision(nearby.distanceKm, 1)
    },
    false,
    `${missingReason} Normale mensuelle affichée : ${nearby.name} à ${roundToPrecision(nearby.distanceKm, 1)} km. Pas d’anomalie croisée sur ${input.climateStationName}.`
  );
}

function resolveCommuneNormal(input: {
  place: PlaceRow;
  climateStationId: string;
  climateStationName: string;
  climateDistanceKm: number | null;
  ownRow: ReturnType<typeof getStationNormal>;
}): CommuneNormalPayload {
  const yearsUsed = input.ownRow?.years_used ?? 0;
  if (input.ownRow?.normal_complete === 1) {
    return {
      period: DEFAULT_NORMAL_PERIOD,
      minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
      available: true,
      sameStation: true,
      yearsUsed,
      station: {
        id: input.climateStationId,
        name: input.climateStationName,
        distanceKm: input.climateDistanceKm
      },
      tminMean: roundToPrecision(input.ownRow.tmin_mean, 1),
      tmaxMean: roundToPrecision(input.ownRow.tmax_mean, 1),
      precipitationMean: input.ownRow.precip_complete === 1 ? roundToPrecision(input.ownRow.precipitation_mean, 1) : null,
      precipAvailable: input.ownRow.precip_complete === 1,
      reason: null
    };
  }

  const eligible = listCompleteNormalStations().filter((row) => row.station_id !== input.climateStationId);
  const ranked = rankStationsForPlace(
    input.place.latitude,
    input.place.longitude,
    input.place.altitude_m,
    eligible.map((row) => ({
      id: row.station_id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      altitude: row.altitude,
      coverageDays: 10000,
      hasTempOnDate: true
    }))
  );
  const nearby = ranked[0];
  const nearbyRow = nearby ? eligible.find((row) => row.station_id === nearby.id) : undefined;
  const missingReason = `La station ${input.climateStationName} n’a que ${yearsUsed} année${yearsUsed > 1 ? "s" : ""} climatique${yearsUsed > 1 ? "s" : ""} complète${yearsUsed > 1 ? "s" : ""} entre ${DEFAULT_NORMAL_PERIOD.replace("-", " et ")} (il en faut ${MIN_NORMAL_COMPLETE_YEARS}, soit 80 % de 30 ans). Ce n’est pas une normale ${DEFAULT_NORMAL_PERIOD}.`;

  if (!nearby || !nearbyRow) {
    return {
      period: DEFAULT_NORMAL_PERIOD,
      minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
      available: false,
      sameStation: false,
      yearsUsed,
      station: null,
      tminMean: null,
      tmaxMean: null,
      precipitationMean: null,
      precipAvailable: false,
      reason: missingReason
    };
  }

  const distanceKm = roundToPrecision(nearby.distanceKm, 1);
  return {
    period: DEFAULT_NORMAL_PERIOD,
    minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
    available: true,
    sameStation: false,
    yearsUsed: nearbyRow.years_used,
    station: { id: nearby.id, name: nearby.name, distanceKm },
    tminMean: roundToPrecision(nearbyRow.tmin_mean, 1),
    tmaxMean: roundToPrecision(nearbyRow.tmax_mean, 1),
    precipitationMean: nearbyRow.precip_complete === 1 ? roundToPrecision(nearbyRow.precipitation_mean, 1) : null,
    precipAvailable: nearbyRow.precip_complete === 1,
    reason: `${missingReason} Normale affichée : ${nearby.name} à ${distanceKm} km — un autre poste, donc pas d’anomalie sur la série annuelle ci-dessus.`
  };
}

function emptyPayload(place: PlaceRow, computed: boolean): CommuneYearlyPayload {
  return {
    computed,
    detailRows: true,
    methodVersion: STATS_METHOD,
    completeDayThreshold: COMPLETE_DAY_THRESHOLD,
    completeMonthDayThreshold: COMPLETE_MONTH_DAY_THRESHOLD,
    completeSeasonDayThreshold: COMPLETE_SEASON_DAY_THRESHOLD,
    commune: { insee: place.insee_code, name: place.name, slug: place.slug },
    station: null,
    disclaimer: computed
      ? "Aucune série annuelle précalculée n’est disponible pour une station proche."
      : "Statistiques non calculées. Lancer npm run stats:compute — une page vue ne déclenche pas ce calcul.",
    years: [],
    seasons: [],
    summers: [],
    hottestSummer: null,
    coldestWinter: null,
    months: [],
    monthRecords: { hottest: null, coldest: null, wettest: null },
    normal: computed
      ? {
          period: DEFAULT_NORMAL_PERIOD,
          minYearsRequired: MIN_NORMAL_COMPLETE_YEARS,
          available: false,
          sameStation: false,
          yearsUsed: 0,
          station: null,
          tminMean: null,
          tmaxMean: null,
          precipitationMean: null,
          precipAvailable: false,
          reason: "Aucune série annuelle précalculée n’est disponible pour une station proche."
        }
      : emptyNormal(),
    monthNormal: emptyMonthNormal(computed),
    yearRecords: {
      periodFrom: null,
      periodTo: null,
      yearsUsed: 0,
      hottest: null,
      coldest: null,
      wettest: null,
      mostDaysGe30: null,
      mostFrost: null,
      mostTropicalNights: null,
      mostDaysGe35: null,
      mostDaysGe25: null,
      mostDaysRain: null
    },
    warming: stationWarmingTrend([]),
    heat: emptyHeatStreaks()
  };
}

function listStationDailyTemps(stationId: string): DailyTmax[] {
  return db
    .prepare(
      `
      SELECT date, tmin, tmax
      FROM observations
      WHERE station_id = ?
      ORDER BY date
      `
    )
    .all(stationId) as DailyTmax[];
}
