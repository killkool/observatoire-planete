import { haversineKm } from "../../geo/src/distance";

export type MatchCandidate = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  coverageDays: number;
  hasTempOnDate: boolean;
};

export type ScoredStation = MatchCandidate & {
  distanceKm: number;
  altitudeDeltaM: number | null;
  matchScore: number;
};

/** Initial weights from docs/STATION_MATCHING.md — to calibrate scientifically. */
export function stationMatchScore(input: {
  distanceKm: number;
  altitudeDeltaM: number | null;
  coverageDays: number;
  hasTempOnDate: boolean;
}): number {
  const distance = Math.max(0, 1 - input.distanceKm / 50) * 0.3;
  const altitude =
    input.altitudeDeltaM == null ? 0.1 : Math.max(0, 1 - Math.abs(input.altitudeDeltaM) / 500) * 0.2;
  const coverage = Math.min(1, input.coverageDays / 10000) * 0.2;
  const quality = input.hasTempOnDate ? 0.2 : 0;
  const continuity = input.hasTempOnDate ? 0.1 : 0;
  return distance + altitude + coverage + quality + continuity;
}

export function rankStationsForPlace(
  lat: number,
  lon: number,
  placeAltitudeM: number | null,
  stations: MatchCandidate[]
): ScoredStation[] {
  return stations
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => {
      const distanceKm = haversineKm(lat, lon, s.latitude as number, s.longitude as number);
      const altitudeDeltaM =
        s.altitude != null && placeAltitudeM != null ? s.altitude - placeAltitudeM : s.altitude;
      return {
        ...s,
        distanceKm,
        altitudeDeltaM,
        matchScore: stationMatchScore({
          distanceKm,
          altitudeDeltaM,
          coverageDays: s.coverageDays,
          hasTempOnDate: s.hasTempOnDate
        })
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm);
}
