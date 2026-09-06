-- Statistiques mensuelles et saisonnières V1 (PostgreSQL cible).
-- Runtime actuel : équivalent SQLite dans src/lib/db.ts.
-- Saisons météorologiques hémisphère nord (France V1) :
--   DJF = déc. (année-1) + janv. + févr.  (hiver étiqueté par l’année de janvier)
--   MAM = mars–mai
--   JJA = juin–août
--   SON = sept.–nov.
-- Une saison / un mois incomplet n’est pas une climatologie. Pluie : NULL si incomplet, jamais 0 de substitution.

CREATE TABLE IF NOT EXISTS monthly_statistics (
  station_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
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
  month_complete BOOLEAN NOT NULL,
  precip_complete BOOLEAN NOT NULL,
  source_id TEXT,
  method_version TEXT NOT NULL,
  PRIMARY KEY (station_id, year, month)
);

CREATE INDEX IF NOT EXISTS monthly_statistics_station_idx ON monthly_statistics (station_id, year, month);

CREATE TABLE IF NOT EXISTS seasonal_statistics (
  station_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  season TEXT NOT NULL,
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
  season_complete BOOLEAN NOT NULL,
  precip_complete BOOLEAN NOT NULL,
  source_id TEXT,
  method_version TEXT NOT NULL,
  PRIMARY KEY (station_id, year, season)
);

CREATE INDEX IF NOT EXISTS seasonal_statistics_station_idx ON seasonal_statistics (station_id, season, year);
