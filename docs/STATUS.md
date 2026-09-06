# Avancement — Observatoire Planète

**Date de revue :** 2026-09-06 (soir)  
**Règle :** une case n’est « faite » que si elle a une **preuve** (import, test, page). Un fichier vide ne compte pas.  
**Source de vérité de l’ordre :** [ROADMAP.md](./ROADMAP.md)

Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF, IGN) sont des **sources**, jamais des partenaires.

---

## En une phrase

## En une phrase

Le vertical slice **Isère / Météo-France / Grenoble** affiche une **observation réelle**, sa **station**, sa **carte IGN**, sa **provenance** et un **score de confiance v1**. **ERA5 n’est pas ingéré** (aucune valeur inventée). L’architecture cible Postgres/PostGIS n’est pas branchée. Le suivi d’avancement est **obligatoire à chaque prompt** (`skills/00-track-development`).

## Prochaine action

**Phase 5 — extraire un point ERA5 réel** (CDS, JSON, `npm run import:era5-point`) pour Grenoble, idéalement le **1983-05-12**, puis afficher la comparaison **sans fusion**.

Ne pas : E-OBS, moyenne aveugle multi-sources, téléchargement ERA5 mondial horaire, élargir le dashboard SQLite ClimaFrance comme architecture cible.

## Dépôt Git

- GitHub **privé** : https://github.com/killkool/observatoire-planete
- SQLite locale gitignorée (`data/meteo.sqlite`). Après clone : `npm install` puis `npm run import:meteo -- --department=38 --from=1980 --to=2026`.
- Skill de suivi : `skills/00-track-development` (lu à chaque prompt).

---

## File d’exécution

| # | Phase | Statut | Preuve / limite |
|---|---|---|---|
| 0 | Recherche & licences | **Fait** | [DATA_LICENSES.md](./DATA_LICENSES.md), YAML, 2026-09-06. Revue juriste **non faite**. |
| 1 | Postgres / PostGIS / object storage | **Non** | Schéma SQL rédigé ; runtime **SQLite**. |
| 2 | Source registry exécutable | **Fait (SQLite)** | Gate `assertCommercialSource` sur les imports MF et ERA5. Table `data_source_licenses` Postgres **non branchée**. Catalogue YAML plus large que le gate runtime (3 sources). |
| 3 | Import Isère | **Fait** | 1 208 439 obs, 156 postes, 4 fichiers SHA-256, 1980-01-01 → 2026-09-04. Pas d’ADMIN EXPRESS. |
| 4 | Page historique Grenoble | **Fait (3 lieux)** | Preuve 1983-05-12 ci-dessous. Pas de recherche commune. Pas de test golden automatisé. |
| 4b | UI visuelle (hors phase numérotée) | **Fait** | Accueil, cartes IGN, photos lieu, heatmap. Vérifié navigateur 2026-09-06. |
| 5 | ERA5 point Grenoble | **Non** | Pipeline prêt. `point_extractions` = **0** ligne. |
| 6 | Fusion multi-sources | **Non** | Matching station v1 seulement. |
| 7 | Confiance | **Partiel** | Score `confidence-v1-draft` affiché + tests unité. Poids non calibrés. Pas de golden plaine/montagne/littoral. |

---

## Preuve Grenoble 1983-05-12

Vérifiée en base SQLite **et** sur la page `/weather/france/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12` (2026-09-06).

| Champ | Valeur |
|---|---|
| Lieu | Grenoble, INSEE 38185, 45.1885°N 5.7245°E |
| Station | `38126001` CORENC LA REVIREE |
| Distance / Δ alt. | 4,73 km / 15 m |
| Tmin / Tmax / RR | **6,6 °C / 21,6 °C / 0,1 mm** (unité telle que publiée) |
| Origine | `OBSERVED` — Météo-France bulk, Licence Ouverte 2.0 |
| ERA5 | **absente** (panneau « pas encore ingérée ») |
| Confiance UI | 90/100, méthode `confidence-v1-draft` |
| Carte | IGN Géoplateforme WMTS (ortho + Plan IGN) |

Crolles (dernier jour importé 2026-09-04) : station TENCIN, Tmin 11,3 °C, Tmax 35,2 °C — relevé de station, pas une réanalyse.

Tests : `npm run test:science` → `science tests ok` (2026-09-06). Couvre unités, vent vs courant, matching « pas seulement nearest », gate E-OBS, score OBSERVED > REANALYSIS. **Ne fige pas** 6,6 / 21,6.

---

## Runtime réel

| Élément | État |
|---|---|
| App | Next.js 15, `http://localhost:3000` |
| Base | SQLite `data/meteo.sqlite` |
| Observations | 1 208 439 |
| Stations importées | 156 |
| Fichiers MF + lineage | 4 |
| Lieux seed | Grenoble, Crolles, La Pierre |
| Extractions ERA5 | 0 |
| E-OBS | `DISABLED` dans le registre et le gate |

Pages : `/`, `/weather/.../isere/{grenoble,crolles,la-pierre}`, `/sources`, `/methodology`, `/dashboard` (prototype ClimaFrance, ne pas étendre).

API slice : `GET /api/v1/history`, `GET /api/v1/sources` — **pas** une API commerciale (pas de clés, pas de quotas).

---

## Ce qui n’est pas livré (volontaire)

- Postgres / PostGIS / MinIO / workers / CI
- Import IGN ADMIN EXPRESS (communes France)
- ERA5, NOAA, CMEMS, ECMWF forecast
- Carte mondiale de variables météo (seulement carte **lieu** IGN)
- Recherche mondiale, SEO programmatique au-delà de 3 slugs
- Offre payante, auth, exports Pro

---

## Cartes et images (2026-09-06)

| Visuel | Nature | Licence / mention |
|---|---|---|
| Carte page lieu | Tuiles IGN WMTS ortho + Plan IGN | Licence Ouverte, « © IGN — Géoplateforme » |
| Cartes d’accueil / héros lieu | Extraits WMS ponctuels `public/images/places/*.jpg` | Idem ; **pas** un extract massif |
| Terre, observation, réanalyse, prévision | Illustrations de marque | **Pas** une photo du lieu, **pas** une donnée météo |

---

## Definition of Done du slice actuel

Le slice Isère n’est **pas** le produit mondial. Il est « bon pour enchaîner Phase 5 » si :

1. [x] Observation MF réelle, date réelle, station nommée
2. [x] Provenance + licence visibles
3. [x] Confiance expliquée (brouillon)
4. [x] Carte du lieu réelle (IGN)
5. [ ] ERA5 point réel comparé, jamais fusionné
6. [ ] Test golden automatisé Grenoble 1983-05-12
