# Audit — recentrage V1 France grand public

**Date :** 2026-09-06  
**Règle :** aucun code métier n’a été supprimé pour produire cet audit.  
**Catégories :** KEEP (conserver) · ADAPT (simplifier / France) · PARK (hors V1, garder) · REMOVE (seulement si coût/risque réel)

Vision longue terme (monde, océans, prévisions) : [roadmap-archive/GLOBAL_VISION.md](./roadmap-archive/GLOBAL_VISION.md) + [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md).  
Stratégie V1 : [V1_FRANCE_REFOCUS.md](./V1_FRANCE_REFOCUS.md).

---

## 1. État constaté (pas supposé)

Runtime réel, vérifié 2026-09-06 :

| Élément | Constat |
|---|---|
| App | Next.js 15, `src/`, pas de monorepo `apps/` |
| Base | SQLite `data/meteo.sqlite` (gitignorée) |
| Observations | **1 208 439** lignes, 1980-01-01 → 2026-09-04, département 38 |
| Stations | **156** postes Météo-France |
| Lieux | 3 seeds : Grenoble, Crolles, La Pierre (INSEE) |
| ERA5 | pipeline JSON prêt, `point_extractions` = **0** |
| ClickHouse / Zarr runtime / workers / CI / Redis | **absents** |
| Océan / NOAA ingest / ECMWF ingest | **absents** (docs + YAML + skills seulement) |
| Preuve Grenoble | 1983-05-12, CORENC LA REVIREE, 6,6 / 21,6 °C, 0,1 mm |

Ce qui **fonctionne déjà** pour l’histoire météo réelle de Grenoble : commune seed → matching station (pas seulement nearest) → observations MF → page date → heatmap « ce jour » → source + distance.  
Ce qui **bloque une V1 grand public** : pas de recherche commune, pas de référentiel INSEE France, jargon technique à l’accueil (planète / réanalyse / ERA5), pas de stats pré-calculées (normales, percentiles, comparateur), URL `/weather/france/...` trop profonde, UI « Earth Observatory » plus que « mémoire météo de la France ».

---

## 2. Classification

### KEEP

| Composant | Pourquoi |
|---|---|
| Import MF bulk Isère (`scripts/import-meteo-france.ts`, checksum, lineage) | Cœur V1, données réelles |
| Matching station (`packages/source-engine`) | Distance + altitude + couverture + donnée du jour |
| `weather-core` (unités, `DataOriginType`) | Canonique, extensible sans nom « French* » |
| Licence gate + YAML + E-OBS `DISABLED` | Obligation légale V1 |
| Page lieu Grenoble / Crolles / La Pierre | Preuve produit |
| API `GET /api/v1/history`, `GET /api/v1/sources` | Base interne |
| Carte IGN Géoplateforme (page lieu) | Géographie réelle, LO 2.0 |
| Tests `npm run test:science` | Unités, matching, gate |
| Docs licences MF / ERA5 | Audités 2026-09-06 |
| ADR-0001 (France bulk first) | Déjà aligné V1 |
| Skills 02, 08, 11, 15–23, 00-track, 00-prompt | Utiles V1 ou gouvernance |
| Prototype `/dashboard` | Import MF local ; ne pas l’étendre comme produit |

### ADAPT

| Composant | Adaptation V1 |
|---|---|
| Accueil (`ObservatoryHome`) | Barre de recherche commune, CTA France, plus de « planète / océans » en premier |
| Labels d’origine UI | Backend garde OBSERVED/REANALYSIS ; public : « Mesure officielle » / « Estimation climatique » + En savoir plus |
| Routes `/weather/france/...` | Conserver (ne pas casser) ; ajouter alias `/meteo/...` plus simple |
| Architecture cible Postgres | Rester la cible **France** (stations + quotidiennes + stats), pas le data lake mondial |
| `docs/ARCHITECTURE.md`, README, BUSINESS_MODEL, DATA_SOURCES | Recentrer France / grand public / trafic |
| Confiance v1-draft | Garder en « En savoir plus », pas en chiffre 90/100 sur l’écran principal |
| ERA5 pipeline | Rôle secondaire (cohérence / fallback), subset France seulement, pas Phase 5 bloquante pour le MVP public |
| Skills monde (03–07, 09, 12 partiel) | Marquer DORMANT, ne plus les lire par défaut |
| Schéma SQL `001_core.sql` | Garder générique ; n’implémenter en SQLite V1 que tables France nécessaires |
| Homepage Terre entière | Visuel possible en fond ; message = France |

### PARK (ne pas supprimer)

| Composant | Raison |
|---|---|
| [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) + index 0–187 | Constitution V2/V3, mot pour mot |
| YAML NOAA / CMEMS / ECMWF | Audit licences déjà fait |
| `pipelines/era5/` | Complément V1 tardif + V2 |
| Docs OCEAN, ECMWF skills, ocean packages (absents du runtime) | Backlog V2 |
| Endpoints API commerciale, Stripe, auth | V2 |
| Globe 3D, click-anywhere mondial, land/ocean mask | V2 |
| ClickHouse | **Non présent** — ne pas l’ajouter |

### REMOVE

**Aucune suppression de code métier dans ce recentrage.**

Rien n’est inutilisé au point de justifier un delete : pas de ClickHouse, pas de connecteur océan, pas de dépendance NOAA runtime. Les docs/skills monde restent en PARK.

Candidate future (pas maintenant) : moyenne « France » du dashboard ClimaFrance si elle est présentée comme indicateur officiel — aujourd’hui limitée à `/dashboard`, déjà avertie.

---

## 3. Dette technique

- Runtime SQLite vs schéma Postgres non branché.
- 3 communes seed, pas d’ADMIN EXPRESS / recherche INSEE.
- Gate TS (3 `source_id`) ≠ YAML complet.
- Pas de test golden automatisé 6,6 / 21,6 °C.
- Accueil et `/methodology` exposent réanalyse / prévision avant d’avoir un produit France simple.
- `globals.css` monolithique, pas Tailwind (acceptable V1).
- Homonymes communes : non gérés (pas encore de referentiel).

---

## 4. Architecture V1 (simple)

```
Navigateur (Next.js, recherche commune)
  → API interne /api/v1/search | /history | /sources
  → SQLite (puis Postgres) : places INSEE, stations MF, observations quotidiennes, stats précalculées
  → raw/ object storage plus tard (CSV.GZ MF)

ERA5 : fichier point / bbox France en object storage, jamais grille mondiale.
Océan / NOAA / ECMWF : flags off, code/docs PARK.
```

Noms de services **génériques** (`WeatherObservation`, pas `FrenchTemperatureService`). Abstraction légère : Météo-France d’abord, ERA5 en complément.

---

## 5. Chaîne produit — premier trou

```
COMMUNE → STATION → OBSERVATIONS MF → STATISTIQUES → API → PAGE COMMUNE
   ▲
   incomplet : recherche + référentiel
                (3 seeds OK, mapping + obs Isère OK, page date OK)
```

**Grenoble a déjà un historique réel.** Il manque pour le grand public : **chercher une commune**, langage simple, percentile du jour, sections climat/records/comparaison.

Prochaine étape précise : recherche sur les communes existantes + accueil « Recherchez votre ville », sans inventer un référentiel INSEE national.

---

## 6. Skills — groupes

### ACTIVE (lire en V1)

`00-prompt-maitre` (constitution long terme) · `00-track-development` · `01-source-registry` · `02-meteo-france` · `08-climate-statistics` · `11-confidence-engine` · `15-data-engineering` · `16-data-quality` · `17-dataviz` · `18-programmatic-seo` · `19-open-data-legal` · `20-security` · `21-performance-finops` · `23-testing`

Nouveau skill utile à créer plus tard : `france-geospatial` (INSEE, ADMIN EXPRESS) — pas une copie de `12-gis-world`.

### DORMANT (conserver, ne pas charger par défaut)

`03-noaa-ghcn` · `04-noaa-isd` · `05-era5` (sauf quand on touche le complément France) · `06-copernicus-marine` · `07-ecmwf-open-data` · `09-ocean-statistics` · `10-source-fusion` (version mondiale) · `12-gis-world` · `13-raster-data` · `14-multidimensional-data` · `22-monetization` (jusqu’à R13)

### REMOVE

Aucun.

---

## 7. Coûts V1

Pas de ClickHouse, pas de tuiles météo mondiales, pas de CDS massif. Volume : [V1_DATA_VOLUME.md](./V1_DATA_VOLUME.md). Une page vue = 0 appel fournisseur.
