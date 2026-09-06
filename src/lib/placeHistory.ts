import db from "./db";
import { rankStationsForPlace } from "../../packages/source-engine/src/stationMatch";
import { scoreConfidence } from "../../packages/confidence-engine/src/score";
import { formatCelsius, formatHpaFromPa, formatKmhFromMs, formatMm, formatWindFromDeg, roundToPrecision } from "../../packages/weather-core/src/units";
import { ORIGIN_LABEL_FR, ORIGIN_LABEL_PUBLIC_FR } from "../../packages/weather-core/src/origin";
import { describeSameDayLead, meanOfKnown, warmerThanPercent } from "../../packages/weather-core/src/sameDayStats";
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
  postal_codes: string | null;
  population: number | null;
};

export function getPlaceBySlug(slug: string): PlaceRow | undefined {
  return db.prepare(`SELECT * FROM places WHERE slug = ?`).get(slug) as PlaceRow | undefined;
}

export function getPlaceByPath(regionSlug: string, departmentSlug: string, communeSlug: string): PlaceRow | undefined {
  return db.prepare(
    `SELECT * FROM places WHERE region_slug = ? AND department_slug = ? AND slug = ?`
  ).get(regionSlug, departmentSlug, communeSlug) as PlaceRow | undefined;
}

export function listPlaces(): PlaceRow[] {
  return db.prepare(`SELECT * FROM places ORDER BY name`).all() as PlaceRow[];
}

export function listFeaturedPlaces(): PlaceRow[] {
  return db.prepare(
    `SELECT * FROM places WHERE insee_code IN ('38185', '38140', '38303') ORDER BY name`
  ).all() as PlaceRow[];
}

export function getPlaceByInsee(insee: string): PlaceRow | undefined {
  return db.prepare(`SELECT * FROM places WHERE insee_code = ?`).get(insee) as PlaceRow | undefined;
}

export function searchPlaces(query: string, limit = 12): PlaceRow[] {
  const q = query.trim().replace(/[%_]/g, "");
  if (!q) {
    return db.prepare(
      `SELECT * FROM places WHERE country_code = 'FR' ORDER BY (population IS NULL), population DESC, name LIMIT ?`
    ).all(limit) as PlaceRow[];
  }
  const like = `%${q}%`;
  const prefix = `${q}%`;
  const postalLike = `%${q}%`;
  return db.prepare(`
    SELECT * FROM places
    WHERE country_code = 'FR'
      AND (
        name LIKE ? COLLATE NOCASE
        OR insee_code LIKE ?
        OR slug LIKE ? COLLATE NOCASE
        OR IFNULL(postal_codes, '') LIKE ?
      )
    ORDER BY
      CASE WHEN name LIKE ? COLLATE NOCASE THEN 0 ELSE 1 END,
      CASE WHEN insee_code = ? THEN 0 ELSE 1 END,
      (population IS NULL),
      population DESC,
      name
    LIMIT ?
  `).all(like, like, like, postalLike, prefix, q, limit) as PlaceRow[];
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

function rankStationsOnDate(place: PlaceRow, date: string) {
  const all = candidatesForDate(date);
  const withTemp = all.filter((s) => s.hasTemp === 1);
  const pool = withTemp.length ? withTemp : all;
  return rankStationsForPlace(
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
}

function observationOnDate(stationId: string, date: string): ObsRow | undefined {
  return db.prepare(
    `SELECT date, tmin, tmax, tmean, precipitation, origin_type, source_id FROM observations WHERE station_id = ? AND date = ?`
  ).get(stationId, date) as ObsRow | undefined;
}

export type PlaceDayObservation = {
  originType: string;
  sourceId: string;
  tmin: number | null;
  tmax: number | null;
  precipitationMm: number | null;
  station: {
    id: string;
    name: string;
    distanceKm: number | null;
  };
};

/** Mesure officielle du jour pour le SEO. Pas d’ERA5. NULL reste NULL. */
export function getPlaceDayObservation(slug: string, date: string): PlaceDayObservation | null {
  const place = getPlaceBySlug(slug);
  if (!place) return null;
  const preferred = rankStationsOnDate(place, date)[0];
  if (!preferred) return null;
  const observation = observationOnDate(preferred.id, date);
  if (!observation || observation.origin_type !== "OBSERVED") return null;
  if (observation.tmin == null && observation.tmax == null && observation.precipitation == null) return null;
  return {
    originType: observation.origin_type,
    sourceId: observation.source_id,
    tmin: roundToPrecision(observation.tmin, 1),
    tmax: roundToPrecision(observation.tmax, 1),
    precipitationMm: roundToPrecision(observation.precipitation, 1),
    station: {
      id: preferred.id,
      name: preferred.name,
      distanceKm: roundToPrecision(preferred.distanceKm, 2)
    }
  };
}

export function getPlaceHistory(slug: string, date: string) {
  const place = getPlaceBySlug(slug);
  if (!place) return null;

  const ranked = rankStationsOnDate(place, date);
  const preferred = ranked[0] ?? null;
  const observation = preferred ? observationOnDate(preferred.id, date) : undefined;

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
    SELECT
      pe.variable_id, pe.value, pe.unit, pe.method, pe.origin_type, pe.source_id, pe.dataset_version,
      dl.method_version, dl.steps
    FROM point_extractions pe
    LEFT JOIN data_lineage dl ON dl.lineage_id = pe.lineage_id
    WHERE pe.date = ? AND pe.variable_id IN (
        'air_temperature_min', 'air_temperature_max', 'air_temperature',
        'dew_point_min', 'dew_point_max', 'dew_point',
        'precipitation',
        'wind_speed', 'wind_direction',
        'sea_level_pressure'
      )
      AND pe.source_id = 'copernicus.c3s.era5.single-levels-hourly'
      AND abs(pe.latitude - ?) < 0.0001 AND abs(pe.longitude - ?) < 0.0001
  `).all(date, place.latitude, place.longitude) as {
    variable_id: string;
    value: number | null;
    unit: string;
    method: string;
    origin_type: string;
    source_id: string;
    dataset_version: string | null;
    method_version: string | null;
    steps: string | null;
  }[];

  const era5ByVar = Object.fromEntries(era5.map((r) => [r.variable_id, r]));

  const distanceKm = preferred?.distanceKm ?? null;
  const altitudeDeltaM =
    preferred?.altitude != null && place.altitude_m != null ? preferred.altitude - place.altitude_m : preferred?.altitude ?? null;

  const tmin = roundToPrecision(observation?.tmin ?? null, 1);
  const tmax = roundToPrecision(observation?.tmax ?? null, 1);
  const tmean = roundToPrecision(observation?.tmean ?? null, 1);
  const rr = roundToPrecision(observation?.precipitation ?? null, 1);

  const era5TminC = toCelsius(era5ByVar.air_temperature_min);
  const era5TmaxC = toCelsius(era5ByVar.air_temperature_max);
  const era5TmeanC = toCelsius(era5ByVar.air_temperature);
  const era5DewMinC = toCelsius(era5ByVar.dew_point_min);
  const era5DewMaxC = toCelsius(era5ByVar.dew_point_max);
  const era5PrecipMm = toMillimetres(era5ByVar.precipitation);
  const era5WindMs = toMetresPerSecond(era5ByVar.wind_speed);
  const era5WindFromDeg = toWindFromDeg(era5ByVar.wind_direction);
  const era5MslHpa = toHectopascals(era5ByVar.sea_level_pressure);
  const era5HasTemp = era5TminC != null || era5TmaxC != null;
  const precipDelta =
    rr != null && era5PrecipMm != null ? roundToPrecision(era5PrecipMm - rr, 1) : null;
  const tmaxDelta =
    tmax != null && era5TmaxC != null ? roundToPrecision(era5TmaxC - tmax, 1) : null;
  const tminDelta =
    tmin != null && era5TminC != null ? roundToPrecision(era5TminC - tmin, 1) : null;

  const confidence = scoreConfidence({
    originType: observation ? "OBSERVED" : "REANALYSIS",
    distanceKm,
    altitudeDeltaM,
    qualitySuspect: false,
    coverageOk: Boolean(observation),
    interpolated: false,
    independentCorroboration: false,
    reanalysisDeltaC: tmaxDelta ?? tminDelta
  });

  const mfSource = getSource("meteo-france.climatologie.quotidienne.bulk");
  const era5Source = getSource("copernicus.c3s.era5.single-levels-hourly");
  const era5Grid = era5GridFromSteps(era5[0]?.steps ?? null);

  const seriesTmin = series.map((s) => roundToPrecision(s.tmin, 1));
  const seriesTmax = series.map((s) => roundToPrecision(s.tmax, 1));
  const tmaxPercent = warmerThanPercent(tmax, seriesTmax);
  const tminMeanRow = meanOfKnown(seriesTmin);
  const tmaxMeanRow = meanOfKnown(seriesTmax);
  const dayMonthLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
  const yearsOnThisDay = records?.yearsOnThisDay ?? series.length;
  const recordTmin = records?.recordTmin != null ? roundToPrecision(records.recordTmin, 1) : null;
  const recordTmax = records?.recordTmax != null ? roundToPrecision(records.recordTmax, 1) : null;
  const sameDayStory = describeSameDayLead({
    dayMonthLabel,
    yearCount: yearsOnThisDay,
    thisTmin: tmin,
    thisTmax: tmax,
    percentile: tmaxPercent,
    isHottest: tmax != null && recordTmax != null && tmax === recordTmax,
    isColdestMorning: tmin != null && recordTmin != null && tmin === recordTmin
  });

  const comparison = observation && (era5TminC != null || era5TmaxC != null)
    ? {
        tminDelta,
        tmaxDelta,
        note: "Écart = estimation climatique − mesure officielle. Ce n'est pas une fusion. La réanalyse n'est pas une confirmation indépendante (elle assimile des observations)."
      }
    : null;

  const attributions = [
    observation ? mfSource?.attribution : null,
    era5.length ? era5Source?.attribution : null
  ].filter((line): line is string => Boolean(line));

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
          originLabel: ORIGIN_LABEL_PUBLIC_FR.OBSERVED,
          originLabelTechnical: ORIGIN_LABEL_FR.OBSERVED,
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
    era5: era5HasTemp
      ? {
          originType: "REANALYSIS",
          originLabel: ORIGIN_LABEL_PUBLIC_FR.REANALYSIS,
          originLabelTechnical: ORIGIN_LABEL_FR.REANALYSIS,
          sourceId: "copernicus.c3s.era5.single-levels-hourly",
          method: era5[0]?.method ?? "nearest",
          methodVersion: era5[0]?.method_version ?? null,
          datasetVersion: era5[0]?.dataset_version ?? null,
          gridLatitude: era5Grid.lat,
          gridLongitude: era5Grid.lon,
          tmin: era5TminC,
          tmax: era5TmaxC,
          tmean: era5TmeanC,
          tminDisplay: formatCelsius(era5TminC),
          tmaxDisplay: formatCelsius(era5TmaxC),
          dewpointMin: era5DewMinC,
          dewpointMax: era5DewMaxC,
          dewpointMinDisplay: formatCelsius(era5DewMinC),
          dewpointMaxDisplay: formatCelsius(era5DewMaxC),
          precipMm: era5PrecipMm,
          precipDisplay: formatMm(era5PrecipMm),
          precipDelta,
          windSpeedMs: era5WindMs,
          windSpeedDisplay: formatKmhFromMs(era5WindMs),
          windFromDeg: era5WindFromDeg,
          windFromDisplay: formatWindFromDeg(era5WindFromDeg),
          mslHpa: era5MslHpa,
          mslDisplay: era5ByVar.sea_level_pressure ? formatHpaFromPa(era5ByVar.sea_level_pressure.value) : "non disponible"
        }
      : null,
    comparison,
    recordsObserved: records
      ? {
          originLabel: "Record observé par station",
          recordTmin,
          recordTmax,
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
    sameDayContext: series.length
      ? {
          tmaxPercentile: tmaxPercent,
          tminMean: tminMeanRow ? roundToPrecision(tminMeanRow.mean, 1) : null,
          tmaxMean: tmaxMeanRow ? roundToPrecision(tmaxMeanRow.mean, 1) : null,
          n: yearsOnThisDay,
          label: sameDayStory
        }
      : null,
    stationDisclaimer: preferred
      ? `Mesures provenant de la station ${preferred.name} située à ${roundToPrecision(preferred.distanceKm, 1)} km.`
      : null,
    confidence,
    attributions,
    sourcesUsed: [
      observation ? { sourceId: observation.source_id, role: "preferred_observation" } : null,
      era5.length ? { sourceId: "copernicus.c3s.era5.single-levels-hourly", role: "reanalysis_comparison" } : null
    ].filter(Boolean)
  };
}

function era5GridFromSteps(stepsJson: string | null): { lat: number | null; lon: number | null } {
  if (!stepsJson) return { lat: null, lon: null };
  try {
    const steps = JSON.parse(stepsJson) as { grid_latitude?: number; grid_longitude?: number }[];
    const step = steps.find((s) => s.grid_latitude != null && s.grid_longitude != null);
    return { lat: step?.grid_latitude ?? null, lon: step?.grid_longitude ?? null };
  } catch {
    return { lat: null, lon: null };
  }
}

function toCelsius(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit === "K") return roundToPrecision(row.value - 273.15, 1);
  if (row.unit === "degC" || row.unit === "Celsius") return roundToPrecision(row.value, 1);
  return roundToPrecision(row.value, 1);
}

function toMillimetres(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit === "m") return roundToPrecision(row.value * 1000, 1);
  if (row.unit === "mm") return roundToPrecision(row.value, 1);
  return null;
}

function toMetresPerSecond(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit === "m s-1" || row.unit === "m s**-1") return row.value;
  if (row.unit === "km/h") return row.value / 3.6;
  return null;
}

function toWindFromDeg(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit !== "degree") return null;
  return roundToPrecision(row.value, 0);
}

function toHectopascals(row?: { value: number | null; unit: string }): number | null {
  if (!row || row.value == null) return null;
  if (row.unit === "Pa") return roundToPrecision(row.value / 100, 0);
  if (row.unit === "hPa") return roundToPrecision(row.value, 0);
  return null;
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
