export type VariableId =
  | "air_temperature"
  | "air_temperature_min"
  | "air_temperature_max"
  | "precipitation"
  | "wind_speed"
  | "wind_direction";

export const DISPLAY_PRECISION: Record<string, number> = {
  air_temperature: 1,
  air_temperature_min: 1,
  air_temperature_max: 1,
  dew_point: 1,
  precipitation: 1,
  wind_speed: 1,
  wind_gust: 1,
  pressure: 0,
  sea_level_pressure: 0,
  sea_surface_temperature: 1,
  water_temperature: 1,
  wave_height: 1,
  salinity: 2
};

export function roundToPrecision(value: number | null | undefined, digits: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function formatCelsius(valueC: number | null | undefined): string {
  const n = roundToPrecision(valueC, DISPLAY_PRECISION.air_temperature);
  return n == null ? "non disponible" : `${n.toFixed(1)} °C`;
}

export function formatMm(valueMm: number | null | undefined): string {
  const n = roundToPrecision(valueMm, DISPLAY_PRECISION.precipitation);
  return n == null ? "non disponible" : `${n.toFixed(1)} mm`;
}

/** Compte de jours à Tmax ≥ 30 °C. 0 est un vrai zéro, pas une valeur manquante. */
export function formatDaysGe30(count: number | null | undefined): string {
  if (count == null || !Number.isInteger(count) || count < 0) return "non disponible";
  return `${count} jour${count > 1 ? "s" : ""} ≥ 30 °C`;
}

/** Compte de jours à Tmax ≥ 35 °C. 0 est un vrai zéro, pas une valeur manquante. */
export function formatDaysGe35(count: number | null | undefined): string {
  if (count == null || !Number.isInteger(count) || count < 0) return "non disponible";
  return `${count} jour${count > 1 ? "s" : ""} ≥ 35 °C`;
}

/** Compte de jours à Tmin < 0 °C. 0 est un vrai zéro, pas une valeur manquante. */
export function formatDaysFrost(count: number | null | undefined): string {
  if (count == null || !Number.isInteger(count) || count < 0) return "non disponible";
  return `${count} jour${count > 1 ? "s" : ""} de gel`;
}

/** Compte de nuits à Tmin ≥ 20 °C. 0 est un vrai zéro, pas une valeur manquante. */
export function formatTropicalNights(count: number | null | undefined): string {
  if (count == null || !Number.isInteger(count) || count < 0) return "non disponible";
  return `${count} nuit${count > 1 ? "s" : ""} tropicale${count > 1 ? "s" : ""}`;
}

export function formatKmhFromMs(valueMs: number | null | undefined): string {
  if (valueMs == null || !Number.isFinite(valueMs)) return "non disponible";
  const n = roundToPrecision(valueMs * 3.6, DISPLAY_PRECISION.wind_speed);
  return n == null ? "non disponible" : `${n.toFixed(1)} km/h`;
}

export function formatHpaFromPa(valuePa: number | null | undefined): string {
  if (valuePa == null || !Number.isFinite(valuePa)) return "non disponible";
  const n = roundToPrecision(valuePa / 100, DISPLAY_PRECISION.sea_level_pressure);
  return n == null ? "non disponible" : `${n.toFixed(0)} hPa`;
}

export function formatWindFromDeg(deg: number | null | undefined): string {
  const n = roundToPrecision(deg, 0);
  return n == null ? "non disponible" : `${n}°`;
}

export function formatMmWaterFromM(valueM: number | null | undefined): string {
  if (valueM == null || !Number.isFinite(valueM)) return "non disponible";
  const n = roundToPrecision(valueM * 1000, 1);
  return n == null ? "non disponible" : `${n.toFixed(1)} mm d’eau`;
}

export function formatMjFromJm2(valueJm2: number | null | undefined): string {
  if (valueJm2 == null || !Number.isFinite(valueJm2)) return "non disponible";
  const n = roundToPrecision(valueJm2 / 1e6, 1);
  return n == null ? "non disponible" : `${n.toFixed(1)} MJ/m²`;
}

export function kelvinToCelsius(k: number): number {
  return k - 273.15;
}

export function celsiusToKelvin(c: number): number {
  return c + 273.15;
}

/** Meteorological wind direction in degrees: direction the wind comes FROM. */
export function windFromUv(u: number, v: number): { speed: number; fromDeg: number } {
  const speed = Math.hypot(u, v);
  const toDeg = (Math.atan2(u, v) * 180) / Math.PI;
  const fromDeg = (toDeg + 180 + 360) % 360;
  return { speed, fromDeg };
}

/** Ocean current: direction the water GOES TO. */
export function currentTowardsUv(u: number, v: number): { speed: number; towardsDeg: number } {
  const speed = Math.hypot(u, v);
  const towardsDeg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  return { speed, towardsDeg };
}
