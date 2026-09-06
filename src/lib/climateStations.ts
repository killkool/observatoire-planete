import { rankStationsForPlace } from "../../packages/source-engine/src/stationMatch";
import db from "./db";
import type { PlaceRow } from "./placeHistory";

/** Même seuil que la série annuelle affichée : au moins 10 années climatiques. */
export const CLIMATE_COMPLETE_YEARS_MIN = 10;

export type ClimateStationCoverage = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  years: number;
  complete_years: number;
};

export type ObservedStationCoverage = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  observedDays: number;
};

export type ResolvedClimateStation = ClimateStationCoverage & {
  distanceKm: number;
  matchScore: number;
};

export function listClimateStationCoverage(): ClimateStationCoverage[] {
  return db.prepare(
    `
    SELECT s.id, s.name, s.latitude, s.longitude, s.altitude,
           COUNT(*) AS years,
           SUM(a.year_complete) AS complete_years
    FROM annual_statistics a
    JOIN stations s ON s.id = a.station_id
    GROUP BY s.id
  `
  ).all() as ClimateStationCoverage[];
}

export function resolveClimateStationForPlace(
  place: Pick<PlaceRow, "latitude" | "longitude" | "altitude_m">,
  stations: ClimateStationCoverage[] = listClimateStationCoverage()
): ResolvedClimateStation | null {
  if (!stations.length) return null;
  const withClimate = stations.filter((s) => s.complete_years >= CLIMATE_COMPLETE_YEARS_MIN);
  const pool = withClimate.length ? withClimate : stations;
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
      coverageDays: s.complete_years * 365,
      hasTempOnDate: s.complete_years >= CLIMATE_COMPLETE_YEARS_MIN
    }))
  );
  const preferred = ranked[0];
  if (!preferred) return null;
  const meta = stations.find((s) => s.id === preferred.id);
  if (!meta) return null;
  return {
    ...meta,
    distanceKm: preferred.distanceKm,
    matchScore: preferred.matchScore
  };
}

export function listObservedStationCoverage(): ObservedStationCoverage[] {
  return db.prepare(
    `
    SELECT s.id, s.name, s.latitude, s.longitude, s.altitude,
           COUNT(*) AS observedDays
    FROM observations o
    JOIN stations s ON s.id = o.station_id
    WHERE o.origin_type = 'OBSERVED'
      AND (o.tmin IS NOT NULL OR o.tmax IS NOT NULL)
    GROUP BY s.id
  `
  ).all() as ObservedStationCoverage[];
}

export function resolveObservedStationForPlace(
  place: Pick<PlaceRow, "latitude" | "longitude" | "altitude_m">,
  stations: ObservedStationCoverage[] = listObservedStationCoverage()
): (ObservedStationCoverage & { distanceKm: number }) | null {
  if (!stations.length) return null;
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
      coverageDays: s.observedDays,
      hasTempOnDate: s.observedDays > 0
    }))
  );
  const preferred = ranked[0];
  if (!preferred) return null;
  const meta = stations.find((s) => s.id === preferred.id);
  if (!meta) return null;
  return { ...meta, distanceKm: preferred.distanceKm };
}
