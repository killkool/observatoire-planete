# Observatoire Planète

Nom de travail. Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF) sont des **sources**, pas des partenaires.

Produit visé : moteur de recherche de l’histoire météorologique et climatique de la planète — terre et océans — avec provenance et confiance explicables.

Le dépôt contient encore un prototype local **ClimaFrance** (dashboard SQLite). L’architecture cible et le vertical slice Isère / Grenoble le remplacent progressivement.

## Dépôt

GitHub **privé** : https://github.com/killkool/observatoire-planete

Après un clone : `npm install` puis réimporter l’Isère (la SQLite n’est pas dans Git).

## Phase en cours

**Prochaine action : Phase 5 — ERA5 point Grenoble** (aucune valeur inventée tant que CDS n’a pas fourni un JSON réel).

Déjà livré et vérifié (2026-09-06) : Phase 0 licences, import Isère (1 208 439 obs), page Grenoble 1983-05-12, provenance, confiance v1-draft, carte IGN. Postgres/PostGIS non branché.

Tableau : [docs/STATUS.md](docs/STATUS.md) · ordre : [docs/ROADMAP.md](docs/ROADMAP.md)

Lire dans l’ordre :

1. [AGENTS.md](AGENTS.md)
2. [skills/00-track-development/SKILL.md](skills/00-track-development/SKILL.md)
3. [docs/STATUS.md](docs/STATUS.md)
4. [docs/ROADMAP.md](docs/ROADMAP.md)
5. [docs/DATA_LICENSES.md](docs/DATA_LICENSES.md)
6. [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)
7. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Lancer l’app

Node.js 20+ (22 conseillé).

```bash
npm install
npm run dev
```

- Accueil : http://localhost:3000
- Grenoble (preuve) : http://localhost:3000/weather/france/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12
- Crolles / La Pierre : mêmes routes
- Sources / méthode : http://localhost:3000/sources · http://localhost:3000/methodology
- Prototype ClimaFrance : http://localhost:3000/dashboard

## Import Météo-France (Isère)

Bulk data.gouv, Licence Ouverte 2.0. Pas d’API unitaire.

```bash
npm run import:meteo -- --department=38 --from=1980 --to=2026
```

Checksum SHA-256 : un fichier identique n’est pas retraité (`FORCE_REPROCESS=1` pour forcer).

## ERA5

Aucune valeur n’est inventée. Voir [pipelines/era5/README.md](pipelines/era5/README.md).

## Tests scientifiques

```bash
npm run test:science
```

## Licences — décision Phase 0

| Source | Production commerciale |
|---|---|
| Météo-France quotidien bulk | oui (LO 2.0, attribution) |
| ERA5 / ERA5-Land CDS | oui (CC-BY-4.0, réanalyse) |
| NOAA GHCN NODD | oui (CC0, pas d’endossement) |
| CMEMS | oui (crédit + DOI, produit par produit) |
| ECMWF Open Data subset | oui (CC-BY + ToU, **prévision**) |
| E-OBS | **non** |

Ce n’est pas un avis d’avocat. Revue juridique avant offre payante.
