import assert from "node:assert/strict";
import { currentTowardsUv, formatCelsius, roundToPrecision, windFromUv } from "../packages/weather-core/src/units";
import { scoreConfidence } from "../packages/confidence-engine/src/score";
import { stationMatchScore } from "../packages/source-engine/src/stationMatch";
import { assertCommercialSource } from "../packages/licensing/src/gate";

assert.equal(formatCelsius(24.437), "24.4 °C");
assert.equal(formatCelsius(null), "non disponible");
assert.equal(roundToPrecision(24.437, 1), 24.4);

const northWind = windFromUv(0, -1);
assert.ok(Math.abs(northWind.fromDeg) < 1e-6 || Math.abs(northWind.fromDeg - 360) < 1e-6, `from north, got ${northWind.fromDeg}`);

const eastCurrent = currentTowardsUv(1, 0);
assert.ok(Math.abs(eastCurrent.towardsDeg - 90) < 1e-6, `current towards east, got ${eastCurrent.towardsDeg}`);

const withDate = stationMatchScore({ distanceKm: 5, altitudeDeltaM: 10, coverageDays: 8000, hasTempOnDate: true });
const closerNoDate = stationMatchScore({ distanceKm: 4, altitudeDeltaM: 10, coverageDays: 2000, hasTempOnDate: false });
assert.ok(withDate > closerNoDate, "coverage+temp on date must beat a slightly closer station without the day");

const mf = assertCommercialSource("meteo-france.climatologie.quotidienne.bulk");
assert.equal(mf.legalStatus, "APPROVED_COMMERCIAL");

assert.throws(() => assertCommercialSource("ecad.e-obs"));

const observed = scoreConfidence({
  originType: "OBSERVED",
  distanceKm: 3,
  altitudeDeltaM: 20,
  qualitySuspect: false,
  coverageOk: true,
  interpolated: false,
  independentCorroboration: false
});
assert.ok(observed.score >= 80);

const reanalysis = scoreConfidence({
  originType: "REANALYSIS",
  distanceKm: null,
  altitudeDeltaM: null,
  qualitySuspect: false,
  coverageOk: true,
  interpolated: false,
  independentCorroboration: false
});
assert.ok(reanalysis.score < observed.score);

console.log("science tests ok");
