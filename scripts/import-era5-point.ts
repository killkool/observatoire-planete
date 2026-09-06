import fs from "node:fs";
import { randomUUID } from "node:crypto";
import db from "../src/lib/db";
import { assertCommercialSource } from "../packages/licensing/src/gate";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, v = "true"] = arg.replace(/^--/, "").split("=");
  return [k, v];
}));

const file = args.file;
if (!file) {
  throw new Error("Fichier JSON d'extractions ERA5 réel requis : --file=... (aucune valeur n'est inventée).");
}

assertCommercialSource("copernicus.c3s.era5.single-levels-hourly");

const payload = JSON.parse(fs.readFileSync(file, "utf8")) as {
  source_id: string;
  dataset_version?: string;
  method: string;
  latitude: number;
  longitude: number;
  points: { date: string; variable_id: string; value: number; unit: string }[];
};

if (payload.source_id !== "copernicus.c3s.era5.single-levels-hourly") {
  throw new Error("source_id ERA5 attendu");
}

const insert = db.prepare(`
  INSERT INTO point_extractions(id, latitude, longitude, method, date, variable_id, value, unit, origin_type, source_id, dataset_version, lineage_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REANALYSIS', ?, ?, ?)
`);

const lineageId = randomUUID();
db.prepare(`
  INSERT INTO data_lineage(lineage_id, displayed_as, steps, raw_uri, checksum_sha256, method_version, created_at)
  VALUES (?, 'era5_point_extraction', ?, ?, NULL, 'era5-point-v1', ?)
`).run(lineageId, JSON.stringify([{ step: "user_supplied_json" }, { file }]), file, new Date().toISOString());

const tx = db.transaction(() => {
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

console.log(`${payload.points.length} extractions ERA5 enregistrées (réanalyse, pas une observation).`);
