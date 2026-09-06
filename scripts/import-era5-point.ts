import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import db from "../src/lib/db";
import { assertCommercialSource } from "../packages/licensing/src/gate";
import { assertFranceEra5Point } from "../src/lib/era5France";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, v = "true"] = arg.replace(/^--/, "").split("=");
  return [k, v];
}));

const file = args.file;
if (!file) {
  throw new Error("Fichier JSON d'extractions ERA5 réel requis : --file=... (aucune valeur n'est inventée).");
}

assertCommercialSource("copernicus.c3s.era5.single-levels-hourly");

const absFile = path.resolve(file);
const raw = fs.readFileSync(absFile);
const checksum = createHash("sha256").update(raw).digest("hex");
const payload = JSON.parse(raw.toString("utf8")) as {
  source_id: string;
  dataset_version?: string;
  method: string;
  method_version?: string;
  doi?: string;
  access?: { kind?: string; uri?: string; note?: string };
  latitude: number;
  longitude: number;
  grid_latitude?: number;
  grid_longitude?: number;
  hours_used?: number;
  points: { date: string; variable_id: string; value: number; unit: string }[];
};

if (payload.source_id !== "copernicus.c3s.era5.single-levels-hourly") {
  throw new Error("source_id ERA5 attendu");
}
if (!payload.points?.length) {
  throw new Error("Aucune extraction dans le JSON : rien n'est inventé.");
}
assertFranceEra5Point(payload.latitude, payload.longitude);
for (const p of payload.points) {
  if (typeof p.value !== "number" || !Number.isFinite(p.value)) {
    throw new Error(`Valeur invalide pour ${p.variable_id} ${p.date} : refus d'inventer.`);
  }
  if (p.variable_id === "precipitation") {
    if (p.unit !== "m") {
      throw new Error(`Précipitation ERA5 attendue en mètres (canonique), pas ${p.unit}`);
    }
  } else if (p.unit !== "K" && p.unit !== "degC" && p.unit !== "Celsius") {
    throw new Error(`Unité inattendue ${p.unit} pour ${p.variable_id}`);
  }
}

const dates = [...new Set(payload.points.map((p) => p.date))];
const methodVersion = payload.method_version || "era5-point-nearest-hourly-2t-d2m-tp-v1";
const lineageId = randomUUID();

db.prepare(`
  INSERT INTO data_lineage(lineage_id, displayed_as, steps, raw_uri, checksum_sha256, method_version, created_at)
  VALUES (?, 'era5_point_extraction', ?, ?, ?, ?, ?)
`).run(
  lineageId,
  JSON.stringify([
    {
      step: "arco_era5_zarr_nearest",
      access: payload.access ?? null,
      doi: payload.doi ?? "10.24381/cds.adbb2d47",
      latitude: payload.latitude,
      longitude: payload.longitude,
      grid_latitude: payload.grid_latitude ?? null,
      grid_longitude: payload.grid_longitude ?? null,
      hours_used: payload.hours_used ?? null
    },
    { step: "import_json", file: absFile }
  ]),
  absFile,
  checksum,
  methodVersion,
  new Date().toISOString()
);

const insert = db.prepare(`
  INSERT INTO point_extractions(id, latitude, longitude, method, date, variable_id, value, unit, origin_type, source_id, dataset_version, lineage_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REANALYSIS', ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const date of dates) {
    db.prepare(`
      DELETE FROM point_extractions
      WHERE source_id = ?
        AND date = ?
        AND abs(latitude - ?) < 0.0001
        AND abs(longitude - ?) < 0.0001
    `).run(payload.source_id, date, payload.latitude, payload.longitude);
  }
  for (const p of payload.points) {
    insert.run(
      randomUUID(),
      payload.latitude,
      payload.longitude,
      payload.method,
      p.date,
      p.variable_id,
      p.value,
      p.unit,
      payload.source_id,
      payload.dataset_version || null,
      lineageId
    );
  }
});
tx();

console.log(`${payload.points.length} extractions ERA5 enregistrées (réanalyse, pas une observation). sha256=${checksum}`);
