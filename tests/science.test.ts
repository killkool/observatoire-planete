import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { currentTowardsUv, formatCelsius, formatHpaFromPa, formatKmhFromMs, formatMjFromJm2, formatMmWaterFromM, formatWindFromDeg, roundToPrecision, windFromUv } from "../packages/weather-core/src/units";
import { ORIGIN_LABEL_PUBLIC_FR } from "../packages/weather-core/src/origin";
import { warmerThanPercent, meanOfKnown, describeSameDayLead } from "../packages/weather-core/src/sameDayStats";
import { scoreConfidence } from "../packages/confidence-engine/src/score";
import { stationMatchScore } from "../packages/source-engine/src/stationMatch";
import { assertCommercialSource } from "../packages/licensing/src/gate";
import { createHash } from "node:crypto";
import { isInFranceEra5Bbox, ERA5_FRANCE_DAILY_2T_CELLS, ERA5_FRANCE_DAILY_2T_DATES, ERA5_POINT_DATES } from "../src/lib/era5France";
import { communePath } from "../src/lib/placeUrl";
import { searchPlaces, getPlaceHistory, getPlaceByInsee, getPlaceDayObservation, listFeaturedPlaces, listPlaces } from "../src/lib/placeHistory";
import { computeStationStatistics, isMonthComplete, isPrecipComplete, isSeasonComplete, isYearComplete } from "../src/lib/computeStatistics";
import { climateCopyFromYearly, featuredClimateCards, getCommuneYearCompare, getCommuneChildhood, getCommuneCityCompare, getCommuneYearly, lastCompleteClimateYear } from "../src/lib/communeYearly";
import {
  childhoodVsRecent,
  compareCityClimate,
  compareCompleteSeasons,
  compareCompleteYears,
  formatSignedCelsius,
  hottestCompleteSeason
} from "../src/lib/compareClimate";
import { anomaly, isNormalComplete, observedYearRecords } from "../src/lib/climateNormals";
import {
  compareCompleteMonths,
  formatMonthYear,
  hottestCompleteMonth,
  monthChartRows,
  monthNormalsFromStats,
  monthNormalProfileComplete,
  observedMonthRecords,
  wettestCompleteMonth,
  yearsWithTwelveCompleteMonths
} from "../src/lib/climateMonths";
import { seoContentScore, frenchLanguageAlternates, publicAbsoluteUrl, seoFactsForPlace, listIndexablePlaces, SEO_CONTENT_METHOD, communePageCopy, officialCopyFromDay, comparePageCopy } from "../src/lib/seoContent";
import { communeJsonLd, websiteJsonLd } from "../src/lib/seoJsonLd";
import { coldestCompleteSeason, seasonPublicLabel } from "../src/lib/climateSeasons";
import { buildShareCardModel, shareCardPath } from "../src/lib/shareCard";
import { heatEpisodesAt, stationHeatStreaks } from "../src/lib/climateHeatStreaks";
import {
  formatSignedPerDecade,
  MIN_TREND_COMPLETE_YEARS,
  ordinaryLeastSquares,
  stationWarmingTrend,
  TREND_METHOD,
  TREND_WINDOW_YEARS
} from "../src/lib/climateTrend";
import { communeSnapshotChecksum } from "../src/lib/ingestCommunes";
import { buildBirthLead, buildShareText, communeHistoryHref, frenchLongDate, yearsElapsed } from "../src/lib/birthDay";
import { birthExampleCards } from "../src/lib/birthExamples";
import { compareExampleCards } from "../src/lib/compareExamples";
import { filterDailyResources } from "../src/lib/meteoFrance";
import { isAllowedIgnLayer, parseIgnTile } from "../src/lib/ignTiles";
import db from "../src/lib/db";

assert.equal(formatCelsius(24.437), "24.4 °C");
assert.equal(formatCelsius(null), "non disponible");
assert.equal(roundToPrecision(24.437, 1), 24.4);
assert.equal(formatKmhFromMs(1), "3.6 km/h");
assert.equal(formatHpaFromPa(101325), "1013 hPa");
assert.equal(formatWindFromDeg(227.4), "227°");
assert.equal(formatMmWaterFromM(0.027251), "27.3 mm d’eau");
assert.equal(formatMjFromJm2(20768388.375), "20.8 MJ/m²");

assert.equal(ORIGIN_LABEL_PUBLIC_FR.OBSERVED, "Mesure officielle");
assert.equal(ORIGIN_LABEL_PUBLIC_FR.REANALYSIS, "Estimation climatique");
assert.equal(isInFranceEra5Bbox(45.1885, 5.7245), true, "Grenoble is inside the V1 France ERA5 bbox");
assert.equal(isInFranceEra5Bbox(48.8566, 2.3522), true, "Paris is inside the V1 France ERA5 bbox");
assert.equal(isInFranceEra5Bbox(48.3904, -4.4861), true, "Brest west of Greenwich stays in the V1 bbox");
assert.equal(isInFranceEra5Bbox(40.7128, -74.006), false, "a point outside France must not be extractable");

const grenoblePointExtract = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-12.json"), "utf8")
) as {
  method_version: string;
  hourly_tp_m: number[];
  hourly_10u_ms: number[];
  hourly_10v_ms: number[];
  hourly_msl_Pa: number[];
  hourly_sp_Pa: number[];
  hourly_snow_swe_m: number[];
  hourly_ssrd_Jm2: number[];
  hourly_i10fg_ms: number[];
  model_surface_altitude_m: number;
  model_surface_geopotential_m2s2: number;
  points: { variable_id: string; value: number; unit: string }[];
};
assert.equal(grenoblePointExtract.method_version, "era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1");
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-12.json"))).digest("hex"),
  "eece40036986b49aaab3e70d9e53ec8ae7fcfc1af8110ab5fa39b96d44062e82",
  "1983-05-12 point proof must not be rewritten"
);
assert.equal(grenoblePointExtract.hourly_tp_m.length, 24);
assert.equal(grenoblePointExtract.hourly_tp_m.every((v) => v >= 0), true);
const tpSum = grenoblePointExtract.hourly_tp_m.reduce((a, b) => a + b, 0);
const tpPoint = grenoblePointExtract.points.find((p) => p.variable_id === "precipitation");
assert.ok(tpPoint);
assert.equal(tpPoint.unit, "m");
assert.ok(Math.abs(tpPoint.value - tpSum) < 1e-12, "daily TP is the sum of 24 hourly metres, not last-first");
assert.equal(
  grenoblePointExtract.hourly_tp_m.every((v, i, arr) => i === 0 || v >= arr[i - 1] - 1e-18),
  false,
  "ARCO TP is hourly accumulation, not a monotonic CDS step cumulative"
);
assert.equal(Math.round(tpPoint.value * 1000 * 10) / 10, 0.3);
assert.equal(grenoblePointExtract.hourly_10u_ms.length, 24);
assert.equal(grenoblePointExtract.hourly_10v_ms.length, 24);
assert.equal(grenoblePointExtract.hourly_msl_Pa.length, 24);
const hourlySpeeds = grenoblePointExtract.hourly_10u_ms.map((u, i) => Math.hypot(u, grenoblePointExtract.hourly_10v_ms[i]));
const windPoint = grenoblePointExtract.points.find((p) => p.variable_id === "wind_speed");
assert.ok(windPoint);
assert.equal(windPoint.unit, "m s-1");
assert.ok(Math.abs(windPoint.value - hourlySpeeds.reduce((a, b) => a + b, 0) / hourlySpeeds.length) < 1e-12);
const meanU = grenoblePointExtract.hourly_10u_ms.reduce((a, b) => a + b, 0) / 24;
const meanV = grenoblePointExtract.hourly_10v_ms.reduce((a, b) => a + b, 0) / 24;
const vectorMean = windFromUv(meanU, meanV);
const dirPoint = grenoblePointExtract.points.find((p) => p.variable_id === "wind_direction");
assert.ok(dirPoint, "vector-mean wind is not calm: direction must not be invented nor omitted if speed is real");
assert.equal(dirPoint.unit, "degree");
assert.ok(Math.abs(dirPoint.value - vectorMean.fromDeg) < 1e-9);
const mslPoint = grenoblePointExtract.points.find((p) => p.variable_id === "sea_level_pressure");
assert.ok(mslPoint);
assert.equal(mslPoint.unit, "Pa");
const mslMean = grenoblePointExtract.hourly_msl_Pa.reduce((a, b) => a + b, 0) / 24;
assert.ok(Math.abs(mslPoint.value - mslMean) < 1e-9);
assert.equal(grenoblePointExtract.hourly_sp_Pa.length, 24);
assert.equal(grenoblePointExtract.hourly_snow_swe_m.length, 24);
assert.equal(grenoblePointExtract.hourly_ssrd_Jm2.length, 24);
assert.equal(grenoblePointExtract.hourly_i10fg_ms.length, 24);
const spPoint = grenoblePointExtract.points.find((p) => p.variable_id === "pressure");
assert.ok(spPoint);
assert.equal(spPoint.unit, "Pa");
const spMean = grenoblePointExtract.hourly_sp_Pa.reduce((a, b) => a + b, 0) / 24;
assert.ok(Math.abs(spPoint.value - spMean) < 1e-9);
assert.ok(spPoint.value < mslPoint.value, "surface pressure at a mountain cell is below MSL");
const snowPoint = grenoblePointExtract.points.find((p) => p.variable_id === "snow_depth");
assert.ok(snowPoint);
assert.equal(snowPoint.unit, "m");
assert.equal(grenoblePointExtract.hourly_snow_swe_m.every((v) => v >= 0), true);
const snowMean = grenoblePointExtract.hourly_snow_swe_m.reduce((a, b) => a + b, 0) / 24;
assert.ok(Math.abs(snowPoint.value - snowMean) < 1e-12);
assert.notEqual(Math.round(snowPoint.value * 100 * 10) / 10, Math.round(snowPoint.value * 1000 * 10) / 10, "SWE mm is not snow height cm");
const ssrdPoint = grenoblePointExtract.points.find((p) => p.variable_id === "solar_radiation");
assert.ok(ssrdPoint);
assert.equal(ssrdPoint.unit, "J m-2");
const ssrdSum = grenoblePointExtract.hourly_ssrd_Jm2.reduce((a, b) => a + b, 0);
assert.ok(Math.abs(ssrdPoint.value - ssrdSum) < 1e-6, "daily SSRD is the sum of 24 hourly J m-2, not last-first");
assert.equal(
  grenoblePointExtract.hourly_ssrd_Jm2.every((v, i, arr) => i === 0 || v >= arr[i - 1] - 1e-9),
  false,
  "ARCO SSRD is hourly accumulation, not a monotonic CDS step cumulative"
);
const gustPoint = grenoblePointExtract.points.find((p) => p.variable_id === "wind_gust");
assert.ok(gustPoint);
assert.equal(gustPoint.unit, "m s-1");
assert.ok(Math.abs(gustPoint.value - Math.max(...grenoblePointExtract.hourly_i10fg_ms)) < 1e-12);
assert.ok(gustPoint.value > windPoint.value, "instantaneous gust max exceeds mean 10 m wind");
assert.equal(
  Math.round((grenoblePointExtract.model_surface_geopotential_m2s2 / 9.80665) * 10) / 10,
  grenoblePointExtract.model_surface_altitude_m
);

const franceDaily = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/france-1983-05-12-2t-daily.json"), "utf8")
) as {
  method_version: string;
  cell_count: number;
  latitude: number[];
  longitude: number[];
  tmin_K: number[][];
  tmax_K: number[][];
  grenoble_cell: { latitude: number; longitude: number; tmin_K: number; tmax_K: number };
  bbox: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
};
assert.equal(franceDaily.method_version, "era5-france-daily-2t-minmax-v1");
assert.equal(franceDaily.cell_count, 2709);
assert.equal(franceDaily.cell_count, franceDaily.latitude.length * franceDaily.longitude.length);
assert.equal(franceDaily.latitude.every((lat) => lat >= 41 && lat <= 51.5), true);
assert.equal(franceDaily.longitude.every((lon) => lon >= -5.5 && lon <= 10), true);
assert.equal(franceDaily.grenoble_cell.latitude, 45.25);
assert.equal(franceDaily.grenoble_cell.longitude, 5.75);
assert.equal(Math.round(franceDaily.grenoble_cell.tmin_K * 10000) / 10000, 276.564);
assert.equal(Math.round(franceDaily.grenoble_cell.tmax_K * 10000) / 10000, 287.3429);
assert.equal(franceDaily.tmin_K.length, franceDaily.latitude.length);
assert.equal(franceDaily.tmin_K[0].length, franceDaily.longitude.length);
assert.ok(!("hourly_2t_K" in franceDaily), "France daily must not store hourly grids");
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/france-1983-05-12-2t-daily.json"))).digest("hex"),
  "9c7b9a9836b23b1252d09b3c410f96cbe5ccd61558b59c92f19b8f3fbfb1cbe2",
  "1983-05-12 France daily proof must not be rewritten"
);
const franceDailyIndex = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/france-2t-daily-index.json"), "utf8")
) as {
  imported_to_sql: boolean;
  archive_1940_2026: boolean;
  cell_count: number;
  days: { date: string; file: string; sha256: string; grenoble_tmin_K: number; grenoble_tmax_K: number; cell_count: number }[];
};
assert.equal(franceDailyIndex.imported_to_sql, false);
assert.equal(franceDailyIndex.archive_1940_2026, false);
assert.equal(franceDailyIndex.cell_count, ERA5_FRANCE_DAILY_2T_CELLS);
assert.deepEqual(franceDailyIndex.days.map((d) => d.date), [...ERA5_FRANCE_DAILY_2T_DATES]);
assert.equal(franceDailyIndex.days.length, 3);
for (const row of franceDailyIndex.days) {
  const abs = path.join(process.cwd(), "pipelines/era5/extracts", row.file);
  assert.equal(createHash("sha256").update(fs.readFileSync(abs)).digest("hex"), row.sha256);
  assert.equal(row.cell_count, 2709);
}
const france11 = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/france-1983-05-11-2t-daily.json"), "utf8")
) as typeof franceDaily & { date: string };
const france13 = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/france-1983-05-13-2t-daily.json"), "utf8")
) as typeof franceDaily & { date: string };
assert.equal(france11.date, "1983-05-11");
assert.equal(france13.date, "1983-05-13");
assert.deepEqual(france11.latitude, franceDaily.latitude);
assert.deepEqual(france11.longitude, franceDaily.longitude);
assert.deepEqual(france13.latitude, franceDaily.latitude);
assert.ok(!("hourly_2t_K" in france11) && !("hourly_2t_K" in france13));
assert.equal(Math.round(france11.grenoble_cell.tmin_K * 10000) / 10000, 277.4869);
assert.equal(Math.round(france11.grenoble_cell.tmax_K * 10000) / 10000, 283.7463);
assert.equal(Math.round(france13.grenoble_cell.tmin_K * 10000) / 10000, 279.6589);
assert.equal(Math.round(france13.grenoble_cell.tmax_K * 10000) / 10000, 286.5999);
assert.notEqual(Math.round(france11.grenoble_cell.tmin_K * 10000) / 10000, 276.564);
assert.notEqual(Math.round(france13.grenoble_cell.tmax_K * 10000) / 10000, 287.3429);
assert.deepEqual([...ERA5_FRANCE_DAILY_2T_DATES], ["1983-05-11", "1983-05-12", "1983-05-13"]);
assert.deepEqual([...ERA5_POINT_DATES], [
  "1982-05-12",
  "1983-05-11",
  "1983-05-12",
  "1983-05-13",
  "1986-05-12"
]);
assert.equal((ERA5_FRANCE_DAILY_2T_DATES as readonly string[]).includes("1986-05-12"), false);
const grenoble11Point = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-11.json"), "utf8")
) as typeof grenoblePointExtract & { date: string; grid_latitude: number; grid_longitude: number };
const grenoble13Point = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-13.json"), "utf8")
) as typeof grenoblePointExtract & { date: string; grid_latitude: number; grid_longitude: number };
assert.equal(grenoble11Point.date, "1983-05-11");
assert.equal(grenoble13Point.date, "1983-05-13");
assert.equal(grenoble11Point.method_version, grenoblePointExtract.method_version);
assert.equal(grenoble13Point.method_version, grenoblePointExtract.method_version);
assert.equal(grenoble11Point.grid_latitude, 45.25);
assert.equal(grenoble11Point.grid_longitude, 5.75);
assert.equal(grenoble13Point.grid_latitude, 45.25);
assert.equal(grenoble13Point.model_surface_altitude_m, grenoblePointExtract.model_surface_altitude_m);
const tmin11 = grenoble11Point.points.find((p) => p.variable_id === "air_temperature_min");
const tmax11 = grenoble11Point.points.find((p) => p.variable_id === "air_temperature_max");
const tmin13 = grenoble13Point.points.find((p) => p.variable_id === "air_temperature_min");
const tmax13 = grenoble13Point.points.find((p) => p.variable_id === "air_temperature_max");
assert.ok(tmin11 && tmax11 && tmin13 && tmax13);
assert.equal(Math.round(tmin11.value * 10000) / 10000, Math.round(france11.grenoble_cell.tmin_K * 10000) / 10000);
assert.equal(Math.round(tmax11.value * 10000) / 10000, Math.round(france11.grenoble_cell.tmax_K * 10000) / 10000);
assert.equal(Math.round(tmin13.value * 10000) / 10000, Math.round(france13.grenoble_cell.tmin_K * 10000) / 10000);
assert.equal(Math.round(tmax13.value * 10000) / 10000, Math.round(france13.grenoble_cell.tmax_K * 10000) / 10000);
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-11.json"))).digest("hex"),
  "4cd8ca90234fe597aae3eaa3584a39431972151d894b40b57c0367bbb602e14d"
);
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1983-05-13.json"))).digest("hex"),
  "c8173bd130bb9b7ebc0a2fa874e0ccb1045d3b8c335a0c9b38baf37a219255f7"
);
const ssrd11 = grenoble11Point.points.find((p) => p.variable_id === "solar_radiation");
assert.ok(ssrd11);
assert.equal(grenoble11Point.hourly_ssrd_Jm2.some((v) => v < 0), true, "ARCO night SSRD can be a tiny negative; not invented");
const ssrd11Clipped = grenoble11Point.hourly_ssrd_Jm2.reduce((a, b) => a + Math.max(0, b), 0);
assert.ok(Math.abs(ssrd11.value - ssrd11Clipped) < 1e-6, "daily SSRD clips noise < 1 J m-2, keeps raw hours");
assert.equal(grenoble11Point.points.length, 14);
assert.equal(grenoble13Point.points.length, 14);
const grenoble82Point = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1982-05-12.json"), "utf8")
) as typeof grenoblePointExtract & { date: string; grid_latitude: number; grid_longitude: number };
const grenoble86Point = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1986-05-12.json"), "utf8")
) as typeof grenoblePointExtract & { date: string; grid_latitude: number; grid_longitude: number };
assert.equal(grenoble82Point.date, "1982-05-12");
assert.equal(grenoble86Point.date, "1986-05-12");
assert.equal(grenoble82Point.method_version, grenoblePointExtract.method_version);
assert.equal(grenoble86Point.grid_latitude, 45.25);
assert.equal(grenoble86Point.grid_longitude, 5.75);
assert.equal(grenoble82Point.model_surface_altitude_m, grenoblePointExtract.model_surface_altitude_m);
assert.equal(grenoble82Point.points.length, 14);
assert.equal(grenoble86Point.points.length, 14);
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1982-05-12.json"))).digest("hex"),
  "cdca84c352a45e87b5832a70240dd8a0edd88be4c30ef1a33afe519ada59e31e"
);
assert.equal(
  createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "pipelines/era5/extracts/grenoble-1986-05-12.json"))).digest("hex"),
  "ce1f615b413ec682db9fb5313b14a0b3a4d7cfece0df2bd486b2a973958cd951"
);
const tmin82 = grenoble82Point.points.find((p) => p.variable_id === "air_temperature_min");
const tmax82 = grenoble82Point.points.find((p) => p.variable_id === "air_temperature_max");
const tmin86 = grenoble86Point.points.find((p) => p.variable_id === "air_temperature_min");
const tmax86 = grenoble86Point.points.find((p) => p.variable_id === "air_temperature_max");
assert.ok(tmin82 && tmax82 && tmin86 && tmax86);
assert.equal(Math.round(tmin82.value * 10000) / 10000, 275.9109);
assert.equal(Math.round(tmax82.value * 10000) / 10000, 291.7585);
assert.equal(Math.round(tmin86.value * 10000) / 10000, 281.7421);
assert.equal(Math.round(tmax86.value * 10000) / 10000, 295.395);
assert.ok(tmax86.value < 32.1 + 273.15, "ERA5 cell is not CORENC 32.1 C copied into Kelvin");
assert.equal(communePath({ region_slug: "auvergne-rhone-alpes", department_slug: "isere", slug: "grenoble" }), "/meteo/auvergne-rhone-alpes/isere/grenoble");
assert.equal(
  communeHistoryHref("/meteo/auvergne-rhone-alpes/isere/grenoble", "1983-05-12", "naissance"),
  "/meteo/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12&histoire=naissance"
);
assert.equal(
  communeHistoryHref("/meteo/auvergne-rhone-alpes/isere/grenoble", "1982-05-12"),
  "/meteo/auvergne-rhone-alpes/isere/grenoble?date=1982-05-12"
);
assert.equal(
  communeHistoryHref("/meteo/auvergne-rhone-alpes/isere/grenoble", "1986-05-12"),
  "/meteo/auvergne-rhone-alpes/isere/grenoble?date=1986-05-12"
);
const heatmapSrc = fs.readFileSync(path.join(process.cwd(), "src/components/YearHeatmap.tsx"), "utf8");
assert.ok(heatmapSrc.includes("prefetch={false}"), "heatmap years must not prefetch 8 commune RSC payloads");
assert.ok(heatmapSrc.includes("hrefFor"), "heatmap years must be real date links");
const explorerSrc = fs.readFileSync(path.join(process.cwd(), "src/components/PlaceExplorer.tsx"), "utf8");
const heroChunk = explorerSrc.slice(explorerSrc.indexOf("placeHero"), explorerSrc.indexOf("mapBlock"));
assert.ok(heroChunk.includes("heroTemps"), "hero must show official Tmin/Tmax on the first screen");
assert.ok(heroChunk.includes("data.observation.tminDisplay"));
assert.ok(heroChunk.includes("data.observation.tmaxDisplay"));
assert.ok(heroChunk.includes("data.observation.precipDisplay"), "hero rain must be the official millimetres, not ERA5");
assert.ok(heroChunk.includes("stationDisclaimer"), "hero must name the station and distance, not imply the thermometer is in town");
assert.ok(heroChunk.includes("climateLead"), "canonical commune hero shows last complete climate year, not the default day");
assert.ok(heroChunk.includes("formatCelsius"));
assert.ok(heroChunk.includes("formatMm"));
assert.ok(heroChunk.includes("Année climatique complète"));
assert.ok(heroChunk.includes("buildBirthLead"), "naissance story must reuse official Tmin/Tmax/rain + station");
assert.ok(!heroChunk.includes("era5"), "hero must not show ERA5 as the first answer");
assert.ok(!heroChunk.includes("placePhotoSrc"), "hero must not load the IGN photo on the LCP path");
assert.ok(!explorerSrc.includes("origin-observed.jpg"), "observation card must not duplicate origin-observed as a large LCP image");
assert.equal(yearsElapsed("1983-05-12", "2026-09-06"), 43);
assert.equal(yearsElapsed("1983-10-01", "2026-09-06"), 42);
assert.equal(yearsElapsed("2027-01-01", "2026-09-06"), null);
assert.ok(frenchLongDate("1983-05-12")?.includes("12"));
assert.equal(frenchLongDate("1983-13-40"), null);

const shareOk = buildShareText({
  placeName: "Grenoble",
  isoDate: "1983-05-12",
  hasObservation: true,
  tminDisplay: "6.6 °C",
  tmaxDisplay: "21.6 °C",
  precipDisplay: "0.1 mm",
  stationName: "CORENC LA REVIREE",
  distanceKm: 4.7,
  url: "http://localhost:3000/meteo/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12"
});
assert.ok(shareOk.includes("6.6 °C"));
assert.ok(shareOk.includes("21.6 °C"));
assert.ok(!shareOk.includes("invent"));
const shareMissing = buildShareText({
  placeName: "Grenoble",
  isoDate: "1900-01-01",
  hasObservation: false,
  url: "http://localhost:3000/x"
});
assert.ok(shareMissing.includes("aucune mesure officielle"));
assert.ok(!shareMissing.includes("0 °C"));

const birthOk = buildBirthLead({
  hasObservation: true,
  tminDisplay: "6.6 °C",
  tmaxDisplay: "21.6 °C",
  precipDisplay: "0.1 mm",
  stationDisclaimer: "Mesures provenant de la station CORENC LA REVIREE située à 4.7 km."
});
assert.ok(birthOk.includes("6.6 °C"));
assert.ok(birthOk.includes("21.6 °C"));
assert.ok(birthOk.includes("0.1 mm"));
assert.ok(birthOk.includes("CORENC LA REVIREE"));
assert.equal(birthOk.includes("14.2"), false, "naissance lead must not use ERA5 Tmax");
assert.equal(birthOk.includes("0.3 mm"), false, "naissance lead must not use ERA5 rain");
const birthHot = buildBirthLead({
  hasObservation: true,
  tminDisplay: "11.6 °C",
  tmaxDisplay: "32.1 °C",
  precipDisplay: "0.0 mm",
  stationDisclaimer: "Mesures provenant de la station CORENC LA REVIREE située à 4.7 km."
});
assert.ok(birthHot.includes("0.0 mm"));
assert.equal(birthHot.includes("2.1 mm"), false, "1986 naissance rain is CORENC 0.0 mm, not ERA5 2.1 mm");
const birthMissing = buildBirthLead({ hasObservation: false, precipDisplay: "0.0 mm" });
assert.ok(birthMissing.includes("Aucune mesure officielle"));
assert.equal(birthMissing.includes("0.0 mm"), false, "missing day must not invent 0 mm");

const birthExamples = birthExampleCards();
assert.equal(birthExamples.length, 3);
const birth1983 = birthExamples.find((card) => card.date === "1983-05-12");
const birth1986 = birthExamples.find((card) => card.date === "1986-05-12");
const birth1900 = birthExamples.find((card) => card.date === "1900-01-01");
assert.ok(birth1983 && birth1986 && birth1900);
assert.equal(birth1983.observation?.tmin, 6.6);
assert.equal(birth1983.observation?.tmax, 21.6);
assert.equal(birth1983.observation?.precipitationMm, 0.1);
assert.ok(birth1983.observation?.stationName.includes("CORENC"));
assert.equal(birth1983.observation?.distanceKm, 4.7);
assert.ok(birth1983.path.includes("histoire=naissance"));
assert.ok(birth1983.path.includes("date=1983-05-12"));
assert.equal(birth1983.lead.includes("ERA5"), false);
assert.equal(birth1986.observation?.precipitationMm, 0);
assert.ok(birth1986.lead.includes("0.0 mm"));
assert.equal(birth1986.lead.includes("2.1 mm"), false, "1986 example rain is CORENC 0.0 mm, not ERA5 2.1 mm");
assert.equal(birth1900.observation, null);
assert.ok(birth1900.lead.includes("Aucune mesure officielle"));
assert.equal(birth1900.lead.includes("0.0 mm"), false, "1900 example must not invent 0 mm");

const genericCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1983-05-12",
  dateInQuery: false,
  naissance: false,
  observation: {
    tmin: 6.6,
    tmax: 21.6,
    precipitationMm: 0.1,
    stationName: "CORENC LA REVIREE",
    distanceKm: 4.7
  }
});
assert.equal(genericCopy.title, "Grenoble — histoire météo | Observatoire Planète");
assert.equal(genericCopy.description.includes("6.6"), false, "without climate, canonical title stays generic — not the day");
const climateCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1983-05-12",
  dateInQuery: false,
  naissance: false,
  observation: {
    tmin: 6.6,
    tmax: 21.6,
    precipitationMm: 0.1,
    stationName: "CORENC LA REVIREE",
    distanceKm: 4.7
  },
  climate: {
    year: 2025,
    tmaxMean: 19.6,
    precipitationSum: 901.1,
    precipComplete: true,
    stationName: "GRENOBLE - LVD",
    distanceKm: 10.2
  }
});
assert.ok(climateCopy.title.includes("2025"));
assert.ok(climateCopy.title.includes("19.6 °C"));
assert.equal(climateCopy.title.includes("20.2"), false, "canonical title is last complete year, not the hottest-year record");
assert.equal(climateCopy.title.includes("6.6"), false, "canonical title must not paste the day observation");
assert.ok(climateCopy.description.includes("901.1 mm"));
assert.ok(climateCopy.description.includes("GRENOBLE - LVD"));
assert.ok(climateCopy.description.includes("10.2 km"));
assert.equal(climateCopy.description.includes("6.6"), false);
assert.equal(climateCopy.description.includes("ERA5"), false);
assert.equal(climateCopy.description.includes("20.2"), false);
const climateNoPrecip = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1983-05-12",
  dateInQuery: false,
  naissance: false,
  observation: null,
  climate: {
    year: 2025,
    tmaxMean: 19.6,
    precipitationSum: null,
    precipComplete: false,
    stationName: "GRENOBLE - LVD",
    distanceKm: 10.2
  }
});
assert.ok(climateNoPrecip.title.includes("19.6 °C"));
assert.equal(climateNoPrecip.description.includes("mm"), false, "incomplete precip must not invent millimetres");
const datedCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1983-05-12",
  dateInQuery: true,
  naissance: false,
  observation: {
    tmin: 6.6,
    tmax: 21.6,
    precipitationMm: 0.1,
    stationName: "CORENC LA REVIREE",
    distanceKm: 4.7
  },
  climate: {
    year: 2025,
    tmaxMean: 19.6,
    precipitationSum: 901.1,
    precipComplete: true,
    stationName: "GRENOBLE - LVD",
    distanceKm: 10.2
  }
});
assert.ok(datedCopy.title.includes("6.6 °C"));
assert.ok(datedCopy.title.includes("21.6 °C"));
assert.equal(datedCopy.title.includes("19.6"), false, "?date= title stays the day, not the climate year");
assert.ok(datedCopy.description.includes("0.1 mm"));
assert.ok(datedCopy.description.includes("CORENC LA REVIREE"));
assert.ok(datedCopy.description.includes("4.7 km"));
assert.equal(datedCopy.title.includes("14.2"), false);
assert.equal(datedCopy.description.includes("0.3 mm"), false, "SEO description rain is CORENC, not ERA5");
const birthCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1983-05-12",
  dateInQuery: true,
  naissance: true,
  observation: {
    tmin: 6.6,
    tmax: 21.6,
    precipitationMm: 0.1,
    stationName: "CORENC LA REVIREE",
    distanceKm: 4.7
  }
});
assert.ok(birthCopy.title.startsWith("Naissance à Grenoble"));
assert.ok(birthCopy.title.includes("6.6 °C"));
assert.equal(birthCopy.description.includes("14.2"), false);
const hotCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1986-05-12",
  dateInQuery: true,
  naissance: true,
  observation: {
    tmin: 11.6,
    tmax: 32.1,
    precipitationMm: 0,
    stationName: "CORENC LA REVIREE",
    distanceKm: 4.7
  }
});
assert.ok(hotCopy.description.includes("0.0 mm"));
assert.equal(hotCopy.description.includes("2.1 mm"), false, "1986 SEO rain is 0.0 mm, not ERA5 2.1 mm");
const missingCopy = communePageCopy({
  placeName: "Grenoble",
  department: "Isère",
  isoDate: "1900-01-01",
  dateInQuery: true,
  naissance: true,
  observation: null
});
assert.ok(missingCopy.title.includes("aucune mesure officielle"));
assert.ok(missingCopy.description.includes("inventée"));
assert.equal(missingCopy.description.includes("0.0 mm"), false);
assert.equal(missingCopy.description.includes("0 °C"), false);
assert.equal(
  officialCopyFromDay({
    originType: "REANALYSIS",
    tmin: 3.4,
    tmax: 14.2,
    precipitationMm: 0.3,
    station: { name: "ERA5", distanceKm: 0 }
  }),
  null,
  "ERA5 must not enter commune titles"
);
assert.equal(officialCopyFromDay(null), null);

const compareGeneric = comparePageCopy({ pairInQuery: false });
assert.equal(compareGeneric.title, "Comparer deux communes — Observatoire Planète");
assert.ok(compareGeneric.description.includes("n’invente pas d’écart"));
const compareMissing = comparePageCopy({ pairInQuery: true, missing: true });
assert.ok(compareMissing.title.includes("introuvable"));
assert.ok(compareMissing.description.includes("inventée"));
const compareSame = comparePageCopy({
  pairInQuery: true,
  communeA: "Grenoble",
  communeB: "Crolles",
  sameStation: true,
  stationA: "GRENOBLE - LVD",
  stationB: "GRENOBLE - LVD",
  overlap: {
    comparable: false,
    reason: "Les deux communes s’appuient sur le même poste climatique (GRENOBLE - LVD)."
  }
});
assert.ok(compareSame.title.includes("même station GRENOBLE - LVD"));
assert.ok(compareSame.description.includes("aucun écart n’est inventé"));
assert.equal(compareSame.title.includes("18.5"), false);
assert.equal(compareSame.description.includes("18.5"), false);
assert.equal(compareSame.description.includes("-0.3"), false);
const compareVoironCopy = comparePageCopy({
  pairInQuery: true,
  communeA: "Grenoble",
  communeB: "Voiron",
  sameStation: false,
  stationA: "GRENOBLE - LVD",
  stationB: "COUBLEVIE",
  overlap: {
    comparable: true,
    from: 2005,
    to: 2025,
    n: 21,
    tmaxMeanA: 18.5,
    tmaxMeanB: 18.2,
    tminMeanA: 7.3,
    tminMeanB: 8.4,
    precipMeanA: 980.8,
    precipMeanB: 1117.6,
    tmaxDelta: -0.3,
    precipDelta: 136.8,
    precipYears: 21
  }
});
assert.ok(compareVoironCopy.title.includes("18.5 °C"));
assert.ok(compareVoironCopy.title.includes("18.2 °C"));
assert.ok(compareVoironCopy.description.includes("COUBLEVIE"));
assert.ok(compareVoironCopy.description.includes("980.8 mm"));
assert.ok(compareVoironCopy.description.includes("1117.6 mm"));
assert.equal(compareVoironCopy.description.includes("ERA5"), false);
const compareSrc = fs.readFileSync(path.join(process.cwd(), "src/components/CompareCities.tsx"), "utf8");
assert.ok(compareSrc.includes("initialCompare"), "comparer first HTML must carry the official overlap");
assert.ok(compareSrc.includes("compareMatches(initialCompare"), "SSR pair must not wait on /api/v1/compare");
const comparerPageSrc = fs.readFileSync(
  path.join(process.cwd(), "src/app/comparer/page.tsx"),
  "utf8"
);
assert.ok(comparerPageSrc.includes("comparePageCopy"));
assert.ok(comparerPageSrc.includes("getCommuneCityCompareCached"));
assert.ok(comparerPageSrc.includes("getCompareExamplesCached"), "comparer landing must carry official example pairs");
assert.ok(comparerPageSrc.includes('frenchLanguageAlternates("/comparer")'), "canonical stays /comparer");
const compareExSrc = fs.readFileSync(path.join(process.cwd(), "src/components/CompareExamples.tsx"), "utf8");
assert.equal(compareExSrc.includes("ERA5"), false, "comparer examples must not show reanalysis");
const compareCacheSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/sqliteReadCache.ts"), "utf8");
assert.ok(compareCacheSrc.includes("compare-examples-v1"));

const lastCompleteOnlyTemps: Parameters<typeof lastCompleteClimateYear>[0] = [
  {
    year: 2024,
    tminMean: 7,
    tmaxMean: 18,
    precipitationSum: 900,
    daysGe30: 20,
    yearComplete: true,
    precipComplete: true
  },
  {
    year: 2025,
    tminMean: 8,
    tmaxMean: 20.2,
    precipitationSum: null,
    daysGe30: 40,
    yearComplete: false,
    precipComplete: false
  }
];
assert.equal(lastCompleteClimateYear([]), null);
assert.equal(lastCompleteClimateYear(lastCompleteOnlyTemps)?.year, 2024, "incomplete last calendar year is not a climate year");
assert.notEqual(lastCompleteClimateYear(lastCompleteOnlyTemps)?.tmaxMean, 20.2, "hottest incomplete year must not replace the last complete year");
assert.equal(climateCopyFromYearly(null), null);

const homeSrc = fs.readFileSync(path.join(process.cwd(), "src/components/ObservatoryHome.tsx"), "utf8");
assert.ok(homeSrc.includes("lastComplete"), "home cards must show the last official climate year");
assert.ok(homeSrc.includes("formatCelsius"));
assert.ok(homeSrc.includes("formatMm"));
assert.ok(homeSrc.includes("roundToPrecision"));
assert.ok(homeSrc.includes("Année climatique complète"));
assert.equal(homeSrc.includes("ERA5"), false, "home cards must not show reanalysis");
const homePageSrc = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.ok(homePageSrc.includes("getFeaturedClimateCached"), "home first HTML must carry featured official climate");
const homeCacheSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/sqliteReadCache.ts"), "utf8");
assert.ok(homeCacheSrc.includes("featured-climate-v2"));
const birthExSrc = fs.readFileSync(path.join(process.cwd(), "src/components/BirthExamples.tsx"), "utf8");
assert.ok(birthExSrc.includes("Aucune mesure officielle"));
assert.ok(birthExSrc.includes("formatCelsius"));
assert.equal(birthExSrc.includes("ERA5"), false, "naissance examples must not show reanalysis");
const naissancePageSrc = fs.readFileSync(path.join(process.cwd(), "src/app/naissance/page.tsx"), "utf8");
assert.ok(naissancePageSrc.includes("getBirthExamplesCached"), "naissance first HTML must carry official example days");
assert.ok(homeCacheSrc.includes("birth-examples-v1"));
const communePageSrc = fs.readFileSync(
  path.join(process.cwd(), "src/app/meteo/[region]/[department]/[commune]/page.tsx"),
  "utf8"
);
assert.ok(communePageSrc.includes("climateCopyFromYearly"), "commune metadata without query must use last complete climate year");
assert.ok(communePageSrc.includes("getCommuneYearlyPageCached"));
assert.ok(communePageSrc.includes("climateLead"), "canonical commune first HTML must carry the last complete climate year");
assert.ok(communePageSrc.includes("dateInQuery || histoire ? observed : null"), "JSON-LD WeatherObservation is only for a requested day");

assert.equal(warmerThanPercent(null, [1, 2, 3, 4, 5]), null);
assert.equal(warmerThanPercent(21.6, [10, 12, 15, 18, 20, 21.6, 22]), 71);
assert.equal(meanOfKnown([1, 2, 3, 4, null]), null, "mean needs at least 5 known values");
assert.equal(meanOfKnown([10, 20, 30, 40, 50, null])?.mean, 30);
assert.equal(meanOfKnown([10, 20, 30, 40, 50, null])?.n, 5);
assert.ok(meanOfKnown([0, 0, 0, 0, 0]), "measured zero remains zero; null is not zero");
assert.equal(
  describeSameDayLead({
    dayMonthLabel: "12 mai",
    yearCount: 8,
    thisTmin: 6.6,
    thisTmax: 32.1,
    percentile: 87,
    isHottest: true,
    isColdestMorning: false
  }),
  "C’est le 12 mai le plus chaud observé ici (8 années)."
);

assert.equal(searchPlaces("99999").length, 0);

const placeCount = (db.prepare(`SELECT COUNT(*) AS c FROM places`).get() as { c: number }).c;
if (placeCount >= 100) {
  const searchHits = searchPlaces("gren");
  assert.ok(searchHits.some((p) => p.insee_code === "38185"), "search must find Grenoble by name prefix");
  assert.ok(searchPlaces("voiron").some((p) => p.name === "Voiron"), "Voiron must come from the official referential");
  assert.ok(searchPlaces("38000").some((p) => p.insee_code === "38185"), "postal code must resolve Grenoble");
  const grenoblePlace = getPlaceByInsee("38185");
  assert.equal(grenoblePlace?.latitude, 45.1885, "pinned Grenoble coordinates must stay");
  assert.equal(grenoblePlace?.longitude, 5.7245);
  const grenobleSeo = seoFactsForPlace(grenoblePlace!);
  assert.equal(grenobleSeo.indexable, true);
  assert.ok(grenobleSeo.completeClimateYears >= 10, "Grenoble climate series must count real complete years, not 0");
  assert.equal(grenobleSeo.hasDistinctiveHistory, true);
  assert.ok(listIndexablePlaces().some((p) => p.insee_code === "38185"));
  assert.ok(listIndexablePlaces().length <= listPlaces().length);
}

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

const withIndependent = scoreConfidence({
  originType: "OBSERVED",
  distanceKm: 3,
  altitudeDeltaM: 20,
  qualitySuspect: false,
  coverageOk: true,
  interpolated: false,
  independentCorroboration: true
});
assert.ok(withIndependent.score > observed.score, "true independent corroboration may add a bonus");

const withEra5Coherence = scoreConfidence({
  originType: "OBSERVED",
  distanceKm: 3,
  altitudeDeltaM: 20,
  qualitySuspect: false,
  coverageOk: true,
  interpolated: false,
  independentCorroboration: false,
  reanalysisDeltaC: 1.2
});
assert.equal(
  withEra5Coherence.breakdown.some((b) => b.label.includes("autre groupe")),
  false,
  "ERA5 must not count as independent corroboration"
);
assert.ok(
  withEra5Coherence.breakdown.some((b) => b.label.includes("assimilation")),
  "small ERA5 delta is coherence, not independence"
);

const largeEra5Delta = scoreConfidence({
  originType: "OBSERVED",
  distanceKm: 3,
  altitudeDeltaM: 20,
  qualitySuspect: false,
  coverageOk: true,
  interpolated: false,
  independentCorroboration: false,
  reanalysisDeltaC: 6
});
assert.equal(
  largeEra5Delta.breakdown.some((b) => b.label.includes("assimilation")),
  false,
  "large ERA5 delta does not get a coherence bonus"
);

assert.ok(isYearComplete(330, 330));
assert.equal(isYearComplete(329, 365), false);
assert.ok(isPrecipComplete(330));
assert.equal(isPrecipComplete(0), false);
assert.ok(isMonthComplete(25, 25));
assert.equal(isMonthComplete(24, 31), false);
const monthSample = [
  { year: 2003, month: 7, tminMean: 16, tmaxMean: 28, precipitationSum: 40, daysGe30: 12, monthComplete: true, precipComplete: true },
  { year: 2003, month: 8, tminMean: 15, tmaxMean: 30, precipitationSum: null, daysGe30: 14, monthComplete: true, precipComplete: false },
  { year: 2003, month: 1, tminMean: -2, tmaxMean: 8, precipitationSum: 80, daysGe30: 0, monthComplete: true, precipComplete: true },
  { year: 2022, month: 7, tminMean: 18, tmaxMean: 32, precipitationSum: 10, daysGe30: 20, monthComplete: true, precipComplete: true },
  { year: 2022, month: 2, tminMean: 99, tmaxMean: 99, precipitationSum: 999, daysGe30: 0, monthComplete: false, precipComplete: false }
];
assert.equal(hottestCompleteMonth(monthSample)?.year, 2022);
assert.equal(hottestCompleteMonth(monthSample)?.month, 7);
assert.equal(wettestCompleteMonth(monthSample)?.month, 1);
assert.equal(wettestCompleteMonth(monthSample)?.precipitationSum, 80);
const monthRec = observedMonthRecords(monthSample);
assert.equal(monthRec.hottest?.value, 32);
assert.equal(monthRec.coldest?.month, 1);
assert.equal(monthRec.wettest?.value, 80);
assert.equal(formatMonthYear(2022, 7), "juillet 2022");
const chartHoles = monthChartRows(monthSample, 2022);
assert.equal(chartHoles[6].tmax, 32);
assert.equal(chartHoles[1].tmax, null, "incomplete February must not plot 99");
assert.equal(yearsWithTwelveCompleteMonths(monthSample).length, 0);
assert.equal(compareCompleteMonths(monthSample[0], monthSample[3]).comparable, true);
assert.equal(compareCompleteMonths(monthSample[0], monthSample[2]).comparable, false);
const janNormals = Array.from({ length: 24 }, (_, i) => ({
  year: 1991 + i,
  month: 1,
  tminMean: 1,
  tmaxMean: 2,
  precipitationSum: i === 0 ? null : 10,
  daysGe30: 0,
  monthComplete: true,
  precipComplete: i !== 0
}));
const janProfile = monthNormalsFromStats(janNormals, 1991, 2020, 24);
assert.equal(janProfile[0].available, true);
assert.equal(janProfile[0].tminMean, 1);
assert.equal(janProfile[0].tmaxMean, 2);
assert.equal(janProfile[0].precipAvailable, false);
assert.equal(janProfile[0].precipitationMean, null);
assert.equal(janProfile[1].available, false);
assert.equal(monthNormalProfileComplete(janProfile), false);
const shortJan = monthNormalsFromStats(janNormals.slice(0, 23), 1991, 2020, 24);
assert.equal(shortJan[0].available, false);
assert.equal(seoContentScore({ hasPlace: false, completeClimateYears: 0, hasDistinctiveHistory: false }).indexable, false);
assert.equal(seoContentScore({ hasPlace: true, completeClimateYears: 0, hasDistinctiveHistory: false }).indexable, false);
assert.equal(seoContentScore({ hasPlace: true, completeClimateYears: 0, hasDistinctiveHistory: true }).indexable, true);
assert.equal(seoContentScore({ hasPlace: true, completeClimateYears: 10, hasDistinctiveHistory: false }).indexable, true);
const shellPlace = {
  place_id: "x",
  name: "Coquille",
  slug: "coquille",
  insee_code: "99999",
  latitude: 45.2,
  longitude: 5.7,
  altitude_m: 200,
  timezone: "Europe/Paris",
  region_slug: "auvergne-rhone-alpes",
  department_slug: "isere",
  postal_codes: null,
  population: null
};
const emptyFacts = seoFactsForPlace(shellPlace, { stations: [], observed: [] });
assert.equal(emptyFacts.indexable, false);
assert.equal(emptyFacts.completeClimateYears, 0);
assert.equal(emptyFacts.hasDistinctiveHistory, false);
assert.equal(emptyFacts.methodVersion, SEO_CONTENT_METHOD);
const climateFacts = seoFactsForPlace(shellPlace, {
  stations: [
    {
      id: "st",
      name: "Poste",
      latitude: 45.2,
      longitude: 5.7,
      altitude: 200,
      years: 12,
      complete_years: 12
    }
  ],
  observed: []
});
assert.equal(climateFacts.indexable, true);
assert.equal(climateFacts.completeClimateYears, 12);
assert.equal(climateFacts.hasDistinctiveHistory, true);
const observedOnly = seoFactsForPlace(shellPlace, {
  stations: [],
  observed: [
    {
      id: "st",
      name: "Poste",
      latitude: 45.2,
      longitude: 5.7,
      altitude: 200,
      observedDays: 4
    }
  ]
});
assert.equal(observedOnly.completeClimateYears, 0);
assert.equal(observedOnly.hasDistinctiveHistory, true);
assert.equal(observedOnly.indexable, true);
assert.equal(observedOnly.climateStationId, null, "ERA5 / empty climate table must not invent a climate station");
const hreflang = frenchLanguageAlternates("/meteo/auvergne-rhone-alpes/isere/grenoble");
assert.equal(hreflang.languages.fr, hreflang.canonical);
assert.equal(hreflang.languages["x-default"], hreflang.canonical);
assert.equal(hreflang.canonical, publicAbsoluteUrl("/meteo/auvergne-rhone-alpes/isere/grenoble"));
assert.equal("en" in hreflang.languages, false, "no English URL until an English page exists");
const siteLd = JSON.stringify(websiteJsonLd());
assert.ok(siteLd.includes("Observatoire Planète"));
assert.equal(siteLd.includes("SearchAction"), false);
const grenobleLd = communeJsonLd({
  place: {
    name: "Grenoble",
    slug: "grenoble",
    insee_code: "38185",
    latitude: 45.1885,
    longitude: 5.7245,
    region_slug: "auvergne-rhone-alpes",
    department_slug: "isere"
  },
  path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
  title: "Grenoble — histoire météo | Observatoire Planète",
  description: "Températures observées à Grenoble.",
  observation: {
    originType: "OBSERVED",
    date: "1983-05-12",
    tmin: 6.6,
    tmax: 21.6,
    precipitationMm: 0.1,
    station: { id: "38126001", name: "CORENC LA REVIREE" }
  }
});
const grenobleLdText = JSON.stringify(grenobleLd);
assert.ok(grenobleLdText.includes("WeatherObservation"));
assert.ok(grenobleLdText.includes("38185"));
assert.ok(grenobleLdText.includes("6.6"));
assert.ok(grenobleLdText.includes("0.1"));
assert.equal(grenobleLdText.includes("ERA5"), false);
assert.equal(grenobleLdText.includes("REANALYSIS"), false);
assert.equal(grenobleLdText.includes("6.9"), false);
assert.equal(grenobleLdText.includes("dew"), false);
assert.equal(grenobleLdText.includes("0.3"), false, "ERA5 precip must not enter JSON-LD");
assert.equal(grenobleLdText.includes("km/h"), false, "ERA5 wind must not enter JSON-LD");
assert.equal(grenobleLdText.includes("hPa"), false, "ERA5 MSL must not enter JSON-LD");
assert.equal(grenobleLdText.includes("895"), false, "ERA5 surface pressure must not enter JSON-LD");
assert.equal(grenobleLdText.includes("69.4"), false, "ERA5 gust must not enter JSON-LD");
assert.equal(grenobleLdText.includes("20.8"), false, "ERA5 SSRD must not enter JSON-LD");
assert.equal(grenobleLdText.includes("27.3"), false, "ERA5 snow SWE must not enter JSON-LD");
assert.equal(grenobleLdText.includes("MJ"), false, "ERA5 solar must not enter JSON-LD");
const grenoble11LdText = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble — histoire météo | Observatoire Planète",
    description: "Températures observées à Grenoble.",
    observation: {
      originType: "OBSERVED",
      date: "1983-05-11",
      tmin: 8.1,
      tmax: 16.3,
      precipitationMm: 0.1,
      station: { id: "38126001", name: "CORENC LA REVIREE" }
    }
  })
);
assert.ok(grenoble11LdText.includes("8.1"));
assert.ok(grenoble11LdText.includes("16.3"));
assert.equal(grenoble11LdText.includes("4.3"), false, "ERA5 11 mai tmin must not enter JSON-LD");
assert.equal(grenoble11LdText.includes("10.6"), false, "ERA5 11 mai tmax must not enter JSON-LD");
assert.equal(grenoble11LdText.includes("3.6"), false, "ERA5 11 mai precip must not enter JSON-LD");
const grenoble13LdText = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble — histoire météo | Observatoire Planète",
    description: "Températures observées à Grenoble.",
    observation: {
      originType: "OBSERVED",
      date: "1983-05-13",
      tmin: 14.8,
      tmax: 16.1,
      precipitationMm: 2.8,
      station: { id: "38126001", name: "CORENC LA REVIREE" }
    }
  })
);
assert.ok(grenoble13LdText.includes("14.8"));
assert.ok(grenoble13LdText.includes("2.8"));
assert.equal(grenoble13LdText.includes("6.5"), false, "ERA5 13 mai tmin must not enter JSON-LD");
assert.equal(grenoble13LdText.includes("13.4"), false, "ERA5 13 mai tmax must not enter JSON-LD");
assert.equal(grenoble13LdText.includes("7.2"), false, "ERA5 13 mai precip must not enter JSON-LD");
const grenoble82LdText = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble — histoire météo | Observatoire Planète",
    description: "Températures observées à Grenoble.",
    observation: {
      originType: "OBSERVED",
      date: "1982-05-12",
      tmin: 5.1,
      tmax: 26.1,
      precipitationMm: 0,
      station: { id: "38126001", name: "CORENC LA REVIREE" }
    }
  })
);
assert.ok(grenoble82LdText.includes("5.1"));
assert.ok(grenoble82LdText.includes("26.1"));
assert.equal(grenoble82LdText.includes("2.8"), false, "ERA5 1982 tmin must not enter JSON-LD");
assert.equal(grenoble82LdText.includes("18.6"), false, "ERA5 1982 tmax must not enter JSON-LD");
const grenoble86LdText = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble — histoire météo | Observatoire Planète",
    description: "Températures observées à Grenoble.",
    observation: {
      originType: "OBSERVED",
      date: "1986-05-12",
      tmin: 11.6,
      tmax: 32.1,
      precipitationMm: 0,
      station: { id: "38126001", name: "CORENC LA REVIREE" }
    }
  })
);
assert.ok(grenoble86LdText.includes("32.1"));
assert.ok(grenoble86LdText.includes("11.6"));
assert.equal(grenoble86LdText.includes("8.6"), false, "ERA5 1986 tmin must not enter JSON-LD");
assert.equal(grenoble86LdText.includes("22.2"), false, "ERA5 1986 tmax must not enter JSON-LD");
const grenoble86LdPrecip = (JSON.parse(grenoble86LdText) as { "@graph": { additionalProperty?: { name: string; value: number }[] }[] })[
  "@graph"
].flatMap((n) => n.additionalProperty || []).find((p) => p.name === "precipitation");
assert.equal(grenoble86LdPrecip?.value, 0, "JSON-LD precip is CORENC 0 mm, not ERA5 2.1 mm");
const era5Rejected = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble",
    description: "test",
    observation: {
      originType: "REANALYSIS",
      date: "1983-05-12",
      tmin: 3.4,
      tmax: 14.2,
      precipitationMm: null,
      station: { id: "era5", name: "ERA5" }
    }
  })
);
assert.equal(era5Rejected.includes("WeatherObservation"), false);
assert.equal(era5Rejected.includes("3.4"), false);
const missingPrecip = JSON.stringify(
  communeJsonLd({
    place: {
      name: "Grenoble",
      slug: "grenoble",
      insee_code: "38185",
      latitude: 45.1885,
      longitude: 5.7245,
      region_slug: "auvergne-rhone-alpes",
      department_slug: "isere"
    },
    path: "/meteo/auvergne-rhone-alpes/isere/grenoble",
    title: "Grenoble",
    description: "test",
    observation: {
      originType: "OBSERVED",
      date: "1900-01-01",
      tmin: 1.1,
      tmax: 2.2,
      precipitationMm: null,
      station: { id: "x", name: "x" }
    }
  })
);
assert.equal(missingPrecip.includes("precipitation"), false);
assert.ok(missingPrecip.includes("1.1"));
assert.ok(isSeasonComplete(75, 75));
assert.equal(isSeasonComplete(74, 92), false);
assert.ok(isNormalComplete(24));
assert.equal(isNormalComplete(23), false);
assert.equal(anomaly(20, 18), 2);
assert.equal(anomaly(null, 18), null);
assert.equal(anomaly(20, null), null);
const yearRecords = observedYearRecords([
  { year: 2024, tminMean: 0, tmaxMean: 40, precipitationSum: null, daysGe30: 80, yearComplete: false, precipComplete: false },
  { year: 2000, tminMean: 8, tmaxMean: 18, precipitationSum: 800, daysGe30: 5, yearComplete: true, precipComplete: true },
  { year: 2003, tminMean: 6, tmaxMean: 22, precipitationSum: 400, daysGe30: 20, yearComplete: true, precipComplete: true },
  { year: 2010, tminMean: 5, tmaxMean: 20, precipitationSum: null, daysGe30: 10, yearComplete: true, precipComplete: false }
]);
assert.equal(yearRecords.hottest?.year, 2003);
assert.equal(yearRecords.coldest?.year, 2010);
assert.equal(yearRecords.wettest?.year, 2000);
assert.equal(yearRecords.hottest?.value, 22);

const trendYears = (n: number, start = 2000, tmaxAt: (i: number) => number, complete = true) =>
  Array.from({ length: n }, (_, i) => ({
    year: start + i,
    yearComplete: complete,
    tminMean: 7 + i * 0.1,
    tmaxMean: tmaxAt(i),
    daysGe30: 10 + i,
    daysFrost: 40 - i,
    tropicalNights: i % 3 === 0 ? 1 : 0
  }));
const tooShort = stationWarmingTrend(trendYears(MIN_TREND_COMPLETE_YEARS - 1, 2000, () => 18));
assert.equal(tooShort.linear.available, false);
assert.equal(tooShort.homogenized, false);
assert.equal(tooShort.method, TREND_METHOD);
const mixedIncomplete = [
  ...trendYears(10, 2000, () => 18),
  { year: 2010, yearComplete: false, tminMean: 99, tmaxMean: 99, daysGe30: 99, daysFrost: 0, tropicalNights: 99 },
  ...trendYears(4, 2011, () => 18)
];
const olsShort = stationWarmingTrend(mixedIncomplete);
assert.equal(olsShort.linear.available, false, "incomplete years must not fill the 15-year threshold");
const ignoreSpike = stationWarmingTrend([
  { year: 1999, yearComplete: false, tminMean: 99, tmaxMean: 99, daysGe30: 99, daysFrost: 0, tropicalNights: 99 },
  ...trendYears(15, 2000, (i) => 10 + i * 0.1)
]);
assert.equal(ignoreSpike.linear.available, true);
if (ignoreSpike.linear.available) {
  assert.equal(ignoreSpike.linear.tmaxPerDecade, 1, "incomplete outlier year must not enter the slope");
}
const rising = stationWarmingTrend(trendYears(15, 2000, (i) => 10 + i * 0.1));
assert.equal(rising.linear.available, true);
if (rising.linear.available) {
  assert.equal(rising.linear.n, 15);
  assert.equal(rising.linear.tmaxPerDecade, 1);
  assert.equal(rising.linear.tminPerDecade, 1);
  assert.equal(rising.linear.shortSeries, true);
}
const windowed = stationWarmingTrend(trendYears(TREND_WINDOW_YEARS * 2, 2000, (i) => i));
assert.equal(windowed.windows.comparable, true);
if (windowed.windows.comparable) {
  assert.equal(windowed.windows.early.from, 2000);
  assert.equal(windowed.windows.early.to, 2009);
  assert.equal(windowed.windows.late.from, 2010);
  assert.equal(windowed.windows.late.to, 2019);
  assert.equal(windowed.windows.tmaxDelta, 10);
}
const overlapWindows = stationWarmingTrend(trendYears(15, 2000, () => 18));
assert.equal(overlapWindows.windows.comparable, false);
const olsFit = ordinaryLeastSquares([2000, 2010], [10, 11]);
assert.ok(olsFit);
assert.ok(Math.abs(olsFit.slope - 0.1) < 1e-9);
assert.equal(formatSignedPerDecade(1.24, "°C"), "+1.2 °C / 10 ans");
assert.equal(formatSignedPerDecade(-0.3, "j"), "-0.3 j / 10 ans");
assert.equal(formatSignedPerDecade(null, "°C"), "non disponible");

const cityYears = (start: number, tmax: number) =>
  Array.from({ length: 6 }, (_, i) => ({
    year: start + i,
    tminMean: 8,
    tmaxMean: tmax,
    precipitationSum: 800,
    daysGe30: 10,
    yearComplete: true,
    precipComplete: true
  }));
const citySide = (insee: string, name: string, stationId: string, tmax: number) => ({
  insee,
  name,
  station: { id: stationId, name: stationId, distanceKm: 5 },
  years: cityYears(2000, tmax),
  normal: {
    available: false,
    sameStation: false,
    period: "1991-2020",
    tminMean: null,
    tmaxMean: null,
    precipitationMean: null,
    precipAvailable: false,
    stationId: null
  }
});
assert.equal(compareCityClimate(citySide("38185", "Grenoble", "A", 18), citySide("38185", "Grenoble", "A", 18)).overlap.comparable, false);
assert.equal(compareCityClimate(citySide("38185", "Grenoble", "A", 18), citySide("38140", "Crolles", "A", 20)).sameStation, true);
assert.equal(compareCityClimate(citySide("38185", "Grenoble", "A", 18), citySide("38140", "Crolles", "A", 20)).overlap.comparable, false);
const twoCities = compareCityClimate(citySide("38185", "Grenoble", "A", 18), citySide("38140", "Crolles", "B", 20));
assert.equal(twoCities.sameStation, false);
assert.equal(twoCities.overlap.comparable, true);
if (twoCities.overlap.comparable) {
  assert.equal(twoCities.overlap.n, 6);
  assert.equal(twoCities.overlap.tmaxDelta, 2);
}

const year1990 = {
  year: 1990,
  tminMean: 10,
  tmaxMean: 18,
  precipitationSum: 800,
  daysGe30: 5,
  yearComplete: true,
  precipComplete: true
};
const year2020 = {
  year: 2020,
  tminMean: 11.5,
  tmaxMean: 20,
  precipitationSum: 700,
  daysGe30: 20,
  yearComplete: true,
  precipComplete: true
};
const incompleteYear = { ...year2020, year: 2024, yearComplete: false, precipComplete: false, precipitationSum: null };
assert.equal(compareCompleteYears(incompleteYear, year2020).comparable, false);
const yearOk = compareCompleteYears(year1990, year2020);
assert.equal(yearOk.comparable, true);
if (yearOk.comparable) {
  assert.equal(yearOk.tmaxDelta, 2);
  assert.equal(yearOk.precipDelta, -100);
}
const mixedPrecip = compareCompleteYears(year1990, { ...year2020, precipComplete: false, precipitationSum: null });
assert.equal(mixedPrecip.comparable, true);
if (mixedPrecip.comparable) {
  assert.equal(mixedPrecip.precipDelta, null);
}

const summerHot = hottestCompleteSeason([
  { year: 2002, season: "JJA", tminMean: 14, tmaxMean: 26, precipitationSum: null, daysGe30: 10, seasonComplete: true, precipComplete: false },
  { year: 2003, season: "JJA", tminMean: 15, tmaxMean: 28, precipitationSum: 80, daysGe30: 40, seasonComplete: true, precipComplete: true },
  { year: 2004, season: "JJA", tminMean: 20, tmaxMean: 40, precipitationSum: 0, daysGe30: 50, seasonComplete: false, precipComplete: false }
]);
assert.equal(summerHot?.year, 2003);
const winterCold = coldestCompleteSeason([
  { year: 2012, season: "DJF", tminMean: 0.5, tmaxMean: 8, precipitationSum: 80, daysGe30: 0, seasonComplete: true, precipComplete: true },
  { year: 2017, season: "DJF", tminMean: -3.2, tmaxMean: 6, precipitationSum: 40, daysGe30: 0, seasonComplete: true, precipComplete: true },
  { year: 2005, season: "DJF", tminMean: -20, tmaxMean: 0, precipitationSum: null, daysGe30: 0, seasonComplete: false, precipComplete: false }
]);
assert.equal(winterCold?.year, 2017);
assert.equal(seasonPublicLabel("DJF").eyebrow, "LES HIVERS");
assert.equal(shareCardPath("grenoble", "1983-05-12"), "/og/grenoble/1983-05-12");
assert.equal(shareCardPath("grenoble", "1983-13-40"), null);
const cardMissing = buildShareCardModel({
  placeName: "Grenoble",
  isoDate: "1900-01-01",
  hasObservation: false,
  tminDisplay: "0.0 °C",
  precipDisplay: "0.0 mm"
});
assert.equal(cardMissing.hasObservation, false);
assert.ok(cardMissing.note.includes("Aucune mesure officielle"));
assert.ok(!cardMissing.note.includes("0.0"));
const cardOk = buildShareCardModel({
  placeName: "Grenoble",
  isoDate: "1983-05-12",
  hasObservation: true,
  tminDisplay: "6.6 °C",
  tmaxDisplay: "21.6 °C",
  precipDisplay: "0.1 mm",
  stationName: "CORENC LA REVIREE",
  distanceKm: 4.7
});
assert.equal(cardOk.tminDisplay, "6.6 °C");
assert.ok(cardOk.stationLine?.includes("CORENC"));
assert.ok(!cardOk.note.toLowerCase().includes("invent"));
assert.equal(
  compareCompleteSeasons(
    { year: 2003, season: "JJA", tminMean: 15, tmaxMean: 28, precipitationSum: 80, daysGe30: 40, seasonComplete: true, precipComplete: true },
    { year: 2003, season: "DJF", tminMean: 1, tmaxMean: 8, precipitationSum: 80, daysGe30: 0, seasonComplete: true, precipComplete: true }
  ).comparable,
  false
);

const threeHot = [
  { date: "2003-08-01", tmin: 18, tmax: 32 },
  { date: "2003-08-02", tmin: 19, tmax: 33 },
  { date: "2003-08-03", tmin: 20, tmax: 34 }
];
assert.equal(heatEpisodesAt(threeHot, 30).length, 1);
assert.equal(heatEpisodesAt(threeHot, 30)[0].durationDays, 3);
assert.equal(heatEpisodesAt(threeHot, 30)[0].tmaxMax, 34);
assert.equal(heatEpisodesAt(threeHot.slice(0, 2), 30).length, 0);
assert.equal(
  heatEpisodesAt(
    [
      ...threeHot,
      { date: "2003-08-05", tmin: 20, tmax: 32 },
      { date: "2003-08-06", tmin: 20, tmax: 32 },
      { date: "2003-08-07", tmin: 20, tmax: 32 }
    ],
    30
  ).length,
  2
);
const nullBreaks = heatEpisodesAt(
  [
    { date: "2015-07-01", tmin: 20, tmax: 35 },
    { date: "2015-07-02", tmin: null, tmax: null },
    { date: "2015-07-03", tmin: 20, tmax: 35 },
    { date: "2015-07-04", tmin: 20, tmax: 35 },
    { date: "2015-07-05", tmin: 20, tmax: 35 }
  ],
  30
);
assert.equal(nullBreaks.length, 1);
assert.equal(nullBreaks[0].startDate, "2015-07-03");
assert.equal(
  heatEpisodesAt(
    [
      { date: "2003-08-01", tmin: 18, tmax: 32 },
      { date: "2003-08-02", tmin: null, tmax: 33 },
      { date: "2003-08-03", tmin: 20, tmax: 34 }
    ],
    30
  )[0].tminMin,
  null
);
const heatSummary = stationHeatStreaks([
  ...threeHot,
  { date: "2003-08-10", tmin: 22, tmax: 41 },
  { date: "2003-08-11", tmin: 22, tmax: 42 },
  { date: "2003-08-12", tmin: 22, tmax: 40 }
]);
assert.equal(heatSummary.officialHeatwave, false);
assert.equal(heatSummary.method, "heat-streak-tmax-v1");
assert.equal(heatSummary.bands.find((band) => band.thresholdC === 30)?.episodeCount, 2);
assert.equal(heatSummary.bands.find((band) => band.thresholdC === 40)?.longest?.durationDays, 3);

const childhoodOk = childhoodVsRecent(
  [
    ...Array.from({ length: 13 }, (_, i) => ({
      year: 1983 + i,
      tminMean: 8,
      tmaxMean: 17,
      precipitationSum: null,
      daysGe30: 5,
      yearComplete: true,
      precipComplete: false
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      year: 2016 + i,
      tminMean: 9,
      tmaxMean: 19,
      precipitationSum: null,
      daysGe30: 12,
      yearComplete: true,
      precipComplete: false
    }))
  ],
  1983,
  2026
);
assert.equal(childhoodOk.comparable, true);
if (childhoodOk.comparable) {
  assert.equal(childhoodOk.tmaxDelta, 2);
}
assert.equal(
  childhoodVsRecent(
    [
      ...Array.from({ length: 13 }, (_, i) => ({
        year: 1983 + i,
        tminMean: 8,
        tmaxMean: 17,
        precipitationSum: null,
        daysGe30: 5,
        yearComplete: true,
        precipComplete: false
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        year: 1996 + i,
        tminMean: 9,
        tmaxMean: 19,
        precipitationSum: null,
        daysGe30: 12,
        yearComplete: true,
        precipComplete: false
      }))
    ],
    1983,
    2026
  ).comparable,
  false
);
assert.equal(formatSignedCelsius(2), "+2.0 °C");
assert.equal(formatSignedCelsius(-0.4), "-0.4 °C");

const obsCount = (db.prepare(`SELECT COUNT(*) AS c FROM observations WHERE date = '1983-05-12'`).get() as { c: number }).c;
if (obsCount === 0) {
  console.log("golden Grenoble skipped: no observations for 1983-05-12 (npm run import:meteo)");
} else {
  const grenoble = getPlaceHistory("grenoble", "1983-05-12");
  assert.ok(grenoble, "Grenoble seed must exist");
  assert.equal(grenoble.preferredStation?.id, "38126001");
  assert.equal(grenoble.observation?.tmin, 6.6);
  assert.equal(grenoble.observation?.tmax, 21.6);
  assert.equal(grenoble.observation?.precipitationMm, 0.1);
  assert.equal(grenoble.observation?.precipDisplay, "0.1 mm");
  assert.ok(grenoble.stationDisclaimer?.includes("CORENC LA REVIREE"));
  assert.ok(grenoble.stationDisclaimer?.includes("4.7 km"));
  assert.ok(!grenoble.stationDisclaimer?.includes("ERA5"));
  assert.equal(grenoble.observation?.originType, "OBSERVED");
  assert.equal(grenoble.observation?.originLabel, "Mesure officielle");
  const daySeo = getPlaceDayObservation("grenoble", "1983-05-12");
  assert.ok(daySeo);
  assert.equal(daySeo.originType, "OBSERVED");
  assert.equal(daySeo.station.id, "38126001");
  assert.equal(daySeo.tmin, 6.6);
  assert.equal(daySeo.tmax, 21.6);
  assert.equal(daySeo.precipitationMm, 0.1);
  const birthSeo = communePageCopy({
    placeName: grenoble.place.name,
    department: "Isère",
    isoDate: "1983-05-12",
    dateInQuery: true,
    naissance: true,
    observation: officialCopyFromDay(daySeo)
  });
  assert.ok(birthSeo.title.startsWith("Naissance à Grenoble"));
  assert.ok(birthSeo.description.includes("0.1 mm"));
  assert.ok(birthSeo.description.includes("CORENC LA REVIREE"));
  assert.ok(birthSeo.description.includes("4.7 km"));
  assert.equal(birthSeo.description.includes("4.73"), false);
  assert.equal(birthSeo.description.includes("0.3 mm"), false);
  assert.equal(birthSeo.description.includes("14.2"), false);
  assert.ok(grenoble.sameDayContext);
  assert.equal(grenoble.sameDayContext.n, 8);
  assert.equal(grenoble.sameDayContext.tminMean, 7.3);
  assert.equal(grenoble.sameDayContext.tmaxMean, 21.6);
  assert.equal(grenoble.sameDayContext.tmaxPercentile, 50);
  assert.ok(grenoble.sameDayContext.label?.includes("plus chaude que 50 %"));
  assert.ok(grenoble.era5, "ERA5 point for Grenoble 1983-05-12 must be ingested (no invented Kelvin)");
  assert.equal(grenoble.era5.originType, "REANALYSIS");
  assert.equal(grenoble.era5.originLabel, "Estimation climatique");
  assert.notEqual(grenoble.era5.originLabel, "Mesure officielle");
  assert.equal(grenoble.era5.tmin, 3.4);
  assert.equal(grenoble.era5.tmax, 14.2);
  assert.equal(grenoble.era5.dewpointMin, 2.0);
  assert.equal(grenoble.era5.dewpointMax, 6.9);
  assert.ok(grenoble.era5.dewpointMin < grenoble.era5.tmin, "dewpoint is not a copy of 2t");
  assert.equal(grenoble.era5.precipMm, 0.3);
  assert.notEqual(grenoble.era5.precipMm, grenoble.observation.precipitationMm, "ERA5 rain is not a copy of CORENC");
  assert.equal(grenoble.era5.precipDelta, 0.2);
  assert.equal(grenoble.era5.method, "nearest");
  assert.equal(grenoble.era5.methodVersion, "era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1");
  assert.equal(grenoble.era5.windSpeedDisplay, formatKmhFromMs(grenoble.era5.windSpeedMs));
  assert.ok(grenoble.era5.windSpeedMs != null && grenoble.era5.windSpeedMs > 0);
  assert.ok(grenoble.era5.windFromDeg != null && grenoble.era5.windFromDeg >= 0 && grenoble.era5.windFromDeg <= 360);
  assert.equal(grenoble.era5.mslDisplay, formatHpaFromPa(mslPoint.value));
  assert.ok(grenoble.era5.mslHpa != null && grenoble.era5.mslHpa >= 800 && grenoble.era5.mslHpa <= 1100);
  assert.equal(grenoble.era5.spDisplay, formatHpaFromPa(spPoint.value));
  assert.ok(grenoble.era5.spHpa != null && grenoble.era5.spHpa !== grenoble.era5.mslHpa);
  assert.equal(grenoble.era5.snowSweDisplay, formatMmWaterFromM(snowPoint.value));
  assert.equal(grenoble.era5.snowSweMm, roundToPrecision(snowPoint.value * 1000, 1));
  assert.notEqual(grenoble.era5.snowSweMm, roundToPrecision(snowPoint.value * 100, 1), "SWE is not displayed as snow height cm");
  assert.equal(grenoble.era5.ssrdDisplay, formatMjFromJm2(ssrdPoint.value));
  assert.equal(grenoble.era5.gustDisplay, formatKmhFromMs(gustPoint.value));
  assert.ok(grenoble.era5.modelSurfaceAltitudeM != null && grenoble.era5.modelSurfaceAltitudeM > 200);
  const era5Rows = (db.prepare(`SELECT COUNT(*) AS c FROM point_extractions`).get() as { c: number }).c;
  assert.equal(era5Rows, 70, "14 variables × 5 jours Grenoble, no invented rows");
  const precipRow = db.prepare(
    `SELECT unit, value FROM point_extractions WHERE variable_id = 'precipitation' AND date = '1983-05-12'`
  ).get() as { unit: string; value: number };
  assert.equal(precipRow.unit, "m");
  assert.ok(precipRow.value > 0 && precipRow.value < 0.001, "ERA5 precip stored in metres, not millimetres");
  assert.ok(grenoble.comparison, "MF vs ERA5 comparison must be present without fusion");
  assert.equal(grenoble.comparison.tminDelta, -3.2);
  assert.equal(grenoble.comparison.tmaxDelta, -7.4);
  assert.equal(
    grenoble.confidence.breakdown.some((b) => b.label.includes("autre groupe")),
    false,
    "assimilated ERA5 is not an independent source"
  );

  const grenoble11 = getPlaceHistory("grenoble", "1983-05-11");
  assert.ok(grenoble11?.era5, "ERA5 point for Grenoble 1983-05-11 must be ingested");
  assert.equal(grenoble11.observation?.tmin, 8.1);
  assert.equal(grenoble11.observation?.tmax, 16.3);
  assert.equal(grenoble11.observation?.precipitationMm, 0.1);
  assert.equal(grenoble11.era5.tmin, 4.3);
  assert.equal(grenoble11.era5.tmax, 10.6);
  assert.equal(grenoble11.era5.dewpointMin, 2.5);
  assert.equal(grenoble11.era5.dewpointMax, 5.3);
  assert.equal(grenoble11.era5.precipMm, 3.6);
  assert.equal(grenoble11.era5.precipDelta, 3.5);
  assert.notEqual(grenoble11.era5.precipMm, grenoble11.observation?.precipitationMm, "11 mai: ERA5 rain is not a copy of CORENC");
  assert.equal(grenoble11.comparison?.tminDelta, -3.8);
  assert.equal(grenoble11.comparison?.tmaxDelta, -5.7);
  assert.equal(grenoble11.era5.gridLatitude, 45.25);
  assert.equal(grenoble11.era5.modelSurfaceAltitudeM, 985.5);
  const daySeo11 = getPlaceDayObservation("grenoble", "1983-05-11");
  assert.equal(daySeo11?.tmin, 8.1);
  assert.equal(daySeo11?.tmax, 16.3);
  assert.notEqual(daySeo11?.tmin, grenoble11.era5.tmin);

  const grenoble13 = getPlaceHistory("grenoble", "1983-05-13");
  assert.ok(grenoble13?.era5, "ERA5 point for Grenoble 1983-05-13 must be ingested");
  assert.equal(grenoble13.observation?.tmin, 14.8);
  assert.equal(grenoble13.observation?.tmax, 16.1);
  assert.equal(grenoble13.observation?.precipitationMm, 2.8);
  assert.equal(grenoble13.era5.tmin, 6.5);
  assert.equal(grenoble13.era5.tmax, 13.4);
  assert.equal(grenoble13.era5.dewpointMin, 4.6);
  assert.equal(grenoble13.era5.dewpointMax, 8.5);
  assert.equal(grenoble13.era5.precipMm, 7.2);
  assert.equal(grenoble13.era5.precipDelta, 4.4);
  assert.notEqual(grenoble13.era5.precipMm, grenoble13.observation?.precipitationMm, "13 mai: ERA5 rain is not a copy of CORENC");
  assert.equal(grenoble13.comparison?.tminDelta, -8.3);
  assert.equal(grenoble13.comparison?.tmaxDelta, -2.7);
  assert.ok(Math.abs((grenoble13.comparison?.tminDelta ?? 0)) > 2, "large Tmin gap is displayed, not fused");
  const daySeo13 = getPlaceDayObservation("grenoble", "1983-05-13");
  assert.equal(daySeo13?.tmin, 14.8);
  assert.equal(daySeo13?.precipitationMm, 2.8);

  const grenoble82 = getPlaceHistory("grenoble", "1982-05-12");
  assert.ok(grenoble82?.era5, "ERA5 point for Grenoble 1982-05-12 must be ingested");
  assert.equal(grenoble82.observation?.tmin, 5.1);
  assert.equal(grenoble82.observation?.tmax, 26.1);
  assert.equal(grenoble82.observation?.precipitationMm, 0);
  assert.equal(grenoble82.observation?.precipDisplay, "0.0 mm", "measured zero rain is 0.0 mm, not missing");
  assert.equal(grenoble82.era5.tmin, 2.8);
  assert.equal(grenoble82.era5.tmax, 18.6);
  assert.equal(grenoble82.era5.dewpointMin, -1.2);
  assert.equal(grenoble82.era5.dewpointMax, 5.2);
  assert.equal(grenoble82.era5.precipMm, 0.0);
  assert.equal(grenoble82.era5.precipDelta, 0);
  assert.equal(grenoble82.comparison?.tminDelta, -2.3);
  assert.equal(grenoble82.comparison?.tmaxDelta, -7.5);
  assert.equal(grenoble82.era5.modelSurfaceAltitudeM, 985.5);
  const precip82 = db.prepare(
    `SELECT value FROM point_extractions WHERE variable_id = 'precipitation' AND date = '1982-05-12'`
  ).get() as { value: number };
  assert.ok(precip82.value > 0 && precip82.value < 0.0001, "1982 ERA5 0.0 mm display is rounded 0.0375 mm, not a copied station zero");

  const grenoblePath = "/meteo/auvergne-rhone-alpes/isere/grenoble";
  assert.ok(grenoble82.seriesSameDay?.some((row) => row.date === "1982-05-12"));
  assert.ok(grenoble82.seriesSameDay?.some((row) => row.date === "1986-05-12"));
  assert.equal(
    communeHistoryHref(grenoblePath, "1982-05-12"),
    `${grenoblePath}?date=1982-05-12`
  );

  const grenoble86 = getPlaceHistory("grenoble", "1986-05-12");
  assert.ok(grenoble86?.era5, "ERA5 point for Grenoble 1986-05-12 must be ingested");
  assert.equal(grenoble86.observation?.tmin, 11.6);
  assert.equal(grenoble86.observation?.tmax, 32.1);
  assert.equal(grenoble86.observation?.precipitationMm, 0);
  assert.equal(grenoble86.observation?.precipDisplay, "0.0 mm", "1986 hero rain must be CORENC 0, not ERA5 2.1 mm");
  assert.equal(grenoble86.era5.tmin, 8.6);
  assert.equal(grenoble86.era5.tmax, 22.2);
  assert.equal(grenoble86.era5.dewpointMin, 6.0);
  assert.equal(grenoble86.era5.dewpointMax, 11.6);
  assert.notEqual(grenoble86.era5.tmax, grenoble86.observation?.tmax, "1986: ERA5 22.2 C is not CORENC 32.1 C");
  assert.equal(grenoble86.era5.precipMm, 2.1);
  assert.equal(grenoble86.era5.precipDelta, 2.1);
  assert.equal(grenoble86.comparison?.tminDelta, -3.0);
  assert.equal(grenoble86.comparison?.tmaxDelta, -9.9);
  assert.ok(Math.abs(grenoble86.comparison?.tmaxDelta ?? 0) > 2, "1986 heat-record gap is displayed, not fused");
  const daySeo86 = getPlaceDayObservation("grenoble", "1986-05-12");
  assert.equal(daySeo86?.tmax, 32.1);
  assert.notEqual(daySeo86?.tmax, grenoble86.era5.tmax);
  assert.equal(daySeo86?.precipitationMm, 0);
  const birthSeo86 = communePageCopy({
    placeName: "Grenoble",
    department: "Isère",
    isoDate: "1986-05-12",
    dateInQuery: true,
    naissance: true,
    observation: officialCopyFromDay(daySeo86)
  });
  assert.ok(birthSeo86.description.includes("0.0 mm"));
  assert.equal(birthSeo86.description.includes("2.1 mm"), false);

  const missingDay = getPlaceHistory("grenoble", "1900-01-01");
  assert.ok(missingDay, "Grenoble must still resolve for a date without observations");
  assert.equal(missingDay.observation, null);
  assert.equal(missingDay.preferredStation, null);
  assert.equal(missingDay.stationDisclaimer, null);

  const annualCount = (db.prepare(`SELECT COUNT(*) AS c FROM annual_statistics`).get() as { c: number }).c;
  const seasonalCount = (db.prepare(`SELECT COUNT(*) AS c FROM seasonal_statistics`).get() as { c: number }).c;
  const normalCount = (db.prepare(`SELECT COUNT(*) AS c FROM station_normals`).get() as { c: number }).c;
  if (annualCount === 0 || seasonalCount === 0 || normalCount === 0) computeStationStatistics();
  const yearly = getCommuneYearly("38185");
  assert.ok(yearly, "Grenoble INSEE must resolve yearly payload");
  assert.ok(yearly.computed, "yearly climate must not depend on the selected day");
  assert.ok(yearly.years.filter((row) => row.yearComplete).length >= 10);
  assert.ok(yearly.years.length <= 150, "yearly API must not dump daily rows");
  assert.ok((yearly.months || []).length >= 50, "full yearly keeps month rows for the API");
  const pageYearly = getCommuneYearly("38185", { includeDetailRows: false });
  assert.ok(pageYearly, "page yearly payload must resolve");
  assert.equal(pageYearly.detailRows, false, "first HTML marks climate details as not inlined");
  assert.equal(yearly.detailRows, true, "yearly API keeps month/season/heat rows");
  assert.equal(pageYearly.months.length, 0, "first HTML must not serialize every month-station row");
  assert.equal(pageYearly.summers.length, 0, "first HTML must not duplicate JJA already in seasons");
  assert.equal(pageYearly.seasons.length, 0, "first HTML must not serialize every season-station row");
  assert.equal(pageYearly.heat.bands[0]?.episodeCount ?? 0, 0, "first HTML must not scan daily heat streaks");
  assert.ok(pageYearly.years.filter((row) => row.yearComplete).length >= 10);
  assert.ok(pageYearly.monthRecords.hottest, "month records stay even without dumping month rows");
  assert.ok(pageYearly.hottestSummer, "summer record stays even without dumping season rows");
  assert.ok((yearly.heat.bands[0]?.episodeCount ?? 0) >= 1, "full yearly still has observed heat streaks");
  assert.ok((yearly.summers || []).length <= 80, "summers must not dump daily rows");
  assert.ok((yearly.seasons || []).length <= 4 * 80, "seasonal API must not dump daily rows");
  const winters = (yearly.seasons || []).filter((row) => row.season === "DJF");
  assert.ok(winters.length, "Grenoble climate station must have winter rows in the payload");
  for (const row of yearly.seasons || []) {
    if (!row.precipComplete) {
      assert.equal(row.precipitationSum, null, "incomplete season precip must not become 0");
    }
  }
  if (yearly.coldestWinter) {
    assert.equal(yearly.coldestWinter.season, "DJF");
    assert.equal(yearly.coldestWinter.seasonComplete, true);
    const minTmin = Math.min(
      ...winters.filter((row) => row.seasonComplete && row.tminMean != null).map((row) => row.tminMean as number)
    );
    assert.equal(yearly.coldestWinter.tminMean, minTmin);
  }
  assert.ok((yearly.months || []).length <= 12 * 80, "monthly API must not dump daily rows");
  for (const row of yearly.months || []) {
    if (!row.precipComplete) {
      assert.equal(row.precipitationSum, null, "incomplete month precip must not become 0");
    }
  }
  if (yearly.monthRecords.hottest) {
    const maxTmax = Math.max(
      ...(yearly.months || [])
        .filter((row) => row.monthComplete && row.tmaxMean != null)
        .map((row) => row.tmaxMean as number)
    );
    assert.equal(yearly.monthRecords.hottest.value, maxTmax);
  }
  if (yearly.monthRecords.wettest) {
    const wet = (yearly.months || []).find(
      (row) => row.year === yearly.monthRecords.wettest?.year && row.month === yearly.monthRecords.wettest?.month
    );
    assert.equal(wet?.precipComplete, true);
    assert.equal(wet?.monthComplete, true);
  }
  assert.ok(yearly.monthNormal);
  assert.equal(yearly.monthNormal.period, "1991-2020");
  assert.equal(yearly.monthNormal.sameStation, false, "LVD has < 24 complete months in 1991-2020");
  assert.equal(yearly.monthNormal.available, true);
  assert.equal(yearly.monthNormal.station?.id, "38095001");
  const mayNormal = yearly.monthNormal.months.find((row) => row.month === 5);
  const julyNormal = yearly.monthNormal.months.find((row) => row.month === 7);
  assert.equal(mayNormal?.tminMean, 9.1);
  assert.equal(mayNormal?.tmaxMean, 21.2);
  assert.equal(julyNormal?.tminMean, 14.3);
  assert.equal(julyNormal?.tmaxMean, 28.3);
  assert.equal(julyNormal?.precipitationMean, 68.3);
  assert.ok(yearly.station, "climate series must map to one station, not copy observations per commune");
  const yearlySeo = seoFactsForPlace(getPlaceByInsee("38185")!);
  assert.equal(yearlySeo.completeClimateYears, yearly.station.completeYears);
  assert.equal(yearlySeo.climateStationId, yearly.station.id);
  assert.equal(yearly.normal.period, "1991-2020");
  assert.equal(yearly.normal.minYearsRequired, 24);
  for (const row of yearly.years) {
    if (!row.precipComplete) {
      assert.equal(row.precipitationSum, null, "incomplete precip year must not become 0");
    }
    if (!row.yearComplete || !yearly.normal.sameStation) {
      assert.equal(row.tmaxAnomaly ?? null, null, "anomaly only for complete years of the same station as the normal");
    }
  }
  for (const row of yearly.summers) {
    if (!row.precipComplete) {
      assert.equal(row.precipitationSum, null, "incomplete summer precip must not become 0");
    }
  }
  if (yearly.hottestSummer) {
    assert.equal(yearly.hottestSummer.seasonComplete, true);
    const maxTmax = Math.max(...yearly.summers.filter((row) => row.seasonComplete && row.tmaxMean != null).map((row) => row.tmaxMean as number));
    assert.equal(yearly.hottestSummer.tmaxMean, maxTmax);
  }
  if (yearly.yearRecords.hottest) {
    const maxTmax = Math.max(
      ...yearly.years.filter((row) => row.yearComplete && row.tmaxMean != null).map((row) => row.tmaxMean as number)
    );
    assert.equal(yearly.yearRecords.hottest.value, maxTmax);
  }
  if (yearly.yearRecords.wettest) {
    const wet = yearly.years.find((row) => row.year === yearly.yearRecords.wettest?.year);
    assert.equal(wet?.precipComplete, true);
  }
  if (yearly.normal.available && !yearly.normal.sameStation) {
    assert.ok(yearly.normal.station, "nearby 1991-2020 normal must name one station");
    assert.notEqual(yearly.normal.station?.id, yearly.station?.id);
  }
  assert.equal(yearly.warming.method, TREND_METHOD);
  assert.equal(yearly.warming.homogenized, false);
  const completeForTrend = yearly.years.filter((row) => row.yearComplete);
  if (completeForTrend.length >= MIN_TREND_COMPLETE_YEARS) {
    assert.equal(yearly.warming.linear.available, true);
    if (yearly.warming.linear.available) {
      assert.equal(yearly.warming.linear.n, completeForTrend.length);
      assert.equal(yearly.warming.linear.from, completeForTrend[0].year);
      assert.equal(yearly.warming.linear.to, completeForTrend[completeForTrend.length - 1].year);
    }
  } else {
    assert.equal(yearly.warming.linear.available, false);
  }
  if (completeForTrend.length >= TREND_WINDOW_YEARS * 2 && yearly.warming.windows.comparable) {
    assert.ok(yearly.warming.windows.early.to < yearly.warming.windows.late.from);
  }
  assert.equal(yearly.heat.officialHeatwave, false);
  assert.equal(yearly.heat.method, "heat-streak-tmax-v1");
  const heat30 = yearly.heat.bands.find((band) => band.thresholdC === 30);
  if (heat30?.longest) {
    assert.ok(heat30.longest.durationDays >= 3);
    assert.ok(heat30.longest.tmaxMax >= 30);
  }
  const heat40 = yearly.heat.bands.find((band) => band.thresholdC === 40);
  if (heat40?.longest) {
    assert.ok(heat40.longest.tmaxMax >= 40);
    assert.ok(heat40.longest.durationDays >= 3);
  }
  const completePair = yearly.years.filter((row) => row.yearComplete);
  if (completePair.length >= 2) {
    const compared = getCommuneYearCompare("38185", completePair[0].year, completePair[completePair.length - 1].year);
    assert.equal(compared?.comparison.comparable, true);
  }
  const childhood = getCommuneChildhood("38185", 1983, 2026);
  assert.ok(childhood, "Grenoble childhood payload must resolve");
  assert.equal(childhood.computed, true, "childhood climate must not wait for a daily observation fetch");
  assert.equal(childhood.birthYear, 1983);
  assert.equal(childhood.comparison.comparable, true, "1983 Grenoble must find one long station, not concatenate");
  if (childhood.comparison.comparable) {
    assert.ok(childhood.station, "childhood series must name one station");
    assert.ok(childhood.comparison.childhood.n >= 5);
    assert.ok(childhood.comparison.recent.n >= 5);
    assert.ok(childhood.comparison.childhood.to < childhood.comparison.recent.from);
  }
  const childhoodBeforeCoverage = getCommuneChildhood("38185", 1900, 2026);
  assert.ok(childhoodBeforeCoverage);
  assert.equal(childhoodBeforeCoverage.computed, true);
  assert.equal(childhoodBeforeCoverage.comparison.comparable, false, "no childhood years before the imported series");
  const sameCity = getCommuneCityCompare("38185", "38185");
  assert.equal(sameCity?.overlap.comparable, false);
  const vsCrolles = getCommuneCityCompare("38185", "38140");
  const vsPierre = getCommuneCityCompare("38185", "38303");
  const vsVoiron = getCommuneCityCompare("38185", "38563");
  assert.ok(vsCrolles, "Grenoble vs Crolles must resolve");
  assert.ok(vsPierre, "Grenoble vs La Pierre must resolve");
  assert.ok(vsVoiron, "Grenoble vs Voiron must resolve");
  if (vsCrolles?.sameStation) {
    assert.equal(vsCrolles.overlap.comparable, false, "same climate station must not invent a city gap");
  }
  if (vsPierre?.sameStation) {
    assert.equal(vsPierre.overlap.comparable, false, "same climate station must not invent a city gap");
  }
  if (vsVoiron?.sameStation) {
    assert.equal(vsVoiron.overlap.comparable, false, "same climate station must not invent a city gap");
  } else if (vsVoiron?.overlap.comparable) {
    assert.ok(vsVoiron.stationA && vsVoiron.stationB);
    assert.notEqual(vsVoiron.stationA?.id, vsVoiron.stationB?.id);
    assert.ok(vsVoiron.overlap.n >= 5);
    if (vsVoiron.overlap.precipDelta != null) {
      assert.ok(vsVoiron.overlap.precipYears >= 5);
    }
    const voironSeo = comparePageCopy({
      pairInQuery: true,
      communeA: vsVoiron.communeA.name,
      communeB: vsVoiron.communeB.name,
      sameStation: vsVoiron.sameStation,
      stationA: vsVoiron.stationA?.name ?? null,
      stationB: vsVoiron.stationB?.name ?? null,
      overlap: vsVoiron.overlap
    });
    assert.ok(voironSeo.title.includes("Voiron"));
    assert.ok(voironSeo.description.includes(vsVoiron.stationB.name));
    assert.equal(voironSeo.description.includes("ERA5"), false);
    if (vsVoiron.overlap.tmaxMeanA != null && vsVoiron.overlap.tmaxMeanB != null) {
      assert.ok(voironSeo.title.includes(`${vsVoiron.overlap.tmaxMeanA.toFixed(1)} °C`));
      assert.ok(voironSeo.title.includes(`${vsVoiron.overlap.tmaxMeanB.toFixed(1)} °C`));
    }
  }
  if (vsCrolles?.sameStation) {
    const crollesSeo = comparePageCopy({
      pairInQuery: true,
      communeA: vsCrolles.communeA.name,
      communeB: vsCrolles.communeB.name,
      sameStation: true,
      stationA: vsCrolles.stationA?.name ?? null,
      stationB: vsCrolles.stationB?.name ?? null,
      overlap: vsCrolles.overlap
    });
    assert.ok(crollesSeo.title.includes("même station"));
    assert.ok(crollesSeo.description.includes("aucun écart n’est inventé"));
    if (vsVoiron?.overlap.comparable && vsVoiron.overlap.tmaxMeanA != null) {
      assert.equal(
        crollesSeo.description.includes(`${vsVoiron.overlap.tmaxMeanA.toFixed(1)} °C`),
        false,
        "same-station pair must not reuse another city's overlap temperatures"
      );
    }
  }
  const compareExamples = compareExampleCards();
  assert.equal(compareExamples.length, 2);
  const voironExample = compareExamples.find((card) => card.inseeB === "38563");
  const crollesExample = compareExamples.find((card) => card.inseeB === "38140");
  assert.ok(voironExample && crollesExample);
  assert.equal(voironExample.sameStation, false);
  assert.ok(voironExample.summary.includes("18.5 °C"));
  assert.ok(voironExample.summary.includes("18.2 °C"));
  assert.ok(voironExample.description.includes("COUBLEVIE"));
  assert.ok(voironExample.description.includes("980.8 mm"));
  assert.equal(voironExample.description.includes("ERA5"), false);
  assert.ok(voironExample.path.includes("a=38185"));
  assert.ok(voironExample.path.includes("b=38563"));
  assert.equal(crollesExample.sameStation, true);
  assert.ok(crollesExample.summary.includes("même station"));
  assert.ok(crollesExample.description.includes("aucun écart n’est inventé"));
  assert.equal(
    crollesExample.summary.includes("18.5 °C"),
    false,
    "same-station example must not paste Voiron's overlap onto Crolles"
  );
  const homeCards = featuredClimateCards(listFeaturedPlaces());
  assert.equal(homeCards.length, 3);
  const grenobleHome = homeCards.find((card) => card.place.insee_code === "38185");
  const crollesHome = homeCards.find((card) => card.place.insee_code === "38140");
  const pierreHome = homeCards.find((card) => card.place.insee_code === "38303");
  assert.ok(grenobleHome && crollesHome && pierreHome);
  assert.equal(grenobleHome.station?.id, "38538002");
  assert.equal(grenobleHome.lastComplete?.year, 2025);
  const yearly2025 = yearly.years.find((row) => row.year === 2025);
  assert.ok(yearly2025?.yearComplete && yearly2025.precipComplete);
  assert.equal(grenobleHome.lastComplete?.tmaxMean, yearly2025.tmaxMean);
  assert.equal(grenobleHome.lastComplete?.precipitationSum, yearly2025.precipitationSum);
  assert.equal(grenobleHome.lastComplete?.precipitationSum, 901.1);
  assert.equal(grenobleHome.lastComplete?.tmaxMean, 19.6);
  assert.equal(grenobleHome.station?.distanceKm, 10.2, "home distance stays 1 decimal like the day hero");
  if (yearly.yearRecords.hottest) {
    assert.notEqual(
      grenobleHome.lastComplete?.year,
      yearly.yearRecords.hottest.year,
      "home cards must not paste the hottest-year record onto the last complete year"
    );
  }
  assert.equal(crollesHome.station?.id, grenobleHome.station?.id, "Crolles shares LVD — do not invent a city gap");
  assert.equal(pierreHome.station?.id, grenobleHome.station?.id);
  assert.equal(crollesHome.station?.distanceKm, 8.1);
  assert.equal(pierreHome.station?.distanceKm, 11.6);
  assert.equal(crollesHome.lastComplete?.year, grenobleHome.lastComplete?.year);
  assert.equal(crollesHome.lastComplete?.tmaxMean, grenobleHome.lastComplete?.tmaxMean);
  assert.equal(crollesHome.lastComplete?.precipitationSum, grenobleHome.lastComplete?.precipitationSum);
  const grenobleClimate = climateCopyFromYearly(yearly);
  assert.equal(grenobleClimate?.year, 2025);
  assert.equal(grenobleClimate?.tmaxMean, 19.6);
  assert.equal(grenobleClimate?.precipitationSum, 901.1);
  assert.equal(grenobleClimate?.precipComplete, true);
  assert.ok(grenobleClimate?.stationName.includes("LVD"));
  assert.equal(grenobleClimate?.distanceKm, 10.2);
  const grenobleClimateCopy = communePageCopy({
    placeName: "Grenoble",
    department: "Isère",
    isoDate: "1983-05-12",
    dateInQuery: false,
    naissance: false,
    observation: null,
    climate: grenobleClimate
  });
  assert.ok(grenobleClimateCopy.title.includes("2025"));
  assert.ok(grenobleClimateCopy.title.includes("19.6 °C"));
  assert.equal(grenobleClimateCopy.title.includes("20.2"), false);
  assert.ok(grenobleClimateCopy.description.includes("901.1 mm"));
  assert.ok(grenobleClimateCopy.description.includes("10.2 km"));
  assert.equal(grenobleClimateCopy.description.includes("6.6"), false);
  assert.equal(grenobleClimateCopy.description.includes("ERA5"), false);
  const crollesClimate = climateCopyFromYearly(getCommuneYearly("38140", { includeDetailRows: false }));
  assert.equal(crollesClimate?.year, grenobleClimate?.year);
  assert.equal(crollesClimate?.tmaxMean, grenobleClimate?.tmaxMean);
  assert.equal(crollesClimate?.precipitationSum, grenobleClimate?.precipitationSum);
  assert.equal(crollesClimate?.stationName, grenobleClimate?.stationName);
  assert.equal(crollesClimate?.distanceKm, 8.1);
  const incompleteSql = db.prepare(
    `SELECT precipitation_sum, precip_complete, year_complete FROM annual_statistics WHERE precip_complete = 0 LIMIT 1`
  ).get() as { precipitation_sum: number | null; precip_complete: number; year_complete: number } | undefined;
  if (incompleteSql) {
    assert.equal(incompleteSql.precipitation_sum, null);
  }
}

assert.equal(isAllowedIgnLayer("ortho"), true);
assert.equal(isAllowedIgnLayer("plan"), true);
assert.equal(isAllowedIgnLayer("google"), false);
assert.throws(() => parseIgnTile("99", "0", "0"));
const tile = parseIgnTile("12", "10", "20");
assert.equal(tile.zoom, 12);
assert.equal(tile.row, 10);
assert.equal(tile.col, 20);

const mf38 = filterDailyResources(
  [
    { title: "Q_38_2020-2025_RR-T-Vent.csv.gz", url: "https://example.test/Q_38_2020-2025_RR-T-Vent.csv.gz" },
    { title: "Q_75_2020-2025_RR-T-Vent.csv.gz", url: "https://example.test/Q_75_2020-2025_RR-T-Vent.csv.gz" }
  ],
  "38",
  1980,
  2026
);
assert.equal(mf38.length, 1);
assert.equal(mf38[0].name, "Q_38_2020-2025_RR-T-Vent.csv.gz");

const checksumA = communeSnapshotChecksum({
  department: { nom: "Isère", code: "38", codeRegion: "84" },
  region: { nom: "Auvergne-Rhône-Alpes", code: "84" },
  communes: []
});
const checksumB = communeSnapshotChecksum({
  department: { nom: "Isère", code: "38", codeRegion: "84" },
  region: { nom: "Auvergne-Rhône-Alpes", code: "84" },
  communes: []
});
assert.equal(checksumA, checksumB);

console.log("science tests ok");
