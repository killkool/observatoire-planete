# Architecture

Nom de travail : **Observatoire Planète**. Marque propre. Les fournisseurs sont des **sources**, pas des partenaires.

## 1. État actuel vs cible

| Aujourd’hui (prototype, 2026-09-06) | Cible |
|---|---|
| App Next.js unique (`src/`) | Monorepo `apps/web`, `apps/api`, `apps/worker`, `apps/tile-server` |
| SQLite `data/meteo.sqlite` (1,2 M obs Isère) | PostgreSQL / PostGIS (métadonnées, stations, agrégats) + object storage (grilles) |
| Import MF bulk + checksum + lineage | Pipelines idempotents + source registry Postgres + checksum + lineage |
| Moyenne arithmétique « France » sur `/dashboard` seulement | Jamais présentée comme indicateur officiel ; stats documentées |
| MapLibre + tuiles IGN sur la page lieu ; Recharts sur le prototype | MapLibre + couches métier ; identité Earth Observatory |
| Une observation MF préférée + ERA5 prévu non ingéré | Global Weather Source Engine |

Le prototype **reste utilisable** pendant la migration. Il ne dicte pas le modèle de données.

## 2. Monorepo

```
/
  apps/web/            Next.js App Router, TypeScript strict, Tailwind, SSR
  apps/api/            API interne / future API commerciale
  apps/worker/         ingestion, agrégats, records, exports
  apps/tile-server/    rasters / vecteurs
  packages/
    database/
    weather-core/      unités, variables, origin types
    source-engine/
    confidence-engine/
    climate-statistics/
    geo/
    ocean/
    map/
    ui/
    auth/
    billing/
    licensing/
    provenance/
  pipelines/           un dossier par provider
  skills/
  docs/
  infrastructure/
  tests/
  scripts/
  config/
```

Durant la Phase 1, `src/` du prototype peut cohabiter. Toute nouvelle feature va dans la structure cible.

## 3. Séparation des plans

```
Utilisateur → web (SSR) → API v1 → caches L1/L2/(L3) → PostgreSQL
                                              ↘ object storage (Zarr/GRIB/COG)
Workers / scheduler → ingestion bulk → raw (immuable) → standardized → derived
```

Une page vue normale **ne déclenche pas** : téléchargement CDS, appel MF, appel NOAA, job ERA5 lourd.

## 4. Stockage

### PostgreSQL / PostGIS

Utilisateurs, lieux, stations, observations **ponctuelles**, agrégats, records, mappings, licences, provenance, abonnements.

Partitionner observations **quand** les mesures le justifient (année ou source), pas avant.

Index : GiST nearest station, point-in-polygon, lookups INSEE / ISO.

### Object storage

```
raw/meteo-france/...
raw/noaa/ghcn/...
raw/noaa/isd/...
raw/copernicus/era5/...
raw/copernicus/marine/...
raw/ecmwf/...
standardized/...
derived/...
public/tiles/...
quarantine/...
```

Ne jamais écraser `raw/`. Version + `supersedes` + checksum.

### Interdit

Stocker la grille mondiale ERA5 horaire en lignes SQL.

## 5. Formats

| Besoin | Format |
|---|---|
| Multidim cloud | Zarr |
| Tables analytiques | Parquet (+ DuckDB en job) |
| Rasters web | COG, tuiles |
| Source scientifique | NetCDF, GRIB |
| Cartes vecteur précalculées | PMTiles |
| Métadonnées | PostgreSQL |

Python data : Polars, PyArrow, Xarray, Zarr, cfgrib/eccodes, rasterio, psycopg, httpx, pydantic. Dask seulement si mesuré nécessaire. Copernicus Marine Toolbox pour CMEMS.

## 6. Frontend

- Next.js Active LTS (aujourd’hui : 15.x dans le prototype ; ne pas figer une version obsolète)
- React + TypeScript strict + App Router + SSR / Server Components
- Tailwind + design system maison (`packages/ui`)
- Apache ECharts
- MapLibre GL JS
- Deck.gl / WebGL seulement si couches massives ou particules vent/courants
- i18n dès l’architecture : `fr`, `en` ; unités °C/°F, km/h/mph/kn, mm/in
- Pas de millions de nœuds DOM

UX : Earth Observatory / data journalism, pas dashboard SaaS générique, pas clone Windy.

Accueil : recherche mondiale + globe + timeline. CTA « Explorer un lieu » / « Remonter dans le temps ».

Mobile : carte + bottom sheet + timeline + couches.

## 7. Click anywhere

1. Point → land / ocean / coast / large lake  
2. Panneau terre ou océan  
3. Source engine selon variable et date  
4. Timeline bornée à la **couverture réelle** de chaque source

## 8. Source engine

Package `source-engine` :

- catalogue + ranking **par pays × variable × période**
- cross-validation (écarts, pas de moyenne aveugle)
- `source_dependency_group`
- best source + alternatives
- extraction point : `nearest` | `bilinear` | `area_average` (défaut documenté par produit)

## 9. Confidence engine

Score documenté, pas un nombre magique. Voir [CONFIDENCE_MODEL.md](./CONFIDENCE_MODEL.md).

## 10. API

Interne versionnée :

`/api/v1/location` `point` `history` `climate` `records` `sources` `compare` `ocean` `forecast` `stations` `tiles`

Réponse commerciale type : `preferred_value`, `unit`, `source`, `source_type`, `confidence`, `alternatives`, `quality`, `provenance`, `data_version`, `method_version`.

Valeur vendue : normalisation, cache, index, stats, fusion, provenance, SLA — **pas** le proxy d’une API gratuite.

## 11. Caches (L1→L5)

Application → CDN → Redis **si justifié** → produits précalculés → object storage.

Précalcul : agrégats journaliers/mensuels/annuels, records, normales, day-of-year, villes fréquentes.

Hot / warm / cold selon fraîcheur et popularité.

## 12. Ingestion

- Bulk > API unitaire
- Idempotence (clé naturelle + checksum)
- Schema drift → stop + quarantine
- Quality tests prudents (Tmin ≤ Tmax, RR ≥ 0, …) : **flag**, pas suppression silencieuse
- Sync metadata : `update_frequency`, `last_successful_import`, `source_version`

## 13. Sécurité

Secrets serveur (Vault / env). Jamais de jeton CDS / CMEMS / MF / S3 dans le client. Auth rôles FREE / PREMIUM / PRO / ADMIN / API_CUSTOMER. Rate limit, CSP, OWASP, RGPD (export / delete). Stripe webhooks idempotents.

## 14. Observabilité & FinOps

Logs structurés, métriques d’import, lag source, coût storage/egress/compute, coût / 1000 pageviews. Alertes : pipeline, licence, schema, volume, spike coût.

## 15. Tests

Unit, integration, data, statistical, GIS, E2E, load, security. Golden datasets : Grenoble, Paris, altitude (Mont Aiguille), Marseille côte, Méditerranée, New York, Tokyo. Régression scientifique : moyennes, records, unités, bornes de jour, direction du vent.

## 16. IA

Une IA **n’invente jamais** une valeur manquante. Elle explique à partir de stats du moteur. Absent = « non disponible ».

## 17. Décisions à consigner en ADR

- ADR stockage ERA5 (point + daily régional vs Zarr mondial)
- ADR ranking sources France
- ADR modèle de confiance
- ADR tuiles
- ADR produits CMEMS Méditerranée (DOI)

Voir `docs/adr/`.
