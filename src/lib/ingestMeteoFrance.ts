import { randomUUID } from "node:crypto";
import db from "./db";
import { rebuildFranceDaily } from "./aggregates";
import { iterateCsvRows, listDailyResources, loadCompressed, parseDate, parseNumber, SOURCE_ID } from "./meteoFrance";
import { assertCommercialSource } from "../../packages/licensing/src/gate";
import type { FetchMode } from "./localPaths";

export type IngestResult = {
  department: string;
  fromYear: number;
  toYear: number;
  resources: string[];
  rowsWritten: number;
  skippedUnchanged: number;
  downloaded: number;
  fromCache: number;
  minDate: string | null;
  maxDate: string | null;
};

export async function ingestMeteoFranceDaily(
  department: string,
  fromYear: number,
  toYear: number,
  mode: FetchMode = "local-first"
): Promise<IngestResult> {
  assertCommercialSource(SOURCE_ID);

  const resources = await listDailyResources(department, fromYear, toYear, mode);
  const stationUpsert = db.prepare(`
    INSERT INTO stations(id, name, department, latitude, longitude, altitude, source_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, department=excluded.department, latitude=excluded.latitude,
      longitude=excluded.longitude, altitude=excluded.altitude, source_id=excluded.source_id
  `);
  const obsUpsert = db.prepare(`
    INSERT INTO observations(
      station_id, date, tmin, tmax, tmean, precipitation,
      origin_type, source_id, original_tmin, original_tmax, original_tmean, original_precipitation, lineage_id
    )
    VALUES (?, ?, ?, ?, ?, ?, 'OBSERVED', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(station_id, date) DO UPDATE SET
      tmin=excluded.tmin, tmax=excluded.tmax, tmean=excluded.tmean, precipitation=excluded.precipitation,
      origin_type=excluded.origin_type, source_id=excluded.source_id,
      original_tmin=excluded.original_tmin, original_tmax=excluded.original_tmax,
      original_tmean=excluded.original_tmean, original_precipitation=excluded.original_precipitation,
      lineage_id=excluded.lineage_id
  `);
  const knownFile = db.prepare(`SELECT checksum_sha256 FROM import_files WHERE checksum_sha256 = ?`);
  const insertFile = db.prepare(`
    INSERT INTO import_files(checksum_sha256, uri, bytes, source_id, downloaded_at, rows_written)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(checksum_sha256) DO UPDATE SET rows_written=excluded.rows_written
  `);
  const insertLineage = db.prepare(`
    INSERT INTO data_lineage(lineage_id, displayed_as, steps, raw_uri, checksum_sha256, method_version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let rowsWritten = 0;
  let skippedUnchanged = 0;
  let downloaded = 0;
  let fromCache = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;
  const names: string[] = [];

  for (const { resource, name } of resources) {
    names.push(name);
    const log = db.prepare(`INSERT INTO import_log(started_at, department, resource_title, status) VALUES (?, ?, ?, 'RUNNING')`)
      .run(new Date().toISOString(), department, name);
    try {
      const file = await loadCompressed(resource, mode);
      if (file.fromCache) fromCache += 1;
      else downloaded += 1;
      if (knownFile.get(file.checksumSha256) && process.env.FORCE_REPROCESS !== "1") {
        skippedUnchanged++;
        db.prepare(`UPDATE import_log SET finished_at=?, rows_read=0, rows_written=0, status='SKIPPED_CHECKSUM', message=? WHERE id=?`)
          .run(new Date().toISOString(), file.checksumSha256, log.lastInsertRowid);
        continue;
      }

      const lineageId = randomUUID();
      insertLineage.run(
        lineageId,
        "daily_observations",
        JSON.stringify([
          { step: "bulk_csv_gz", dataset: SOURCE_ID },
          { step: "resource", name },
          { step: "checksum_sha256", value: file.checksumSha256 }
        ]),
        file.url,
        file.checksumSha256,
        "ingest-mf-daily-v1",
        new Date().toISOString()
      );

      let written = 0;
      let read = 0;
      type Row = {
        stationId: string;
        name: string;
        lat: number | null;
        lon: number | null;
        alt: number | null;
        date: string;
        tmin: number | null;
        tmax: number | null;
        tmean: number | null;
        rr: number | null;
      };
      const batch: Row[] = [];
      const persistBatch = db.transaction((items: Row[]) => {
        for (const item of items) {
          stationUpsert.run(item.stationId, item.name, department, item.lat, item.lon, item.alt, SOURCE_ID);
          obsUpsert.run(
            item.stationId, item.date, item.tmin, item.tmax, item.tmean, item.rr,
            SOURCE_ID, item.tmin, item.tmax, item.tmean, item.rr, lineageId
          );
        }
      });

      const flush = () => {
        if (!batch.length) return;
        persistBatch(batch);
        batch.length = 0;
      };

      for await (const row of iterateCsvRows(file.compressed)) {
        read++;
        const date = parseDate(row.AAAAMMJJ);
        if (!date) continue;
        const year = Number(date.slice(0, 4));
        if (year < fromYear || year > toYear) continue;
        const stationId = String(row.NUM_POSTE || "").trim();
        if (!stationId) continue;
        const tmin = parseNumber(row.TN);
        const tmax = parseNumber(row.TX);
        const tmean = parseNumber(row.TM);
        const rr = parseNumber(row.RR);
        if (tmin == null && tmax == null && tmean == null && rr == null) continue;
        batch.push({
          stationId,
          name: String(row.NOM_USUEL || stationId).trim(),
          lat: parseNumber(row.LAT),
          lon: parseNumber(row.LON),
          alt: parseNumber(row.ALTI),
          date,
          tmin,
          tmax,
          tmean,
          rr
        });
        written++;
        if (!minDate || date < minDate) minDate = date;
        if (!maxDate || date > maxDate) maxDate = date;
        if (batch.length >= 1000) flush();
      }
      flush();

      rowsWritten += written;
      insertFile.run(file.checksumSha256, file.url, file.bytes, SOURCE_ID, new Date().toISOString(), written);
      db.prepare(`UPDATE import_log SET finished_at=?, rows_read=?, rows_written=?, status='DONE', message=? WHERE id=?`)
        .run(new Date().toISOString(), read, written, file.checksumSha256, log.lastInsertRowid);
    } catch (error) {
      db.prepare(`UPDATE import_log SET finished_at=?, status='ERROR', message=? WHERE id=?`)
        .run(new Date().toISOString(), error instanceof Error ? error.message : String(error), log.lastInsertRowid);
      throw error;
    }
  }

  if (minDate && maxDate) rebuildFranceDaily(minDate, maxDate);

  return { department, fromYear, toYear, resources: names, rowsWritten, skippedUnchanged, downloaded, fromCache, minDate, maxDate };
}
