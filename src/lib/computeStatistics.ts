import db from "./db";
import {
  DEFAULT_NORMAL_END,
  DEFAULT_NORMAL_PERIOD,
  DEFAULT_NORMAL_START,
  MIN_NORMAL_COMPLETE_YEARS
} from "./climateNormals";

export const STATS_METHOD = "precompute-v2";
export const COMPLETE_DAY_THRESHOLD = 330;
export const COMPLETE_MONTH_DAY_THRESHOLD = 25;
export const COMPLETE_SEASON_DAY_THRESHOLD = 75;
export { DEFAULT_NORMAL_PERIOD, DEFAULT_NORMAL_START, DEFAULT_NORMAL_END, MIN_NORMAL_COMPLETE_YEARS };

const AGG_SELECT = `
      AVG(tmin),
      AVG(tmax),
      AVG(tmean),
      CASE WHEN SUM(CASE WHEN precipitation IS NOT NULL THEN 1 ELSE 0 END) >= $threshold
        THEN SUM(precipitation) ELSE NULL END,
      SUM(CASE WHEN precipitation IS NOT NULL THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmin IS NOT NULL THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax IS NOT NULL THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax >= 25 THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax >= 30 THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax >= 35 THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax >= 40 THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmin < 0 THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmin >= 20 THEN 1 ELSE 0 END),
      SUM(CASE WHEN precipitation > 0 THEN 1 ELSE 0 END),
      CASE WHEN SUM(CASE WHEN tmin IS NOT NULL THEN 1 ELSE 0 END) >= $threshold
        AND SUM(CASE WHEN tmax IS NOT NULL THEN 1 ELSE 0 END) >= $threshold
        THEN 1 ELSE 0 END,
      CASE WHEN SUM(CASE WHEN precipitation IS NOT NULL THEN 1 ELSE 0 END) >= $threshold
        THEN 1 ELSE 0 END,
      MAX(source_id),
      '${STATS_METHOD}'
`;

export function isYearComplete(daysTminKnown: number, daysTmaxKnown: number): boolean {
  return daysTminKnown >= COMPLETE_DAY_THRESHOLD && daysTmaxKnown >= COMPLETE_DAY_THRESHOLD;
}

export function isPrecipComplete(precipDaysKnown: number): boolean {
  return precipDaysKnown >= COMPLETE_DAY_THRESHOLD;
}

export function isMonthComplete(daysTminKnown: number, daysTmaxKnown: number): boolean {
  return daysTminKnown >= COMPLETE_MONTH_DAY_THRESHOLD && daysTmaxKnown >= COMPLETE_MONTH_DAY_THRESHOLD;
}

export function isSeasonComplete(daysTminKnown: number, daysTmaxKnown: number): boolean {
  return daysTminKnown >= COMPLETE_SEASON_DAY_THRESHOLD && daysTmaxKnown >= COMPLETE_SEASON_DAY_THRESHOLD;
}

export function computeStationStatistics() {
  const run = db.transaction(() => {
  db.exec(`DELETE FROM annual_statistics`);
  db.exec(`DELETE FROM day_of_year_statistics`);
  db.exec(`DELETE FROM monthly_statistics`);
  db.exec(`DELETE FROM seasonal_statistics`);
  db.exec(`DELETE FROM station_normals`);

  db.prepare(
    `
    INSERT INTO annual_statistics (
      station_id, year, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
      precip_days_known, days_tmin_known, days_tmax_known,
      days_ge_25, days_ge_30, days_ge_35, days_ge_40, days_frost, tropical_nights, days_rain,
      year_complete, precip_complete, source_id, method_version
    )
    SELECT
      station_id,
      CAST(substr(date, 1, 4) AS INTEGER) AS year,
      ${AGG_SELECT.replaceAll("$threshold", String(COMPLETE_DAY_THRESHOLD))}
    FROM observations
    GROUP BY station_id, CAST(substr(date, 1, 4) AS INTEGER)
  `
  ).run();

  db.prepare(
    `
    INSERT INTO station_normals (
      station_id, period, period_start, period_end,
      years_used, years_precip, tmin_mean, tmax_mean, tmean_mean, precipitation_mean,
      normal_complete, precip_complete, source_id, method_version
    )
    SELECT
      station_id,
      '${DEFAULT_NORMAL_PERIOD}',
      ${DEFAULT_NORMAL_START},
      ${DEFAULT_NORMAL_END},
      SUM(year_complete),
      SUM(precip_complete),
      AVG(CASE WHEN year_complete = 1 THEN tmin_mean END),
      AVG(CASE WHEN year_complete = 1 THEN tmax_mean END),
      AVG(CASE WHEN year_complete = 1 THEN tmean_mean END),
      CASE WHEN SUM(precip_complete) >= ${MIN_NORMAL_COMPLETE_YEARS}
        THEN AVG(CASE WHEN precip_complete = 1 THEN precipitation_sum END)
        ELSE NULL END,
      CASE WHEN SUM(year_complete) >= ${MIN_NORMAL_COMPLETE_YEARS} THEN 1 ELSE 0 END,
      CASE WHEN SUM(precip_complete) >= ${MIN_NORMAL_COMPLETE_YEARS} THEN 1 ELSE 0 END,
      MAX(source_id),
      '${STATS_METHOD}'
    FROM annual_statistics
    WHERE year BETWEEN ${DEFAULT_NORMAL_START} AND ${DEFAULT_NORMAL_END}
    GROUP BY station_id
  `
  ).run();

  db.prepare(
    `
    INSERT INTO monthly_statistics (
      station_id, year, month, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
      precip_days_known, days_tmin_known, days_tmax_known,
      days_ge_25, days_ge_30, days_ge_35, days_ge_40, days_frost, tropical_nights, days_rain,
      month_complete, precip_complete, source_id, method_version
    )
    SELECT
      station_id,
      CAST(substr(date, 1, 4) AS INTEGER) AS year,
      CAST(substr(date, 6, 2) AS INTEGER) AS month,
      ${AGG_SELECT.replaceAll("$threshold", String(COMPLETE_MONTH_DAY_THRESHOLD))}
    FROM observations
    GROUP BY station_id, CAST(substr(date, 1, 4) AS INTEGER), CAST(substr(date, 6, 2) AS INTEGER)
  `
  ).run();

  db.prepare(
    `
    INSERT INTO seasonal_statistics (
      station_id, year, season, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
      precip_days_known, days_tmin_known, days_tmax_known,
      days_ge_25, days_ge_30, days_ge_35, days_ge_40, days_frost, tropical_nights, days_rain,
      season_complete, precip_complete, source_id, method_version
    )
    SELECT
      station_id,
      CASE WHEN CAST(substr(date, 6, 2) AS INTEGER) = 12
        THEN CAST(substr(date, 1, 4) AS INTEGER) + 1
        ELSE CAST(substr(date, 1, 4) AS INTEGER)
      END AS year,
      CASE CAST(substr(date, 6, 2) AS INTEGER)
        WHEN 12 THEN 'DJF'
        WHEN 1 THEN 'DJF'
        WHEN 2 THEN 'DJF'
        WHEN 3 THEN 'MAM'
        WHEN 4 THEN 'MAM'
        WHEN 5 THEN 'MAM'
        WHEN 6 THEN 'JJA'
        WHEN 7 THEN 'JJA'
        WHEN 8 THEN 'JJA'
        WHEN 9 THEN 'SON'
        WHEN 10 THEN 'SON'
        WHEN 11 THEN 'SON'
      END AS season,
      ${AGG_SELECT.replaceAll("$threshold", String(COMPLETE_SEASON_DAY_THRESHOLD))}
    FROM observations
    GROUP BY
      station_id,
      CASE WHEN CAST(substr(date, 6, 2) AS INTEGER) = 12
        THEN CAST(substr(date, 1, 4) AS INTEGER) + 1
        ELSE CAST(substr(date, 1, 4) AS INTEGER)
      END,
      CASE CAST(substr(date, 6, 2) AS INTEGER)
        WHEN 12 THEN 'DJF'
        WHEN 1 THEN 'DJF'
        WHEN 2 THEN 'DJF'
        WHEN 3 THEN 'MAM'
        WHEN 4 THEN 'MAM'
        WHEN 5 THEN 'MAM'
        WHEN 6 THEN 'JJA'
        WHEN 7 THEN 'JJA'
        WHEN 8 THEN 'JJA'
        WHEN 9 THEN 'SON'
        WHEN 10 THEN 'SON'
        WHEN 11 THEN 'SON'
      END
  `
  ).run();

  db.prepare(
    `
    INSERT INTO day_of_year_statistics (
      station_id, month, day, tmin_mean, tmax_mean,
      tmin_min, tmin_max, tmax_min, tmax_max,
      years_tmin, years_tmax, source_id, method_version
    )
    SELECT
      station_id,
      CAST(substr(date, 6, 2) AS INTEGER) AS month,
      CAST(substr(date, 9, 2) AS INTEGER) AS day,
      AVG(tmin),
      AVG(tmax),
      MIN(tmin),
      MAX(tmin),
      MIN(tmax),
      MAX(tmax),
      SUM(CASE WHEN tmin IS NOT NULL THEN 1 ELSE 0 END),
      SUM(CASE WHEN tmax IS NOT NULL THEN 1 ELSE 0 END),
      MAX(source_id),
      '${STATS_METHOD}'
    FROM observations
    GROUP BY station_id, substr(date, 6, 2), substr(date, 9, 2)
  `
  ).run();
  });
  run();

  const annual = db.prepare(`SELECT COUNT(*) AS c FROM annual_statistics`).get() as { c: number };
  const doy = db.prepare(`SELECT COUNT(*) AS c FROM day_of_year_statistics`).get() as { c: number };
  const complete = db.prepare(`SELECT COUNT(*) AS c FROM annual_statistics WHERE year_complete = 1`).get() as { c: number };
  const monthly = db.prepare(`SELECT COUNT(*) AS c FROM monthly_statistics`).get() as { c: number };
  const completeMonths = db.prepare(`SELECT COUNT(*) AS c FROM monthly_statistics WHERE month_complete = 1`).get() as { c: number };
  const seasonal = db.prepare(`SELECT COUNT(*) AS c FROM seasonal_statistics`).get() as { c: number };
  const completeSeasons = db.prepare(`SELECT COUNT(*) AS c FROM seasonal_statistics WHERE season_complete = 1`).get() as { c: number };
  const normals = db.prepare(`SELECT COUNT(*) AS c FROM station_normals`).get() as { c: number };
  const completeNormals = db.prepare(`SELECT COUNT(*) AS c FROM station_normals WHERE normal_complete = 1`).get() as { c: number };
  return {
    annualRows: annual.c,
    dayOfYearRows: doy.c,
    completeYears: complete.c,
    monthlyRows: monthly.c,
    completeMonths: completeMonths.c,
    seasonalRows: seasonal.c,
    completeSeasons: completeSeasons.c,
    normalRows: normals.c,
    completeNormals: completeNormals.c,
    methodVersion: STATS_METHOD
  };
}

export type AnnualStatRow = {
  station_id: string;
  year: number;
  tmin_mean: number | null;
  tmax_mean: number | null;
  tmean_mean: number | null;
  precipitation_sum: number | null;
  days_rain: number;
  days_ge_25: number;
  days_ge_30: number;
  days_ge_35: number;
  days_ge_40: number;
  days_frost: number;
  tropical_nights: number;
  year_complete: number;
  precip_complete: number;
};

export type SeasonalStatRow = {
  station_id: string;
  year: number;
  season: "DJF" | "MAM" | "JJA" | "SON";
  tmin_mean: number | null;
  tmax_mean: number | null;
  tmean_mean: number | null;
  precipitation_sum: number | null;
  days_ge_30: number;
  season_complete: number;
  precip_complete: number;
};

export function listAnnualStats(stationId: string): AnnualStatRow[] {
  return db.prepare(
    `
    SELECT station_id, year, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
           days_rain, days_ge_25, days_ge_30, days_ge_35, days_ge_40, days_frost, tropical_nights, year_complete, precip_complete
    FROM annual_statistics
    WHERE station_id = ?
    ORDER BY year
  `
  ).all(stationId) as AnnualStatRow[];
}

export function listSeasonalStats(stationId: string, season?: SeasonalStatRow["season"]): SeasonalStatRow[] {
  if (season) {
    return db.prepare(
      `
      SELECT station_id, year, season, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
             days_ge_30, season_complete, precip_complete
      FROM seasonal_statistics
      WHERE station_id = ? AND season = ?
      ORDER BY year
    `
    ).all(stationId, season) as SeasonalStatRow[];
  }
  return db.prepare(
    `
    SELECT station_id, year, season, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
           days_ge_30, season_complete, precip_complete
    FROM seasonal_statistics
    WHERE station_id = ?
    ORDER BY year, season
  `
  ).all(stationId) as SeasonalStatRow[];
}

export type MonthlyStatRow = {
  station_id: string;
  year: number;
  month: number;
  tmin_mean: number | null;
  tmax_mean: number | null;
  tmean_mean: number | null;
  precipitation_sum: number | null;
  days_ge_30: number;
  month_complete: number;
  precip_complete: number;
};

export function listMonthlyStats(stationId: string): MonthlyStatRow[] {
  return db.prepare(
    `
    SELECT station_id, year, month, tmin_mean, tmax_mean, tmean_mean, precipitation_sum,
           days_ge_30, month_complete, precip_complete
    FROM monthly_statistics
    WHERE station_id = ?
    ORDER BY year, month
  `
  ).all(stationId) as MonthlyStatRow[];
}

export type StationNormalRow = {
  station_id: string;
  period: string;
  period_start: number;
  period_end: number;
  years_used: number;
  years_precip: number;
  tmin_mean: number | null;
  tmax_mean: number | null;
  tmean_mean: number | null;
  precipitation_mean: number | null;
  normal_complete: number;
  precip_complete: number;
};

export function getStationNormal(stationId: string, period = DEFAULT_NORMAL_PERIOD): StationNormalRow | undefined {
  return db.prepare(
    `
    SELECT station_id, period, period_start, period_end, years_used, years_precip,
           tmin_mean, tmax_mean, tmean_mean, precipitation_mean,
           normal_complete, precip_complete
    FROM station_normals
    WHERE station_id = ? AND period = ?
  `
  ).get(stationId, period) as StationNormalRow | undefined;
}

export function listCompleteNormalStations(period = DEFAULT_NORMAL_PERIOD): (StationNormalRow & {
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
})[] {
  return db.prepare(
    `
    SELECT n.station_id, n.period, n.period_start, n.period_end, n.years_used, n.years_precip,
           n.tmin_mean, n.tmax_mean, n.tmean_mean, n.precipitation_mean,
           n.normal_complete, n.precip_complete,
           s.name, s.latitude, s.longitude, s.altitude
    FROM station_normals n
    JOIN stations s ON s.id = n.station_id
    WHERE n.period = ? AND n.normal_complete = 1
  `
  ).all(period) as (StationNormalRow & {
    name: string;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
  })[];
}

export function listCompleteMonthNormalStations(
  periodStart = DEFAULT_NORMAL_START,
  periodEnd = DEFAULT_NORMAL_END,
  minYears = MIN_NORMAL_COMPLETE_YEARS
): { station_id: string; name: string; latitude: number | null; longitude: number | null; altitude: number | null }[] {
  return db.prepare(
    `
    SELECT s.id AS station_id, s.name, s.latitude, s.longitude, s.altitude
    FROM (
      SELECT station_id
      FROM (
        SELECT station_id, month
        FROM monthly_statistics
        WHERE year BETWEEN ? AND ?
        GROUP BY station_id, month
        HAVING SUM(month_complete) >= ?
      )
      GROUP BY station_id
      HAVING COUNT(*) = 12
    ) ok
    JOIN stations s ON s.id = ok.station_id
  `
  ).all(periodStart, periodEnd, minYears) as {
    station_id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
  }[];
}
