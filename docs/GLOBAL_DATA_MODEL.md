# Modèle de données global

Stockage canonique **UTC**. Affichage : fuseau du lieu. Un jour climatologique source n’est pas reconstruit sans méthodologie.

NULL = absence. 0 = zéro mesuré.

## 1. Enums

```text
DataOriginType:
  OBSERVED | REANALYSIS | SATELLITE | FORECAST | DERIVED
  | HOMOGENIZED | INTERPOLATED | BLENDED | MODEL | CLIMATOLOGY

LegalStatus:
  APPROVED_COMMERCIAL | APPROVED_NON_COMMERCIAL
  | REQUIRES_REVIEW | RESTRICTED | DISABLED

SurfaceType:
  LAND | OCEAN | COAST | LAKE | INLAND_WATER | UNKNOWN

WaterBodyType:
  OCEAN | SEA | GULF | STRAIT | LARGE_LAKE | RESERVOIR | RIVER | OTHER

StationType:
  SYNOPTIC | AUTOMATIC | MANUAL | BUOY | SHIP | VIRTUAL | UNKNOWN
```

## 2. Licences et sources

```sql
CREATE TABLE data_sources (
  source_id            TEXT PRIMARY KEY,
  provider             TEXT NOT NULL,
  dataset              TEXT NOT NULL,
  product_id           TEXT,
  version              TEXT,
  origin_type          TEXT NOT NULL,
  source_dependency_group TEXT,
  coverage_start       DATE,
  coverage_end         DATE,
  spatial_resolution   TEXT,
  temporal_resolution  TEXT,
  update_frequency     TEXT,
  last_checked         TIMESTAMPTZ,
  last_successful_import TIMESTAMPTZ,
  next_expected_update TIMESTAMPTZ,
  source_version       TEXT,
  access_mode          TEXT, -- bulk | api | cloud_mirror
  legal_status         TEXT NOT NULL,
  enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  notes                TEXT
);

CREATE TABLE data_source_licenses (
  id                       BIGSERIAL PRIMARY KEY,
  source_id                TEXT NOT NULL REFERENCES data_sources(source_id),
  license_name             TEXT NOT NULL,
  license_version          TEXT,
  commercial_use_allowed   BOOLEAN,
  redistribution_allowed   BOOLEAN,
  derivative_work_allowed  BOOLEAN,
  attribution_required     BOOLEAN,
  share_alike              BOOLEAN,
  storage_allowed          BOOLEAN,
  cache_allowed            BOOLEAN,
  api_resale_allowed       BOOLEAN,
  logo_usage_allowed       BOOLEAN,
  terms_url                TEXT,
  license_url              TEXT,
  reviewed_at              DATE,
  reviewed_by              TEXT,
  legal_status             TEXT NOT NULL,
  notes                    TEXT
);
```

Un pipeline refuse d’écrire si `enabled` est faux ou `legal_status` ∉ {APPROVED_COMMERCIAL} en contexte commercial.

## 3. Variables et unités

```sql
CREATE TABLE variables (
  variable_id        TEXT PRIMARY KEY, -- air_temperature_max
  canonical_unit     TEXT NOT NULL,    -- K, m, m s-1, Pa, 1
  display_unit_default TEXT,           -- degC, mm, km/h, hPa
  display_precision  INTEGER NOT NULL, -- digits after conversion
  description        TEXT,
  standard_name      TEXT,             -- CF si pertinent
  allowed_min        DOUBLE PRECISION,
  allowed_max        DOUBLE PRECISION,
  notes              TEXT
);
```

Registre initial (non exhaustif) :

| `variable_id` | unité canonique | précision d’affichage défaut |
|---|---|---|
| air_temperature | K | 0.1 °C |
| air_temperature_min | K | 0.1 °C |
| air_temperature_max | K | 0.1 °C |
| dew_point | K | 0.1 °C |
| relative_humidity | 1 | 1 % |
| precipitation | m | 0.1 mm |
| wind_speed | m s-1 | 0.1 (unité UI) |
| wind_direction | degree | 0 (entier, from) |
| wind_gust | m s-1 | 0.1 |
| pressure | Pa | 0 hPa |
| sea_level_pressure | Pa | 0 hPa |
| snow_depth | m | 1 cm |
| solar_radiation | J m-2 | selon produit |
| cloud_cover | 1 | 1 % |
| sea_surface_temperature | K | 0.1 °C |
| water_temperature | K | 0.1 °C |
| salinity | 1e-3 | 0.01 PSU |
| current_velocity_u | m s-1 | 0.01 |
| current_velocity_v | m s-1 | 0.01 |
| wave_height | m | 0.1 |
| wave_direction | degree | 0 (towards unless source says otherwise) |
| wave_period | s | 0.1 |
| sea_level | m | 0.01 |

**Unit engine :** conserver `original_value` + `original_unit`. Ne pas afficher 24.437 °C pour ERA5.

Vent : `speed = sqrt(u²+v²)` ; direction météorologique **d’où vient** le vent.  
Courant : direction **où va** l’eau. Tests d’orientation obligatoires.

## 4. Lieux

```sql
CREATE TABLE places (
  place_id       TEXT PRIMARY KEY, -- interne, pas un nom
  place_kind     TEXT NOT NULL,    -- country, region, department, city, ocean, poi, coord
  country_code   CHAR(2),          -- ISO 3166-1 alpha-2
  admin_level    INTEGER,
  insee_code     TEXT,             -- France
  provider_ids   JSONB,
  name           TEXT NOT NULL,
  name_variants  JSONB,
  timezone       TEXT,
  centroid       GEOGRAPHY(Point, 4326),
  geom           GEOGRAPHY(Geometry, 4326),
  altitude_m     DOUBLE PRECISION,
  surface_type   TEXT,
  water_body_type TEXT
);
```

France : identité administrative = **INSEE**. Monde : id interne + ISO + géométrie. Jamais le nom seul.

## 5. Stations

```sql
CREATE TABLE physical_station_entities (
  physical_station_id UUID PRIMARY KEY,
  preferred_name      TEXT,
  geom                GEOGRAPHY(Point, 4326),
  altitude_m          DOUBLE PRECISION,
  notes               TEXT
);

CREATE TABLE weather_stations (
  id                   UUID PRIMARY KEY,
  provider_id          TEXT NOT NULL,
  provider_station_id  TEXT NOT NULL,
  name                 TEXT NOT NULL,
  country_code         CHAR(2),
  latitude             DOUBLE PRECISION NOT NULL,
  longitude            DOUBLE PRECISION NOT NULL,
  altitude_m           DOUBLE PRECISION,
  timezone             TEXT,
  station_type         TEXT,
  start_date           DATE,
  end_date             DATE,
  is_active            BOOLEAN,
  metadata             JSONB,
  source_id            TEXT REFERENCES data_sources(source_id),
  UNIQUE (provider_id, provider_station_id)
);

CREATE TABLE provider_station_links (
  physical_station_id UUID REFERENCES physical_station_entities(physical_station_id),
  station_id          UUID REFERENCES weather_stations(id),
  match_score         DOUBLE PRECISION,
  match_method        TEXT,
  PRIMARY KEY (physical_station_id, station_id)
);

CREATE TABLE station_aliases (
  station_id UUID REFERENCES weather_stations(id),
  alias      TEXT NOT NULL
);

CREATE TABLE station_history (
  station_id UUID REFERENCES weather_stations(id),
  valid_from DATE,
  valid_to   DATE,
  latitude   DOUBLE PRECISION,
  longitude  DOUBLE PRECISION,
  altitude_m DOUBLE PRECISION,
  name       TEXT
);

CREATE TABLE station_variables (
  station_id   UUID REFERENCES weather_stations(id),
  variable_id  TEXT REFERENCES variables(variable_id),
  start_date   DATE,
  end_date     DATE,
  coverage_pct DOUBLE PRECISION
);

CREATE TABLE station_quality (
  station_id UUID REFERENCES weather_stations(id),
  as_of      DATE,
  site_class TEXT,
  measure_class TEXT,
  source_type_code TEXT, -- MF TYPE_POSTE_ACTUEL
  notes      TEXT
);
```

Matching station (pondération **initiale, à calibrer**) : distance 30 %, altitude 20 %, couverture 20 %, qualité 20 %, continuité 10 %. Distance géodésique. Le choix de source ≠ nearest only.

## 6. Observations canoniques

```sql
CREATE TABLE observations (
  observation_id   UUID PRIMARY KEY,
  station_id       UUID REFERENCES weather_stations(id),
  timestamp_utc    TIMESTAMPTZ NOT NULL,
  local_date       DATE,              -- jour civil lieu, si pertinent
  climatological_date DATE,           -- jour source si distinct
  variable_id      TEXT NOT NULL REFERENCES variables(variable_id),
  value            DOUBLE PRECISION,  -- unité canonique ; NULL = manquant
  unit             TEXT NOT NULL,
  original_value   DOUBLE PRECISION,
  original_unit    TEXT,
  quality_flag     TEXT,
  origin_type      TEXT NOT NULL,
  source_id        TEXT NOT NULL REFERENCES data_sources(source_id),
  dataset_version  TEXT,
  ingested_at      TIMESTAMPTZ NOT NULL,
  validity         TEXT,              -- valid | suspect | quarantined
  lineage_id       UUID,
  UNIQUE (station_id, timestamp_utc, variable_id, source_id)
);
```

## 7. Grilles et extraction

```sql
CREATE TABLE grids (
  grid_id             TEXT PRIMARY KEY,
  source_id           TEXT REFERENCES data_sources(source_id),
  resolution          TEXT,
  projection          TEXT,
  lon_convention      TEXT, -- 0-360 | -180-180
  lat_convention      TEXT,
  time_resolution     TEXT,
  vertical_levels     JSONB,
  dataset_version     TEXT
);

CREATE TABLE point_extractions (
  id              UUID PRIMARY KEY,
  grid_id         TEXT REFERENCES grids(grid_id),
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  altitude_user_m DOUBLE PRECISION,
  altitude_model_m DOUBLE PRECISION,
  altitude_delta_m DOUBLE PRECISION,
  method          TEXT NOT NULL, -- nearest | bilinear | area_average
  timestamp_utc   TIMESTAMPTZ NOT NULL,
  variable_id     TEXT NOT NULL,
  value           DOUBLE PRECISION,
  unit            TEXT NOT NULL,
  origin_type     TEXT NOT NULL,
  source_id       TEXT NOT NULL,
  dataset_version TEXT,
  lineage_id      UUID
);
```

Correction d’altitude : optionnelle, `DERIVED`, documentée, jamais vérité universelle.

Interpolation : `origin_type = INTERPOLATED` + method + sources + distance + uncertainty.

## 8. Lineage

```sql
CREATE TABLE data_lineage (
  lineage_id     UUID PRIMARY KEY,
  displayed_as   TEXT,
  steps          JSONB NOT NULL,
  -- ex: monthly_mean → daily_observations → station → raw CSV → checksum → ingested_at
  raw_uri        TEXT,
  checksum_sha256 TEXT,
  method_version TEXT,
  created_at     TIMESTAMPTZ NOT NULL
);
```

## 9. Climat, records, couverture

```sql
CREATE TABLE climatological_normals (
  id              UUID PRIMARY KEY,
  place_id        TEXT,
  station_id      UUID,
  grid_id         TEXT,
  variable_id     TEXT NOT NULL,
  period_start    INTEGER NOT NULL, -- 1991
  period_end      INTEGER NOT NULL, -- 2020
  month           INTEGER,          -- null = annuel
  day_of_year     INTEGER,
  statistic       TEXT NOT NULL,    -- mean, median, p10, ...
  value           DOUBLE PRECISION,
  source_id       TEXT NOT NULL,
  method_version  TEXT,
  origin_type     TEXT NOT NULL DEFAULT 'CLIMATOLOGY'
);

CREATE TABLE records (
  id              UUID PRIMARY KEY,
  scope_type      TEXT NOT NULL, -- station | city | region | country | grid_cell | ocean
  scope_id        TEXT NOT NULL,
  variable_id     TEXT NOT NULL,
  period_kind     TEXT NOT NULL, -- day | month | year | all
  period_key      TEXT,
  extremum        TEXT NOT NULL, -- min | max
  value           DOUBLE PRECISION NOT NULL,
  unit            TEXT NOT NULL,
  occurred_on     DATE NOT NULL,
  source_id       TEXT NOT NULL,
  origin_type     TEXT NOT NULL,
  lineage_id      UUID
);

CREATE TABLE data_coverage (
  source_id     TEXT,
  variable_id   TEXT,
  place_id      TEXT,
  first_date    DATE,
  last_date     DATE,
  coverage_pct  DOUBLE PRECISION,
  resolution    TEXT,
  PRIMARY KEY (source_id, variable_id, place_id)
);
```

Périodes de normales supportées : 1961-1990, 1971-2000, 1981-2010, 1991-2020, + futures officielles. Référence principale **configurable**. Une anomalie cite toujours sa normale.

Records observés et maxima de cellule ERA5 : classements **séparés**.

## 10. Saisons

| | DJF | MAM | JJA | SON |
|---|---|---|---|---|
| Northern meteorological | hiver | printemps | été | automne |
| Southern meteorological | été | automne | hiver | printemps |

Ne pas étiqueter « hiver » dans l’hémisphère sud pour DJF sans le dire.

## 11. Quarantaine et versions

```sql
CREATE TABLE raw_quarantine (
  id           BIGSERIAL PRIMARY KEY,
  uri          TEXT NOT NULL,
  reason       TEXT NOT NULL, -- corrupt | schema_changed | unexpected_values | licence_changed
  detected_at  TIMESTAMPTZ NOT NULL,
  payload_meta JSONB
);

CREATE TABLE dataset_versions (
  source_id      TEXT,
  version        TEXT,
  downloaded_at  TIMESTAMPTZ,
  supersedes     TEXT,
  changelog      TEXT,
  PRIMARY KEY (source_id, version)
);
```

## 12. Produit de réponse

Toute réponse avancée peut porter `data_version` + `method_version` pour reproductibilité ([DATA_LINEAGE.md](./DATA_LINEAGE.md)).
