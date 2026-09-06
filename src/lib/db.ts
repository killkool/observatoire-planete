import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SOURCE_CATALOG } from "../../packages/licensing/src/gate";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.METEO_DB_PATH || path.join(dataDir, "meteo.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("temp_store = MEMORY");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    latitude REAL,
    longitude REAL,
    altitude REAL,
    source TEXT NOT NULL DEFAULT 'METEO_FRANCE',
    source_id TEXT NOT NULL DEFAULT 'meteo-france.climatologie.quotidienne.bulk'
  );

  CREATE TABLE IF NOT EXISTS observations (
    station_id TEXT NOT NULL,
    date TEXT NOT NULL,
    tmin REAL,
    tmax REAL,
    tmean REAL,
    precipitation REAL,
    origin_type TEXT NOT NULL DEFAULT 'OBSERVED',
    source_id TEXT NOT NULL DEFAULT 'meteo-france.climatologie.quotidienne.bulk',
    original_tmin REAL,
    original_tmax REAL,
    original_tmean REAL,
    original_precipitation REAL,
    original_unit_temp TEXT DEFAULT 'degC',
    original_unit_precip TEXT DEFAULT 'mm_as_published',
    lineage_id TEXT,
    source TEXT NOT NULL DEFAULT 'METEO_FRANCE',
    PRIMARY KEY (station_id, date),
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(date);
  CREATE INDEX IF NOT EXISTS idx_observations_station_date ON observations(station_id, date);

  CREATE TABLE IF NOT EXISTS france_daily (
    date TEXT PRIMARY KEY,
    tmin REAL,
    tmax REAL,
    tmean REAL,
    station_count INTEGER NOT NULL,
    source TEXT NOT NULL DEFAULT 'RESEAU_METEO_FRANCE'
  );

  CREATE TABLE IF NOT EXISTS import_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    department TEXT,
    resource_title TEXT,
    rows_read INTEGER NOT NULL DEFAULT 0,
    rows_written INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    message TEXT
  );

  CREATE TABLE IF NOT EXISTS data_sources (
    source_id TEXT PRIMARY KEY,
    legal_status TEXT NOT NULL,
    enabled INTEGER NOT NULL,
    origin_type TEXT NOT NULL,
    attribution TEXT,
    license_name TEXT
  );

  CREATE TABLE IF NOT EXISTS data_lineage (
    lineage_id TEXT PRIMARY KEY,
    displayed_as TEXT,
    steps TEXT NOT NULL,
    raw_uri TEXT,
    checksum_sha256 TEXT,
    method_version TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS import_files (
    checksum_sha256 TEXT PRIMARY KEY,
    uri TEXT NOT NULL,
    bytes INTEGER,
    source_id TEXT NOT NULL,
    downloaded_at TEXT NOT NULL,
    rows_written INTEGER
  );

  CREATE TABLE IF NOT EXISTS places (
    place_id TEXT PRIMARY KEY,
    place_kind TEXT NOT NULL,
    country_code TEXT,
    insee_code TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude_m REAL,
    timezone TEXT,
    surface_type TEXT,
    region_slug TEXT,
    department_slug TEXT
  );

  CREATE TABLE IF NOT EXISTS point_extractions (
    id TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    method TEXT NOT NULL,
    date TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    value REAL,
    unit TEXT NOT NULL,
    origin_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    dataset_version TEXT,
    lineage_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_point_extractions_lookup
    ON point_extractions(latitude, longitude, date, variable_id, source_id);
`);

function addColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

addColumn("observations", "precipitation", "precipitation REAL");
addColumn("observations", "origin_type", "origin_type TEXT DEFAULT 'OBSERVED'");
addColumn("observations", "source_id", "source_id TEXT DEFAULT 'meteo-france.climatologie.quotidienne.bulk'");
addColumn("observations", "original_tmin", "original_tmin REAL");
addColumn("observations", "original_tmax", "original_tmax REAL");
addColumn("observations", "original_tmean", "original_tmean REAL");
addColumn("observations", "original_precipitation", "original_precipitation REAL");
addColumn("observations", "lineage_id", "lineage_id TEXT");
addColumn("stations", "source_id", "source_id TEXT DEFAULT 'meteo-france.climatologie.quotidienne.bulk'");

const upsertSource = db.prepare(`
  INSERT INTO data_sources(source_id, legal_status, enabled, origin_type, attribution, license_name)
  VALUES (@sourceId, @legalStatus, @enabled, @originType, @attribution, @licenseName)
  ON CONFLICT(source_id) DO UPDATE SET
    legal_status=excluded.legal_status,
    enabled=excluded.enabled,
    origin_type=excluded.origin_type,
    attribution=excluded.attribution,
    license_name=excluded.license_name
`);

for (const source of SOURCE_CATALOG) {
  upsertSource.run({
    sourceId: source.sourceId,
    legalStatus: source.legalStatus,
    enabled: source.enabled ? 1 : 0,
    originType: source.originType,
    attribution: source.attribution,
    licenseName: source.licenseName
  });
}

const places = [
  {
    place_id: "fr-com-38185",
    place_kind: "city",
    country_code: "FR",
    insee_code: "38185",
    name: "Grenoble",
    slug: "grenoble",
    latitude: 45.1885,
    longitude: 5.7245,
    altitude_m: 212,
    timezone: "Europe/Paris",
    surface_type: "LAND",
    region_slug: "auvergne-rhone-alpes",
    department_slug: "isere"
  },
  {
    place_id: "fr-com-38140",
    place_kind: "city",
    country_code: "FR",
    insee_code: "38140",
    name: "Crolles",
    slug: "crolles",
    latitude: 45.2858,
    longitude: 5.8836,
    altitude_m: 245,
    timezone: "Europe/Paris",
    surface_type: "LAND",
    region_slug: "auvergne-rhone-alpes",
    department_slug: "isere"
  },
  {
    place_id: "fr-com-38303",
    place_kind: "city",
    country_code: "FR",
    insee_code: "38303",
    name: "La Pierre",
    slug: "la-pierre",
    latitude: 45.294,
    longitude: 5.948,
    altitude_m: 260,
    timezone: "Europe/Paris",
    surface_type: "LAND",
    region_slug: "auvergne-rhone-alpes",
    department_slug: "isere"
  }
];

const upsertPlace = db.prepare(`
  INSERT INTO places(place_id, place_kind, country_code, insee_code, name, slug, latitude, longitude, altitude_m, timezone, surface_type, region_slug, department_slug)
  VALUES (@place_id, @place_kind, @country_code, @insee_code, @name, @slug, @latitude, @longitude, @altitude_m, @timezone, @surface_type, @region_slug, @department_slug)
  ON CONFLICT(place_id) DO UPDATE SET
    name=excluded.name, latitude=excluded.latitude, longitude=excluded.longitude, altitude_m=excluded.altitude_m
`);

for (const place of places) upsertPlace.run(place);

export default db;
