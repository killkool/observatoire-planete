-- Observatoire Planète — schéma cible PostgreSQL/PostGIS
-- Phase 1. Le prototype SQLite ne doit pas diverger conceptuellement.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE data_sources (
  source_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  dataset TEXT NOT NULL,
  product_id TEXT,
  version TEXT,
  origin_type TEXT NOT NULL,
  source_dependency_group TEXT,
  coverage_start DATE,
  coverage_end DATE,
  spatial_resolution TEXT,
  temporal_resolution TEXT,
  update_frequency TEXT,
  last_checked TIMESTAMPTZ,
  last_successful_import TIMESTAMPTZ,
  next_expected_update TIMESTAMPTZ,
  source_version TEXT,
  access_mode TEXT,
  legal_status TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE data_source_licenses (
  id BIGSERIAL PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  license_name TEXT NOT NULL,
  license_version TEXT,
  commercial_use_allowed BOOLEAN,
  redistribution_allowed BOOLEAN,
  derivative_work_allowed BOOLEAN,
  attribution_required BOOLEAN,
  share_alike BOOLEAN,
  storage_allowed BOOLEAN,
  cache_allowed BOOLEAN,
  api_resale_allowed BOOLEAN,
  logo_usage_allowed BOOLEAN,
  terms_url TEXT,
  license_url TEXT,
  reviewed_at DATE,
  reviewed_by TEXT,
  legal_status TEXT NOT NULL,
  attribution_text TEXT,
  notes TEXT
);

CREATE TABLE variables (
  variable_id TEXT PRIMARY KEY,
  canonical_unit TEXT NOT NULL,
  display_unit_default TEXT,
  display_precision INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  standard_name TEXT,
  allowed_min DOUBLE PRECISION,
  allowed_max DOUBLE PRECISION,
  notes TEXT
);

CREATE TABLE places (
  place_id TEXT PRIMARY KEY,
  place_kind TEXT NOT NULL,
  country_code CHAR(2),
  admin_level INTEGER,
  insee_code TEXT,
  provider_ids JSONB,
  name TEXT NOT NULL,
  name_variants JSONB,
  timezone TEXT,
  centroid GEOGRAPHY(Point, 4326),
  geom GEOGRAPHY(Geometry, 4326),
  altitude_m DOUBLE PRECISION,
  surface_type TEXT,
  water_body_type TEXT
);

CREATE TABLE physical_station_entities (
  physical_station_id UUID PRIMARY KEY,
  preferred_name TEXT,
  geom GEOGRAPHY(Point, 4326),
  altitude_m DOUBLE PRECISION,
  notes TEXT
);

CREATE TABLE weather_stations (
  id UUID PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_station_id TEXT NOT NULL,
  name TEXT NOT NULL,
  country_code CHAR(2),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude_m DOUBLE PRECISION,
  timezone TEXT,
  station_type TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN,
  metadata JSONB,
  source_id TEXT REFERENCES data_sources(source_id),
  UNIQUE (provider_id, provider_station_id)
);

CREATE TABLE provider_station_links (
  physical_station_id UUID REFERENCES physical_station_entities(physical_station_id),
  station_id UUID REFERENCES weather_stations(id),
  match_score DOUBLE PRECISION,
  match_method TEXT,
  PRIMARY KEY (physical_station_id, station_id)
);

CREATE TABLE station_aliases (
  station_id UUID REFERENCES weather_stations(id),
  alias TEXT NOT NULL
);

CREATE TABLE station_history (
  station_id UUID REFERENCES weather_stations(id),
  valid_from DATE,
  valid_to DATE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  altitude_m DOUBLE PRECISION,
  name TEXT
);

CREATE TABLE station_variables (
  station_id UUID REFERENCES weather_stations(id),
  variable_id TEXT REFERENCES variables(variable_id),
  start_date DATE,
  end_date DATE,
  coverage_pct DOUBLE PRECISION
);

CREATE TABLE station_quality (
  station_id UUID REFERENCES weather_stations(id),
  as_of DATE,
  site_class TEXT,
  measure_class TEXT,
  source_type_code TEXT,
  notes TEXT
);

CREATE TABLE data_lineage (
  lineage_id UUID PRIMARY KEY,
  displayed_as TEXT,
  steps JSONB NOT NULL,
  raw_uri TEXT,
  checksum_sha256 TEXT,
  method_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE observations (
  observation_id UUID PRIMARY KEY,
  station_id UUID REFERENCES weather_stations(id),
  timestamp_utc TIMESTAMPTZ NOT NULL,
  local_date DATE,
  climatological_date DATE,
  variable_id TEXT NOT NULL REFERENCES variables(variable_id),
  value DOUBLE PRECISION,
  unit TEXT NOT NULL,
  original_value DOUBLE PRECISION,
  original_unit TEXT,
  quality_flag TEXT,
  origin_type TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  dataset_version TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validity TEXT,
  lineage_id UUID REFERENCES data_lineage(lineage_id),
  UNIQUE (station_id, timestamp_utc, variable_id, source_id)
);

CREATE INDEX observations_station_time_idx ON observations (station_id, timestamp_utc);
CREATE INDEX observations_variable_time_idx ON observations (variable_id, climatological_date);

CREATE TABLE grids (
  grid_id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES data_sources(source_id),
  resolution TEXT,
  projection TEXT,
  lon_convention TEXT,
  lat_convention TEXT,
  time_resolution TEXT,
  vertical_levels JSONB,
  dataset_version TEXT
);

CREATE TABLE point_extractions (
  id UUID PRIMARY KEY,
  grid_id TEXT REFERENCES grids(grid_id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude_user_m DOUBLE PRECISION,
  altitude_model_m DOUBLE PRECISION,
  altitude_delta_m DOUBLE PRECISION,
  method TEXT NOT NULL,
  timestamp_utc TIMESTAMPTZ NOT NULL,
  variable_id TEXT NOT NULL,
  value DOUBLE PRECISION,
  unit TEXT NOT NULL,
  origin_type TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  dataset_version TEXT,
  lineage_id UUID REFERENCES data_lineage(lineage_id)
);

CREATE TABLE climatological_normals (
  id UUID PRIMARY KEY,
  place_id TEXT REFERENCES places(place_id),
  station_id UUID REFERENCES weather_stations(id),
  grid_id TEXT REFERENCES grids(grid_id),
  variable_id TEXT NOT NULL REFERENCES variables(variable_id),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  month INTEGER,
  day_of_year INTEGER,
  statistic TEXT NOT NULL,
  value DOUBLE PRECISION,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  method_version TEXT,
  origin_type TEXT NOT NULL DEFAULT 'CLIMATOLOGY'
);

CREATE TABLE records (
  id UUID PRIMARY KEY,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  variable_id TEXT NOT NULL REFERENCES variables(variable_id),
  period_kind TEXT NOT NULL,
  period_key TEXT,
  extremum TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  occurred_on DATE NOT NULL,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  origin_type TEXT NOT NULL,
  lineage_id UUID REFERENCES data_lineage(lineage_id)
);

CREATE TABLE data_coverage (
  source_id TEXT REFERENCES data_sources(source_id),
  variable_id TEXT REFERENCES variables(variable_id),
  place_id TEXT NOT NULL,
  first_date DATE,
  last_date DATE,
  coverage_pct DOUBLE PRECISION,
  resolution TEXT,
  PRIMARY KEY (source_id, variable_id, place_id)
);

CREATE TABLE raw_quarantine (
  id BIGSERIAL PRIMARY KEY,
  uri TEXT NOT NULL,
  reason TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_meta JSONB
);

CREATE TABLE dataset_versions (
  source_id TEXT REFERENCES data_sources(source_id),
  version TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ,
  supersedes TEXT,
  changelog TEXT,
  PRIMARY KEY (source_id, version)
);

CREATE TABLE source_rankings (
  id BIGSERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  variable_id TEXT NOT NULL REFERENCES variables(variable_id),
  period_kind TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES data_sources(source_id),
  rank INTEGER NOT NULL,
  notes TEXT,
  UNIQUE (country_code, variable_id, period_kind, source_id)
);
