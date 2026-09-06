-- Normales climatiques V1 (PostgreSQL cible).
-- Runtime actuel : équivalent SQLite dans src/lib/db.ts.
-- Dérivé des années climatiques déjà précalculées (pas un second passage sur le quotidien).
-- Période par défaut : 1991-2020. Normale affichable seulement si ≥ 24 années complètes
-- (80 % de 30 ans). Pluie : NULL si < 24 années à précipitation complète. Jamais 0 de substitution.
-- Anomalie = valeur annuelle − normale de LA MÊME station, même variable, même période.

CREATE TABLE IF NOT EXISTS station_normals (
  station_id TEXT NOT NULL,
  period TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  years_used INTEGER NOT NULL,
  years_precip INTEGER NOT NULL,
  tmin_mean DOUBLE PRECISION,
  tmax_mean DOUBLE PRECISION,
  tmean_mean DOUBLE PRECISION,
  precipitation_mean DOUBLE PRECISION,
  normal_complete BOOLEAN NOT NULL,
  precip_complete BOOLEAN NOT NULL,
  source_id TEXT,
  method_version TEXT NOT NULL,
  PRIMARY KEY (station_id, period)
);

CREATE INDEX IF NOT EXISTS station_normals_period_idx ON station_normals (period, normal_complete);
