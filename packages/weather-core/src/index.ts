export { DataOriginType, ORIGIN_LABEL_FR, ORIGIN_LABEL_PUBLIC_FR, assertNotObservation } from "./origin";
export {
  MIN_SAME_DAY_SAMPLE,
  warmerThanPercent,
  meanOfKnown,
  describeSameDayTmax,
  describeSameDayLead
} from "./sameDayStats";
export {
  DISPLAY_PRECISION,
  roundToPrecision,
  formatCelsius,
  formatMm,
  formatKmhFromMs,
  formatHpaFromPa,
  formatWindFromDeg,
  formatMmWaterFromM,
  formatMjFromJm2,
  kelvinToCelsius,
  celsiusToKelvin,
  windFromUv,
  currentTowardsUv
} from "./units";
export type { VariableId } from "./units";
