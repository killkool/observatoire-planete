export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type StationLike = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
};

export function nearestStations(
  lat: number,
  lon: number,
  stations: StationLike[],
  limit = 5
): (StationLike & { distanceKm: number; altitudeDeltaM: number | null })[] {
  return stations
    .filter((s) => s.latitude != null && s.longitude != null && Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
    .map((s) => ({
      ...s,
      distanceKm: haversineKm(lat, lon, s.latitude as number, s.longitude as number),
      altitudeDeltaM: s.altitude != null ? s.altitude : null
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
