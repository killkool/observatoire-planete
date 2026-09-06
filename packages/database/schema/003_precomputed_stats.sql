-- Statistiques précalculées V1 (PostgreSQL cible).
-- Runtime actuel : équivalent SQLite dans src/lib/db.ts.
-- Une ligne = une station × une année / un jour de l’année.
-- Ne jamais dupliquer les observations par commune.

CREATE TABLE IF NOT EXISTS annual_statistics (
  station_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  tmin_mean DOUBLE PRECISION,
  tmax_mean DOUBLE PRECISION,
  tmean_mean DOUBLE PRECISION,
  precipitation_sum DOUBLE PRECISION,
  precip_days_known INTEGER NOT NULL,
  days_tmin_known INTEGER NOT NULL,
  days_tmax_known INTEGER NOT NULL,
  days_ge_25 INTEGER NOT NULL,
  days_ge_30 INTEGER NOT NULL,
  days_ge_35 INTEGER NOT NULL,
  days_ge_40 INTEGER NOT NULL,
  days_frost INTEGER NOT NULL,
  tropical_nights INTEGER NOT NULL,
  days_rain INTEGER NOT NULL,
  year_complete BOOLEAN NOT NULL,
  precip_complete BOOLEAN NOT NULL,
  source_id TEXT,
  method_version TEXT NOT NULL,
  PRIMARY KEY (station_id, year)
);

CREATE INDEX IF NOT EXISTS annual_statistics_station_idx ON annual_statistics (station_id, year);

CREATE TABLE IF NOT EXISTS day_of_year_statistics (
  station_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  tmin_mean DOUBLE PRECISION,
  tmax_mean DOUBLE PRECISION,
  tmin_min DOUBLE PRECISION,
  tmin_max DOUBLE PRECISION,
  tmax_min DOUBLE PRECISION,
  tmax_max DOUBLE PRECISION,
  years_tmin INTEGER NOT NULL,
  years_tmax INTEGER NOT NULL,
  source_id TEXT,
  method_version TEXT NOT NULL,
  PRIMARY KEY (station_id, month, day)
);
