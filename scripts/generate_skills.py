# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"

SKILL_DOCS = {
    "00-track-development": {
        "name": "00-track-development",
        "description": "Maintains Observatoire Planète progress docs in the same change as the code. Use on every prompt that implements, fixes, refactors, documents, or ships anything in this repo. Mandatory before ending a turn that touched code or product docs. Updates docs/STATUS.md, docs/ROADMAP.md, DATA_CHANGELOG.md. Never mark a phase done without proof (import, test, or page).",
        "title": "Mettre à jour le développement",
        "body": """
**Obligatoire à chaque prompt** qui change le dépôt. Pas à la fin de la semaine. Pas « si tu as le temps ».

Un fichier de code sans cases à jour = travail incomplet.

## Fichiers de vérité

| Fichier | Rôle |
|---|---|
| [docs/STATUS.md](../../docs/STATUS.md) | Avancement réel, preuves, prochaine action |
| [docs/ROADMAP.md](../../docs/ROADMAP.md) | Ordre des phases, cases `[x]` / `[ ]` |
| [DATA_CHANGELOG.md](../../DATA_CHANGELOG.md) | Ingestion, version de dataset, extraits UI de données |
| [docs/adr/](../../docs/adr/) | Décision structurante |

## Avant de coder

1. Lire `docs/STATUS.md` (prochaine action + limites).
2. Lire la phase visée dans `docs/ROADMAP.md`. Ne pas sauter de phase.
3. Déclarer ce qui sera réellement livré vs ce qui restera `[ ]`.

## Pendant / avant de terminer

Dans **le même lot** que le code :

1. Mettre à jour `docs/STATUS.md` : phrase d’état, file d’exécution, preuves, prochaine action.
2. Cocher ou décocher les cases de `docs/ROADMAP.md`. Date de mise à jour.
3. Si ingestion / checksum / nouvelle source / extrait IGN : une ligne dans `DATA_CHANGELOG.md`.
4. Si choix d’architecture : ADR. Ne pas inventer une décision dans le STATUS.

## Règle des cases

- `[x]` = livré **et** vérifié (preuve : import SQL, `npm run test:science`, page navigateur).
- `[ ]` = non fait, même si le fichier existe.
- Partiel = case non cochée + phrase **État :** dans la phase.
- Ne jamais cocher ERA5, NOAA, CMEMS, E-OBS, ou une API commerciale sans donnée réelle.
- Ne jamais présenter une illustration comme une observation.

## Interdit

- Annoncer une phase « terminée » parce que le pipeline est prêt mais `COUNT(*) = 0`.
- Inventer un chiffre d’avancement, un quota, une licence, une date de preuve.
- Oublier le suivi « pour aller plus vite ».
""",
    },
    "01-source-registry": {
        "name": "01-source-registry",
        "description": "Catalogue providers, datasets, versions, licences, and commercial legal_status. Use when adding a source, enabling a connector, auditing licenses, or changing data_sources.yaml.",
        "title": "Source registry",
        "body": """
## Rules

- No pipeline without a `data_sources` row.
- Commercial production requires `legal_status: APPROVED_COMMERCIAL` and `enabled: true`.
- `REQUIRES_REVIEW`, `RESTRICTED`, `DISABLED` never serve users in commercial mode.
- FREE ACCESS ≠ COMMERCIAL REUSE. Do not invent a licence.
- Each NOAA/CMEMS/ECMWF product is its own `source_id`.
- E-OBS stays `DISABLED`.

## Workflow

1. Read [docs/DATA_LICENSES.md](../../docs/DATA_LICENSES.md) and [docs/DATA_SOURCES.md](../../docs/DATA_SOURCES.md).
2. Fetch the official licence URL (do not rely on memory).
3. Fill `packages/licensing/registry/data-sources.yaml`.
4. Record `reviewed_at`, `reviewed_by`, attribution text, logo rights (default: no logo).
5. Add ranking only as **configurable** country×variable×period entries.

## Outputs

Registry YAML + licence notes. Block the connector if the text is ambiguous.
""",
    },
    "02-meteo-france": {
        "name": "02-meteo-france",
        "description": "Météo-France Open Data bulk climatology: stations, daily/hourly/6-min files, quality classes, data.gouv resources. Use when ingesting French station data or matching NUM_POSTE.",
        "title": "Météo-France",
        "body": """
## Access

Prefer **bulk** on meteo.data.gouv.fr / data.gouv.fr. Do not design millions of API calls.

- Daily dataset id: `6569b51ae64326786e4e8e1a`
- Hourly dataset id: `6569b4473bedf2e7abad3b72`
- Confluence: Open Data Météo-France climatologie
- Licence: Licence Ouverte 2.0 — credit `Source : Météo-France`

## Ingest

- CSV.GZ by department and period; delimiter `;`
- Idempotent upsert; checksum; never overwrite `raw/`
- Keep original columns; map to canonical variables
- Times: UTC in metropolitan France (dataset notice); overseas FU — do not naive-convert climatological days
- `TYPE_POSTE_ACTUEL` 0–5 → `station_quality`
- LSH = `HOMOGENIZED`; SIM = `MODEL`; daily station = `OBSERVED`

## MVP

Department 38. Validation places: Grenoble, Crolles, La Pierre.

Official parameter PDF must be stored in raw docs — do not invent column lists.
""",
    },
    "03-noaa-ghcn": {
        "name": "03-noaa-ghcn",
        "description": "NOAA GHCN Daily stations, elements, flags, and formats. Use when importing GHCN or linking French stations to GHCN IDs.",
        "title": "NOAA GHCN Daily",
        "body": """
## Role

Global historical daily stations (Tmin, Tmax, precip, snow where present).

## Licence

NODD/AWS: CC0-1.0. Still credit NOAA; never imply endorsement.

## Rules

- Keep QC flags; never silently drop outliers
- `source_dependency_group = international_station_aggregation`
- Link to `physical_station_entities` before treating as independent from Météo-France
- Phase 8: France/Alps subset first, not the whole planet
""",
    },
    "04-noaa-isd": {
        "name": "04-noaa-isd",
        "description": "NOAA ISD / GHCNh hourly synoptic observations and station metadata. Use when ingesting hourly international station data.",
        "title": "NOAA ISD / GHCNh",
        "body": """
## Rules

- ISD and GHCNh are **distinct** catalog entries
- Confirm the actual download channel licence before enabling
- Hourly elements vary by station; missing = NULL
- Same physical station may exist in MF/GHCN — dedupe
- Not in the Isère vertical slice
""",
    },
    "05-era5": {
        "name": "05-era5",
        "description": "ERA5 and ERA5-Land reanalysis: variables, units, GRIB/NetCDF/Zarr, ERA5T vs final. Use when extracting points, aggregating daily reanalysis, or comparing to stations.",
        "title": "ERA5 / ERA5-Land",
        "body": """
## Honesty

UI label: **Réanalyse ERA5**. Never “observation” or “station”.

- ERA5: global, 1940–, ~0.25°, hourly, DOI 10.24381/cds.adbb2d47
- ERA5-Land: land, 1950–, 0.1°, does not replace a station
- ERA5T (~5 day latency) may differ from final (2–3 months)

## Storage

Never dump global hourly grids into SQL. Use point timeseries, regional daily cache, or on-demand Zarr/GRIB.

## Extraction

Document method (`nearest` default unless an ADR says otherwise). Store model altitude vs user altitude. Optional lapse-rate correction = `DERIVED`.

## Priority variables

2m T, 2m dewpoint, TP, 10u, 10v, SP, MSL, snow, SSRD.

Assimilated observations → not an independent confirmation of a nearby station.
""",
    },
    "06-copernicus-marine": {
        "name": "06-copernicus-marine",
        "description": "Copernicus Marine products: SST, depth, currents, salinity, waves, sea level, DOI attribution. Use when adding ocean layers or Mediterranean MVP.",
        "title": "Copernicus Marine",
        "body": """
## Licence

Commercial OK with visible credit + product DOI. One `source_id` per catalogue product. Third-party datasets on CMEMS stay `REQUIRES_REVIEW`.

Attribution for derivatives: `Generated using E.U. Copernicus Marine Service Information; [DOI]`.

## Science

- Depths = native levels or explicit `INTERPOLATED`
- Currents: direction **water goes to** (not meteorological wind)
- Not an official marine-safety system
- MVP: Western Mediterranean only after product IDs are written down (do not invent IDs)
""",
    },
    "07-ecmwf-open-data": {
        "name": "07-ecmwf-open-data",
        "description": "ECMWF Open Data IFS/AIFS GRIB forecasts, runs, lead times, CC-BY plus Terms of Use. Use when adding forecast layers or archiving forecast runs.",
        "title": "ECMWF Open Data",
        "body": """
## Allowed now

Public **subset** IFS/AIFS, ~0.25°, GRIB2, CC-BY-4.0 + ECMWF ToU, commercial with attribution.

Rolling archive ~12 runs. Higher-res / full catalogue **delivery** may need a service agreement → `REQUIRES_REVIEW`.

## UI

`origin_type = FORECAST`. Separate past / present / future. Do not backfill history with forecasts.

If we promise forecast history, we must persist runs ourselves.
""",
    },
    "08-climate-statistics": {
        "name": "08-climate-statistics",
        "description": "Climate normals, anomalies, records, percentiles, trends, homogenization. Use when computing climatology, day-of-year stats, or warming narratives.",
        "title": "Climate statistics",
        "body": """
## Rules

- Normals: 1961-1990 … 1991-2020 (default configurable). Anomaly always names the period.
- Do not mix station records and ERA5 cell maxima in one ranking
- LSH is homogenized, not raw
- Trends need method text; not a certified climate study
- Hemispheres: southern DJF is summer
- Prototype “France mean” is an imported-network index, not MF national indicator

See [docs/CLIMATE_METHODOLOGY.md](../../docs/CLIMATE_METHODOLOGY.md).
""",
    },
    "09-ocean-statistics": {
        "name": "09-ocean-statistics",
        "description": "Ocean SST, depth profiles, anomalies, currents, waves, salinity statistics. Use when building ocean panels or time-machine marine views.",
        "title": "Ocean statistics",
        "body": """
See [docs/OCEAN_METHODOLOGY.md](../../docs/OCEAN_METHODOLOGY.md).

SST analysis ≠ in-situ. Profile uses real levels. Anomaly palettes are diverging and distinct from absolute SST. Large lakes are not oceans.
""",
    },
    "10-source-fusion": {
        "name": "10-source-fusion",
        "description": "Source ranking, cross-validation, dependency groups, best-source selection. Use when comparing Météo-France, NOAA, and ERA5 or choosing a preferred value.",
        "title": "Source fusion",
        "body": """
## Forbidden

`mean(MF, NOAA, ERA5)` as truth. Three sources ≠ three independent confirmations.

## Required

- Configurable ranking (country × variable × period)
- Report gaps, bias, MAE, RMSE, correlation, coverage — with definitions
- `source_dependency_group` for independence
- Preferred value + alternatives, never a silent blend
- Do not auto-apply ERA5–station bias to history without a methodology ADR
""",
    },
    "11-confidence-engine": {
        "name": "11-confidence-engine",
        "description": "Documented confidence scoring from origin type, QC, distance, altitude, coverage, and independence. Use when showing a confidence index or changing weights.",
        "title": "Confidence engine",
        "body": """
Follow [docs/CONFIDENCE_MODEL.md](../../docs/CONFIDENCE_MODEL.md).

Show the breakdown, not a naked 96/100. Interpolated values cap lower. Missing data: no invented score. Calibrate on plain / mountain / coast / city before treating weights as final.
""",
    },
    "12-gis-world": {
        "name": "12-gis-world",
        "description": "PostGIS places, countries, regions, cities, coordinates, timezones, altitude, land/ocean mask. Use when adding search, click-anywhere, or French INSEE geography.",
        "title": "GIS world",
        "body": """
- France identity: INSEE + IGN ADMIN EXPRESS (LO 2.0)
- World: internal IDs, never name-only
- Click anywhere: LAND / OCEAN / COAST / LAKE
- Timezone of the place for display; storage UTC
- OSM: `REQUIRES_REVIEW` (ODbL) before substantial extract
- Geodesic distance for nearest station
""",
    },
    "13-raster-data": {
        "name": "13-raster-data",
        "description": "COG, map tiles, rasters, WebGL textures. Use when serving map layers or generating tiles. Never send global raw grids to the browser.",
        "title": "Raster data",
        "body": """
Produce raster/vector tiles or GPU textures. Cache on CDN. Distinct color scales for absolute vs anomaly (diverging, zero-centered). Do not rely on colour alone (values, legend, contrast).
""",
    },
    "14-multidimensional-data": {
        "name": "14-multidimensional-data",
        "description": "Zarr, Xarray, NetCDF, GRIB, depth/time/lat/lon cubes. Use when designing the data lake or extracting multidimensional slices.",
        "title": "Multidimensional data",
        "body": """
Object storage for cubes. Document lon convention (0–360 vs −180–180), vertical levels, time calendar. cfgrib/eccodes for GRIB. No Dask unless measured need.
""",
    },
    "15-data-engineering": {
        "name": "15-data-engineering",
        "description": "ETL bulk ingest, resume, checksum, deduplication, schema drift, quarantine. Use when writing or fixing pipelines.",
        "title": "Data engineering",
        "body": """
- Idempotent replay
- SHA-256; skip identical files
- Never overwrite raw; version + supersedes
- Schema drift → stop + `raw_quarantine`
- Job metadata: last_checked, last_successful_import, source_version
- Stack: Python, Polars, PyArrow, httpx, pydantic, psycopg
""",
    },
    "16-data-quality": {
        "name": "16-data-quality",
        "description": "Validation, missing data, outliers, QC flags. Use when adding checks or handling extreme values.",
        "title": "Data quality",
        "body": """
Examples: Tmin ≤ Tmax; RH 0–100 unless a documented convention; precip ≥ 0; wind speed ≥ 0; lat/lon valid.

Bounds are conservative. Extremes may be records: **flag, do not delete**. NULL is missing; 0 is measured zero.
""",
    },
    "17-dataviz": {
        "name": "17-dataviz",
        "description": "Charts, maps, timelines, heatmaps with ECharts and MapLibre. Use when building UI for weather, climate, or ocean data.",
        "title": "Dataviz",
        "body": """
ECharts + MapLibre. Deck.gl/WebGL only for heavy layers or particle wind/currents (separate ocean vs wind layers).

No million DOM points. Timeline colours: historical / observation / forecast. Never claim data before coverage.

Precision: display_precision from variable registry.
""",
    },
    "18-programmatic-seo": {
        "name": "18-programmatic-seo",
        "description": "Programmatic SEO pages for country, region, city, date, climate, records. Use when adding indexable routes.",
        "title": "Programmatic SEO",
        "body": """
No empty pages. Significant content only. fr + en. Server-generated share cards with attribution.

See [docs/SEO.md](../../docs/SEO.md).
""",
    },
    "19-open-data-legal": {
        "name": "19-open-data-legal",
        "description": "Open-data licences, commercial rights, attribution, redistribution, licence-change alerts. Use for any legal or attribution question.",
        "title": "Open data legal",
        "body": """
Read [docs/DATA_LICENSES.md](../../docs/DATA_LICENSES.md). Do not invent licences. Logo use default false. If terms change → `LEGAL_REVIEW_REQUIRED`; keep raw; block new uses if needed.

This is engineering review, not a substitute for counsel before paid launch.
""",
    },
    "20-security": {
        "name": "20-security",
        "description": "Secrets, auth roles, OWASP, rate limits, GDPR. Use when adding auth, API keys, payments, or handling credentials.",
        "title": "Security",
        "body": """
Server-only secrets (CDS, CMEMS, MF API, storage). Roles: FREE PREMIUM PRO ADMIN API_CUSTOMER. Parameterized SQL. Stripe webhook idempotency. GDPR export/delete.

See [docs/SECURITY.md](../../docs/SECURITY.md).
""",
    },
    "21-performance-finops": {
        "name": "21-performance-finops",
        "description": "Cache layers, storage, CDN, egress, cost monitoring. Use when choosing what to download, store, or precompute.",
        "title": "Performance and FinOps",
        "body": """
A normal pageview must not hit CDS/MF/NOAA. L1–L5 caches. Hot/warm/cold. PRODUCT NEED → DATA NEED.

Never fetch 137 ERA5 levels × all variables × globe hourly.

Measure bytes on every pipeline. See [docs/COSTS.md](../../docs/COSTS.md).
""",
    },
    "22-monetization": {
        "name": "22-monetization",
        "description": "Free, Premium, Pro, API plans, metering, Stripe. Use when adding billing, quotas, or commercial API responses.",
        "title": "Monetization",
        "body": """
Sell value-added API (normalize, cache, fusion, provenance), not a free-source proxy. No SLA on FREE.

Prices in [docs/BUSINESS_MODEL.md](../../docs/BUSINESS_MODEL.md) are hypotheses.
""",
    },
    "23-testing": {
        "name": "23-testing",
        "description": "Unit, integration, scientific regression, GIS, E2E, golden datasets. Use when adding features or changing statistics, units, or wind direction.",
        "title": "Testing",
        "body": """
Golden places: Grenoble, Paris, mountain altitude, Marseille coast, Mediterranean, later NY/Tokyo.

A code change must not silently alter means, records, units, day boundaries, or wind arrows.

Mocks only in tests/Storybook and labelled as mocks. No fake production data.
""",
    },
}


def main():
    for slug, spec in SKILL_DOCS.items():
        d = SKILLS / slug
        d.mkdir(parents=True, exist_ok=True)
        text = (
            "---\n"
            f"name: {spec['name']}\n"
            f"description: {spec['description']}\n"
            "---\n\n"
            f"# {spec['title']}\n"
            f"{spec['body'].strip()}\n"
        )
        (d / "SKILL.md").write_text(text, encoding="utf-8")
    print(f"wrote {len(SKILL_DOCS)} skills")


if __name__ == "__main__":
    main()
