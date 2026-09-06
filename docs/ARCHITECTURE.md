# Architecture

Nom de travail : **Observatoire Planète**. Marque propre. Les fournisseurs sont des **sources**, pas des partenaires.

**Cible V1 :** historique météo **France**, grand public.  
**Référence technique officielle :** [ARCHITECTURE_PRODUCTION.md](./ARCHITECTURE_PRODUCTION.md) (ADR-0002). Runtime actuel = prototype **SQLite / Next.js 15 / Recharts** — pas un hébergement Vercel/Supabase déjà branché.  
**Cible V2/V3 :** extension Europe → monde, océans, prévisions — [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md). Ne pas construire le data lake mondial maintenant.

Détail produit : [V1_FRANCE_REFOCUS.md](./V1_FRANCE_REFOCUS.md). Audit : [V1_FRANCE_REFOCUS_AUDIT.md](./V1_FRANCE_REFOCUS_AUDIT.md).

## 1. État actuel vs cible V1

| Aujourd’hui (2026-09-06) | Cible V1 |
|---|---|
| App Next.js unique (`src/`) | Même app tant que ça tient ; split `apps/` seulement si besoin mesuré |
| SQLite `data/meteo.sqlite` (1,2 M obs Isère) + stats précalculées `annual_statistics` | PostgreSQL / PostGIS (Supabase) + Cloudflare R2 |
| Import MF bulk + checksum + lineage | Idem, worker **Python / Polars / DuckDB** (Docker) |
| Graphiques Recharts | ECharts (cible) ; Recharts tant que le prototype tient |
| MapLibre + tuiles IGN page lieu | MapLibre + **PMTiles** (cible) ; IGN conservé pour le lieu |
| Matching station v1 + une obs préférée | Mapping commune↔station (jour) + station climatique (série) |
| Accueil « planète » | Recherche commune France, storytelling |
| ERA5 point Grenoble (1 jour, comparaison sans fusion) | R9 remainder : subset France, pas mondial |
| Schéma `packages/database/schema/` Postgres | Garder les noms **génériques** ; n’implémenter que les tables utiles |

Le prototype `/dashboard` **reste utilisable** pour l’import local. Il ne dicte pas le produit.

ClickHouse : **absent**. Redis : **pas au lancement** (ADR-0002).

## 2. Schéma V1 (simple)

```
Navigateur (Next.js, mobile first)
  → API interne /api/v1/search | communes | history | records | compare (années **ou** villes Isère) | yearly (normale, records, tendance OLS, mois, 4 saisons, épisodes Tmax) | sources | OG `/og/{slug}/{date}`
  → SQLite puis PostgreSQL (places INSEE, stations, observations, stats)
  → object storage : raw/meteo-france/... ; era5 France subset

Flags (défaut false) : ENABLE_GLOBAL_DATA, ENABLE_OCEAN, ENABLE_GLOBAL_SEARCH
```

Noms de services génériques (`WeatherObservation`, `MeteoFranceProvider`, `ERA5Provider`). Pas `FrenchTemperatureService`. Pas d’orchestrateur mondial.

Packages déjà utiles : `weather-core`, `source-engine`, `confidence-engine`, `licensing`, `geo`.  
Packages `ocean`, `billing`, `auth` : ne pas les créer tant que PARK.

## 3. Séparation des plans

```
Utilisateur → web (SSR) → API v1 → cache Next/CDN → PostgreSQL
Workers plus tard → ingestion bulk → raw (immuable) → observations + derived
```

Une page vue normale **ne déclenche pas** : téléchargement CDS, appel MF, job ERA5.

## 4. Stockage

### PostgreSQL / PostGIS (cible V1)

Communes, départements, régions, stations, historique de poste, observations quotidiennes, mapping commune–station, stats mensuelles/saisonnières/annuelles, day-of-year, records, normales, licences, jobs d’import, qualité.

Horaires : seulement si un écran le justifie.

Index : INSEE, nearest station, date+station.

### Object storage

```
raw/meteo-france/...
raw/copernicus/era5/france/...
standardized/...
derived/...
quarantine/...
```

Ne jamais écraser `raw/`. Les préfixes `raw/noaa/`, `raw/copernicus/marine/`, `raw/ecmwf/` restent prévus **sur le papier** (V2), pas à remplir en V1.

### Interdit V1

Stocker la grille mondiale ERA5 horaire en SQL ou en object storage « au cas où ».

## 5. Formats

| Besoin V1 | Format |
|---|---|
| Observations / stats | PostgreSQL (SQLite tant que le slice tient) |
| Source MF | CSV.GZ |
| ERA5 subset | GRIB / NetCDF / JSON point — backend seulement |
| Cartes lieu | WMTS IGN (pas de grille météo navigateur) |

Zarr / cfgrib : outils ERA5, ils ne dictent pas l’architecture produit.

## 6. Frontend

- Next.js 15 (cible prod : Next.js sur Vercel, TS strict)
- Design éditorial météo / souvenir / histoire — pas un dashboard froid
- Graphiques : Recharts aujourd’hui ; **ECharts** cible production
- MapLibre + IGN (PMTiles plus tard)
- i18n : français V1 ; `en` en V2
- Unités UI : °C, km/h, mm, hPa, heures de soleil
- Accueil : barre « Recherchez votre ville »
- Mobile first

Labels publics : Mesure officielle / Série climatique corrigée / Estimation climatique. Codes `OBSERVED` / `REANALYSIS` derrière « En savoir plus ».

## 7. Source engine (V1)

Ordre par défaut France :

1. observation Météo-France appropriée
2. autre poste MF pertinent
3. série homogénéisée si dataset identifié et adapté
4. ERA5 / ERA5-Land en complément

Jamais `mean(MF, ERA5)` comme vérité. Ranking **par variable × période**, pas une hiérarchie figée pour tout.

## 8. Confidence engine

Conservé. Affichage public secondaire. Voir [CONFIDENCE_MODEL.md](./CONFIDENCE_MODEL.md).

## 9. API interne V1

Priorité :

- `GET /api/v1/search`
- `GET /api/v1/communes/{insee}`
- `GET /api/v1/communes/{insee}/daily|monthly|yearly|records`
- `GET /api/v1/compare`
- `GET /api/v1/sources`

Slice actuel : `/api/v1/history?place=&date=` + `GET /api/v1/communes/{insee}/yearly` (années, étés, normale 1991-2020 si ≥ 24 ans climatiques, records d’année observés, anomalies seulement si même poste) + `GET /api/v1/compare` + childhood. **Pas** d’API keys / billing.

## 10. Caches

SQLite local + `raw/` + cache tuiles IGN (`data/tiles/ign/`, uniquement les tuiles déjà affichées). Accueil, sitemap, historique d’un jour et **climat annuel** (`getCommuneYearly`) : lecture SQLite mise en cache 1 h (`unstable_cache`, `src/lib/sqliteReadCache.ts`) — pas un CDN, pas un appel fournisseur. La page commune envoie la mesure du jour **et** le climat annuel dans le HTML initial. Une page vue ne frappe ni data.gouv, ni geo.api, ni Météo-France. IGN : au plus la première fois qu’une tuile manque, 2 requêtes simultanées max. Redis **interdit au lancement** (ADR-0002). `npm run stats:compute` n’est **jamais** déclenché par une page vue.

## 11. Ingestion

Bulk > API unitaire. **Local-first** : relire `raw/` avant tout HTTP. Idempotence + checksum. Ne jamais écraser `raw/`. Schema drift → stop + quarantine. Tests qualité : **flag**, pas suppression silencieuse. Volumes : [V1_DATA_VOLUME.md](./V1_DATA_VOLUME.md).

## 12. Sécurité

Secrets serveur. Jamais de jeton CDS / MF / S3 dans le client. SQL paramétré. RGPD dès qu’il y a des comptes (R13).

## 13. Tests

`npm run test:science` (local + GitHub Actions). Golden Grenoble 1983-05-12 si la base est importée. Feature sans test : non.

## 14. IA

N’invente jamais une valeur manquante. Absent = « Non disponible ».

## 15. ADR

- ADR-0001 France bulk first (toujours valable)
- [ADR-0002](./adr/ADR-0002-production-stack-v1.md) stack production V1 (cible, pas le runtime local)
- ADR stockage ERA5 France (R9)
- ADR ranking sources France
- ADR modèle de confiance (déjà partiel)
