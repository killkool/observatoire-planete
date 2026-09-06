import db from "./db";
import { rankStationsForPlace } from "../../packages/source-engine/src/stationMatch";
import { scoreConfidence } from "../../packages/confidence-engine/src/score";
import { formatCelsius, formatMm, roundToPrecision } from "../../packages/weather-core/src/units";
import { ORIGIN_LABEL_FR } from "../../packages/weather-core/src/origin";
import { getSource } from "../../packages/licensing/src/gate";

export type PlaceRow = {
  place_id: string;
  name: string;
  slug: string;
  insee_code: string;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  timezone: string;
  region_slug: string;
  department_slug: string;
};

export function getPlaceBySlug(slug: string): PlaceRow | undefined {
  return db.prepare(`SELECT * FROM places WHERE slug = ?`).get(slug) as PlaceRow | undefined;
}

export function listPlaces(): PlaceRow[] {
  return db.prepare(`SELECT * FROM places ORDER BY name`).all() as PlaceRow[];
}

type StationRow = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  department: string | null;
  days?: number;
};

type ObsRow = {
  date: string;
  tmin: number | null;
  tmax: number | null;
  tmean: number | null;
  precipitation: number | null;
  origin_type: string;
  source_id: string;
};

function candidatesForDate(date: string) {
  const withTemp = db.prepare(`
    SELECT s.id, s.name, s.latitude, s.longitude, s.altitude, s.department
    FROM observations o
    JOIN stations s ON s.id = o.station_id
    WHERE o.date = ?
      AND (o.tmin IS NOT NULL OR o.tmax IS NOT NULL)
  `).all(date) as StationRow[];
  if (!withTemp.length) return [] as (StationRow & { days: number; hasTemp: number })[];
  const counts = db.prepare(`
    SELECT station_id AS id, COUNT(*) AS days
    FROM observations
    WHERE station_id IN (${withTemp.map(() => "?").join(",")})
    GROUP BY station_id
  `).all(...withTemp.map((s) => s.id)) as { id: string; days: number }[];
  const daysById = new Map(counts.map((c) => [c.id, c.days]));
  return withTemp.map((s) => ({ ...s, days: daysById.get(s.id) || 0, hasTemp: 1 }));
}

export function getPlaceHistory(slug: string, date: string) {
  const place = getPlaceBySlug(slug);
  if (!place) return null;

  const all = candidatesForDate(date);
  const withTemp = all.filter((s) => s.hasTemp === 1);
  const pool = withTemp.length ? withTemp : all;
  const ranked = rankStationsForPlace(
    place.latitude,
    place.longitude,
    place.altitude_m,
    pool.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      altitude: s.altitude,
      coverageDays: s.days || 0,
      hasTempOnDate: s.hasTemp === 1
    }))
  );
  const preferred = ranked[0] ?? null;
  const observation = preferred
    ? (db.prepare(`SELECT date, tmin, tmax, tmean, precipitation, origin_type, source_id FROM observations WHERE station_id = ? AND date = ?`)
        .get(preferred.id, date) as ObsRow | undefined)
    : undefined;

  const dayOfYear = date.slice(5);
  const records = preferred
    ? (db.prepare(`
        SELECT
          MIN(tmin) AS recordTmin,
          MAX(tmax) AS recordTmax,
          (SELECT date FROM observations WHERE station_id = ? AND tmin = (SELECT MIN(tmin) FROM observations WHERE station_id = ? AND substr(date,6) = ?) AND substr(date,6) = ? LIMIT 1) AS recordTminDate,
          (SELECT date FROM observations WHERE station_id = ? AND tmax = (SELECT MAX(tmax) FROM observations WHERE station_id = ? AND substr(date,6) = ?) AND substr(date,6) = ? LIMIT 1) AS recordTmaxDate,
          COUNT(*) AS yearsOnThisDay
        FROM observations
        WHERE station_id = ? AND substr(date, 6) = ? AND tmin IS NOT NULL AND tmax IS NOT NULL
      `).get(
        preferred.id, preferred.id, dayOfYear, dayOfYear,
        preferred.id, preferred.id, dayOfYear, dayOfYear,
        preferred.id, dayOfYear
      ) as {
        recordTmin: number | null;
        recordTmax: number | null;
        recordTminDate: string | null;
        recordTmaxDate: string | null;
        yearsOnThisDay: number;
      })
    : null;

  const series = preferred
    ? (db.prepare(`
        SELECT date, tmin, tmax, tmean, precipitation
        FROM observations
        WHERE station_id = ? AND substr(date, 6) = ?
        ORDER BY date
      `).all(preferred.id, dayOfYear) as { date: string; tmin: number | null; tmax: number | null; tmean: number | null; precipitation: number | null }[])
    : [];

  const era5 = db.prepare(`
    SELECT variable_id, value, unit, method, origin_type, source_id, dataset_version
    FROM point_extractions
    WHERE date = ? AND variable_id IN ('air_temperature_min', 'air_temperature_max', 'air_temperature')
      AND source_id = 'copernicus.c3s.era5.single-levels-hourly'
      AND abs(latitude - ?) < 0.0001 AND abs(longitude - ?) < 0.0001
  `).all(date, place.latitude, place.longitude) as {
    variable_id: string;
    value: number | null;
    unit: string;
    method: string;
    origin_type: string;
    source_id: string;
    dataset_version: string | null;
  }[];

  const era5ByVar = Object.fromEntries(era5.map((r) => [r.variable_id, r]));

  const distanceKm = preferred?.distanceKm ?? null;
  const altitudeDeltaM =
    preferred?.altitude != null && place.altitude_m != null ? preferred.altitude - place.altitude_m : preferred?.altitude ?? null;

  const confidence = scoreConfidence({
    originType: observation ? "OBSERVED" : "REANALYSIS",
    distanceKm,
    altitudeDeltaM,
    qualitySuspect: false,
    coverageOk: Boolean(observation),
    interpolated: false,
    independentCorroboration: Boolean(observation && era5.length)
  });

  const mfSource = getSource("meteo-france.climatologie.quotidienne.bulk");
  const era5Source = getSource("copernicus.c3s.era5.single-levels-hourly");

  const tmin = roundToPrecision(observation?.tmin ?? null, 1);
  const tmax = roundToPrecision(observation?.tmax ?? null, 1);
  const tmean = roundToPrecision(observation?.tmean ?? null, 1);
  const rr = roundToPrecision(observation?.precipitation ?? null, 1);

  const era5TminC = toCelsius(era5ByVar.air_temperature_min);
  const era5TmaxC = toCelsius(era5ByVar.air_temperature_max);
  const era5TmeanC = toCelsius(era5ByVar.air_temperature);

  const comparison = observation && (era5TminC != null || era5TmaxC != null)
    ? {
        tminDelta: tmin != null && era5TminC != null ? roundToPrecision(era5TminC - tmin, 1) : null,
        tmaxDelta: tmax != null && era5TmaxC != null ? roundToPrecision(era5TmaxC - tmax, 1) : null,
        note: "Écart = ERA5 − observation. Ce n'est pas une fusion. ERA5 n'est pas une confirmation indépendante (assimilation)."
      }
    : null;

  const attributions = [
    observation ? mfSource?.attribution : null,
    era5.length ? era5Source?.attribution : null
  ].filter(Boolean);

  return {
    place,
    date,
    timezone: place.timezone,
    preferredStation: preferred
      ? {
          id: preferred.id,
          name: preferred.name,
          latitude: preferred.latitude,
          longitude: preferred.longitude,
          altitudeM: preferred.altitude,
          distanceKm: roundToPrecision(preferred.distanceKm, 2),
          altitudeDeltaM: altitudeDeltaM != null ? roundToPrecision(altitudeDeltaM, 0) : null,
          matchScore: roundToPrecision(preferred.matchScore, 3),
          matchMethod: "station-match-v1-draft (distance 30%, altitude 20%, coverage 20%, temp-on-date 20%, continuity 10%)"
        }
      : null,
    nearbyStations: ranked.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      distanceKm: roundToPrecision(s.distanceKm, 2),
      altitudeM: s.altitude
    })),
    observation: observation
      ? {
          originType: observation.origin_type,
          originLabel: ORIGIN_LABEL_FR.OBSERVED,
          sourceId: observation.source_id,
          tmin,
          tmax,
          tmean,
          precipitationMm: rr,
          tminDisplay: formatCelsius(tmin),
          tmaxDisplay: formatCelsius(tmax),
          tmeanDisplay: formatCelsius(tmean),
          precipDisplay: formatMm(rr)
        }
      : null,
    era5: era5.length
      ? {
          originType: "REANALYSIS",
          originLabel: ORIGIN_LABEL_FR.REANALYSIS,
          sourceId: "copernicus.c3s.era5.single-levels-hourly",
          method: era5[0]?.method ?? "nearest",
          tmin: era5TminC,
          tmax: era5TmaxC,
          tmean: era5TmeanC,
          tminDisplay: formatCelsius(era5TminC),
          tmaxDisplay: formatCelsius(era5TmaxC),
          datasetVersion: era5[0]?.dataset_version ?? null
        }
      : null,
    comparison,
    recordsObserved: records
      ? {
          originLabel: "Record observé par station",
          recordTmin: roundToPrecision(records.recordTmin, 1),
          recordTmax: roundToPrecision(records.recordTmax, 1),
          recordTminDate: records.recordTminDate,
          recordTmaxDate: records.recordTmaxDate,
          yearsOnThisDay: records.yearsOnThisDay
        }
      : null,
    seriesSameDay: series.map((s) => ({
      date: s.date,
      tmin: roundToPrecision(s.tmin, 1),
      tmax: roundToPrecision(s.tmax, 1),
      tmean: roundToPrecision(s.tmean, 1),
      precipitation: roundToPrecision(s.precipitation, 1)
    })),
    confidence,
    attributions,
    sourcesUsed: [
      observation ? { sourceId: observation.source_id, role: "preferred_observation" } : null,
      era5.length ? { sourceId: "copernicus.c3s.era5.single-levels-hourly", role: "reanalysis_comparison" } : null
    ].filter(Boolean)
  };
}

function toCelsius(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit === "K") return roundToPrecision(row.value - 273.15, 1);
  if (row.unit === "degC" || row.unit === "Celsius") return roundToPrecision(row.value, 1);
  return roundToPrecision(row.value, 1);
}

export function coverageForStation(stationId: string) {
  return db.prepare(`
    SELECT MIN(date) AS firstDate, MAX(date) AS lastDate, COUNT(*) AS days
    FROM observations WHERE station_id = ?
  `).get(stationId) as { firstDate: string | null; lastDate: string | null; days: number };
}

export function defaultDateForPlace(_slug: string): string {
  const last = db.prepare(`SELECT MAX(date) AS d FROM observations`).get() as { d: string | null };
  return last.d || new Date().toISOString().slice(0, 10);
}
