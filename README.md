# Observatoire Planète

Nom de travail. Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF, IGN) sont des **sources**, pas des partenaires.

**V1 (livraison) :** moteur de recherche de l’histoire météo de la **France**, grand public.  
**Constitution définitive :** [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md) (mot pour mot, 0–187). Monde / océans / API : [docs/BACKLOG_V2_GLOBAL.md](docs/BACKLOG_V2_GLOBAL.md).

Le dépôt contient encore un prototype local **ClimaFrance** (`/dashboard`). Ne pas l’étendre comme architecture cible.

## Dépôt

GitHub **public** : https://github.com/killkool/observatoire-planete

Après un clone : `npm install`, puis **une fois** `npm run import:meteo -- --department=38 --from=1980 --to=2026`, `npm run import:communes`, `npm run stats:compute`, `npm run import:era5`. Ensuite tout est local (`data/meteo.sqlite` + `raw/`).

## Phase en cours

Vertical slice **Isère → Météo-France → Grenoble → 1983-05-12 → ERA5 point → comparaison** livré. Suite : subset ERA5 France (R9) ou storytelling « ce jour ». Constitution : [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md). Livraison France : [docs/ROADMAP.md](docs/ROADMAP.md).

Déjà livré et vérifié (2026-09-06) : licences, import Isère (1 208 439 obs), **512 communes Isère**, page Grenoble 1983-05-12, ERA5 point (3,4 / 14,2 °C, écart sans fusion), recherche nom/CP/INSEE, provenance, carte IGN. Pas de grille ERA5 France. Postgres/PostGIS non branché.

Lire dans l’ordre :

1. [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md) — constitution définitive
2. [docs/V1_FRANCE_REFOCUS.md](docs/V1_FRANCE_REFOCUS.md) — exécution V1
3. [AGENTS.md](AGENTS.md)
4. [docs/STATUS.md](docs/STATUS.md)
5. [docs/ROADMAP.md](docs/ROADMAP.md)
6. [docs/DATA_LICENSES.md](docs/DATA_LICENSES.md)
7. [docs/LEGAL.md](docs/LEGAL.md)
8. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
9. [docs/ARCHITECTURE_PRODUCTION.md](docs/ARCHITECTURE_PRODUCTION.md)

## Lancer l’app

Node.js 20+ (22 conseillé).

```bash
npm install
npm run dev
```

- Accueil : http://localhost:3000
- Grenoble (preuve) : http://localhost:3000/meteo/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12
- Jour de naissance : http://localhost:3000/naissance
- Sources / méthode : http://localhost:3000/sources · http://localhost:3000/methodology
- Prototype ClimaFrance : http://localhost:3000/dashboard

## Import Météo-France (Isère)

Bulk data.gouv, Licence Ouverte 2.0. Pas d’API unitaire.

```bash
npm run import:meteo -- --department=38 --from=1980 --to=2026
```

Checksum SHA-256 : un fichier identique n’est pas retraité (`FORCE_REPROCESS=1` pour forcer). Les CSV.GZ sont stockés dans `raw/meteo-france/quotidiennes/` et **ne sont pas retéléchargés**. `--refresh` ne refait que le catalogue ; les fichiers déjà présents restent.

## Import communes (Isère)

API officielle Découpage administratif, Licence Ouverte 2.0. Centres uniquement. Après le premier run, `npm run import:communes` relit `raw/geo-api-gouv/` sans appeler geo.api. `--refresh` pour une nouvelle photo du référentiel (sans effacer l’ancienne).

```bash
npm run import:communes
```

## ERA5

Rôle V1 : complément (cohérence / fallback), **pas** la source principale. Aucune valeur n’est inventée.

PoC point : Grenoble 1983-05-12, maille 45,25 / 5,75, 24 h UTC, min/max horaires 3,4 / 14,2 °C. Voir [pipelines/era5/README.md](pipelines/era5/README.md). Ne pas télécharger la grille mondiale.

## Tests scientifiques

```bash
npm run test:science
```

## Licences — V1

| Source | Production commerciale |
|---|---|
| Météo-France quotidien bulk | oui (LO 2.0, attribution) |
| ERA5 / ERA5-Land CDS | oui (CC-BY-4.0, réanalyse, subset France) |
| IGN Géoplateforme | oui (affichage + extraits UI ponctuels) |
| E-OBS | **non** |

NOAA / CMEMS / ECMWF : audités, **PARK** jusqu’à la V2. Ce n’est pas un avis d’avocat.
