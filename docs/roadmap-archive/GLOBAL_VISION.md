# Vision mondiale archivée (V2 / V3)

**Archivé le :** 2026-09-06  
**Statut :** PARK — ce n’est plus la roadmap active.

La roadmap **active** est [../ROADMAP.md](../ROADMAP.md) (V1 France grand public, phases R0–R14).

Le texte constitutionnel mondial **mot pour mot** reste [../PROMPT_MAITRE_V2.md](../PROMPT_MAITRE_V2.md) (sections 0–187). Index : [../PROMPT_INDEX.md](../PROMPT_INDEX.md). Backlog opérationnel : [../BACKLOG_V2_GLOBAL.md](../BACKLOG_V2_GLOBAL.md).

Le contenu ci-dessous est la copie de `docs/ROADMAP.md` **avant** le recentrage V1. Il n’est pas à exécuter maintenant. Ne pas le supprimer.

---

# Roadmap — Observatoire Planète (archive 2026-09-06)

Nom de travail. Ne jamais laisser croire à un partenariat avec Météo-France, Copernicus, NOAA ou ECMWF.

**Priorité produit :** fiabilité → traçabilité → simplicité → performance → coût → nouvelles features.

**Règle d’extension mondiale :** ne passer au monde entier que lorsque France ingestion, source engine, confidence engine, licences, cost model et cartes sont stables.

Les cases `[x]` = livré **et** vérifié (preuve). `[ ]` = non fait. Une case n’est pas cochée parce que le fichier existe : il faut une preuve (import réel, test, page).

Dernière mise à jour : 2026-09-06 (soir). Tableau lisible : [STATUS.md](./STATUS.md). Constitution : [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) (mot pour mot). Index 0–187 : [PROMPT_INDEX.md](./PROMPT_INDEX.md).

---

## File d’exécution immédiate

1. [x] Phase 0 — recherche & licences (docs + YAML, 2026-09-06)
2. [ ] Phase 1 — Postgres/PostGIS + object storage (schéma SQL rédigé, runtime encore SQLite)
3. [x] Phase 2 — source registry exécutable (gate licence + seed SQLite) — Postgres cible encore à brancher
4. [x] Phase 3 — import Isère réel + checksum (1 208 439 obs, 156 postes, 1980–2026-09-04)
5. [x] Phase 4 — page Grenoble + date réelle (preuve 1983-05-12, CORENC LA REVIREE, 6,6 / 21,6 °C) — SEO/search encore limité aux 3 lieux seed ; UI visuelle + carte IGN (2026-09-06)
6. [ ] Phase 5 — ERA5 Grenoble (**prochaine action** : pipeline prêt, `point_extractions` = 0, pas de valeur inventée)
7. [x] Provenance + confiance v1-draft affichées sur le slice (poids à calibrer ; ERA5 absente donc pas de corroboration)

---

## Phase 0 — Research & legal

- [x] Cataloguer Météo-France (Confluence + data.gouv, 2026-09-06)
- [x] Cataloguer ERA5 CDS
- [x] Cataloguer ERA5-Land CDS
- [x] Cataloguer NOAA GHCN (NODD/CC0)
- [x] Cataloguer NOAA ISD / GHCNh (NODD)
- [x] Cataloguer Copernicus Marine (licence + DOI)
- [x] Cataloguer ECMWF Open Data (subset vs catalogue)
- [x] Vérifier licences et droits commerciaux
- [x] Identifier restrictions (E-OBS, logos, proxy API, ECMWF HR)
- [x] Documenter attributions
- [x] Identifier formats
- [x] Estimer volumes et coûts ([COSTS.md](./COSTS.md))
- [x] Livrables `DATA_SOURCES.md` + `DATA_LICENSES.md`
- [ ] Revue juriste avant offre payante (hors Phase 0 ingénierie)

**Preuve :** [DATA_SOURCES.md](./DATA_SOURCES.md), [DATA_LICENSES.md](./DATA_LICENSES.md), `packages/licensing/registry/data-sources.yaml`.

---

## Phase 1 — Architecture

- [ ] Monorepo `apps/` + `packages/` + `pipelines/` réellement branché (le dépôt est encore une app Next monolithique)
- [ ] PostgreSQL / PostGIS (schéma versionné)
- [ ] Object storage (MinIO local / S3 prod)
- [ ] Worker + scheduler
- [ ] CI
- [ ] Observabilité (logs structurés a minima)
- [ ] ADR stockage ERA5, ranking, tiles

**État actuel :** Next.js 15 + SQLite `data/meteo.sqlite` + scripts d’import MF. C’est un **prototype**, pas l’architecture cible.

---

## Phase 2 — Source registry

**État :** exécutable en SQLite pour MF + ERA5 + E-OBS. Pas le registre Postgres cible.

- [x] Table `data_sources` (runtime SQLite, seed au démarrage)
- [ ] Table `data_source_licenses` (présente dans `packages/database/schema/`, non branchée)
- [x] YAML providers / datasets / `legal_status` ([data-sources.yaml](../packages/licensing/registry/data-sources.yaml))
- [ ] Versions de dataset figées pour chaque connecteur (ERA5 non ingéré)
- [x] `legal_status` bloquant les pipelines existants (`assertCommercialSource` sur import MF et ERA5)
- [x] Provenance `data_lineage` (4 fichiers MF)
- [x] Aucun pipeline MF/ERA5 sans entrée registry — autres connecteurs absents
- [ ] Gate runtime aligné 1:1 sur tout le YAML (le gate TS n’embarque que 3 `source_id`)

---

## Phase 3 — France MVP (Isère)

**État :** import département 38 réel. Pas de référentiel communal IGN.

- [ ] Import IGN ADMIN EXPRESS : régions, départements, communes (INSEE)
- [x] Métadonnées stations MF (156 postes issus du bulk, lat/lon/alt)
- [x] Import quotidien MF **département 38** (bulk, idempotent, checksum SHA-256)
- [x] Zones de validation : Grenoble, Crolles, La Pierre (seed `places` + pages)
- [x] Ne pas inventer de valeurs ; NULL ≠ 0 (`formatCelsius(null)` = « non disponible »)

**Preuve :** 1 208 439 observations, 1980-01-01 → 2026-09-04, 4 `import_files` + 4 `data_lineage`.

---

## Phase 4 — Première page historique

Cible : `/weather/france/auvergne-rhone-alpes/isere/grenoble` (slugs stables).

**État :** page lieu réelle pour 3 communes. Carte IGN + heatmap « ce jour ».

- [ ] Recherche commune (seulement 3 slugs seed)
- [x] Date historique (`?date=`, défaut = dernier jour importé)
- [x] Station utilisée (id, nom, distance, altitude, matching ce jour-là)
- [x] Tmin, Tmax, pluie si présente
- [x] Source + licence (attribution MF sur la page)
- [x] Records du lieu (observés, étiquetés « pas d’ERA5 »)
- [x] Courbe + heatmap annuelle cliquable
- [x] Tests unité (`npm run test:science`, 2026-09-06)
- [ ] Test golden automatisé Grenoble 1983-05-12 (6,6 / 21,6 °C) — preuve manuelle + SQL uniquement
- [x] Carte IGN Géoplateforme (ortho / plan) + extraits UI `public/images/places/`

**Preuve page :** 1983-05-12, station `38126001` CORENC LA REVIREE, Tmin 6,6 °C, Tmax 21,6 °C, RR 0,1 mm.

---

## Phase 5 — ERA5 France (Grenoble d’abord)

**État : non ingéré.** `SELECT COUNT(*) FROM point_extractions` = 0. Aucune valeur inventée.

- [ ] Extraction point ERA5 (variables prioritaires, quotidien dérivé documenté)
- [ ] Afficher MF **et** ERA5 côte à côte
- [ ] Mesurer écarts (bias, MAE) **sans fusion**
- [ ] ERA5T vs ERA5 final explicite
- [x] Pas de téléchargement mondial horaire (interdit dans le pipeline et l’UI)

**Précurseur :** `scripts/import-era5-point.ts` + [pipelines/era5/README.md](../pipelines/era5/README.md) ; panneau UI « Pas encore ingérée ».

---

## Phase 6 — Source fusion engine

**État :** matching station v1 (distance / altitude / couverture / Tmin-Tmax du jour). Pas de fusion multi-sources.

- [ ] Ranking configurable au-delà du score station v1
- [ ] Comparaison inter-sources (ERA5 absente)
- [x] Lineage sur l’import MF
- [ ] Graphe de dépendance (`source_dependency_group`)
- [x] Jamais `mean(MF, NOAA, ERA5)` comme vérité (règle produit + UI)

---

## Phase 7 — Confidence engine

**État :** brouillon v1 affiché sur le slice. Non calibré.

- [x] Score documenté ([CONFIDENCE_MODEL.md](./CONFIDENCE_MODEL.md)) + `confidence-v1-draft` dans l’UI
- [ ] Tests plaine / montagne / littoral / ville
- [x] Détail +X explicable dans l’UI (Grenoble / Crolles)

---

## Phase 8 — NOAA (sous-ensemble)

- [ ] GHCN sous-ensemble (France / Alpes)
- [ ] Liens `physical_station_entities`
- [ ] Test déduplication Grenoble

---

## Phase 9 — France complète

- [ ] Ingestion quotidienne métropole stable
- [ ] Pages SEO uniquement si contenu réel
- [ ] Outre-mer : timezone FU, ne pas traiter comme UTC métropole

---

## Phase 10 — World stations

- [ ] GHCN progressif
- [ ] Recherche internationale (identité ≠ nom)

---

## Phase 11 — ERA5 world

- [ ] Stratégie point / régional / on-demand / daily precomputed
- [ ] Variables prioritaires seulement
- [ ] FinOps mesuré avant scale

---

## Phase 12 — Ocean MVP

- [ ] CMEMS, Méditerranée occidentale
- [ ] SST, T(z), courants, salinité, vagues
- [ ] DOI + attribution home/page océan
- [ ] Profil vertical avec niveaux réels

---

## Phase 13 — Global ocean

- [ ] Extension progressive, produit par produit

---

## Phase 14 — ECMWF forecast

- [ ] Open Data subset IFS (puis AIFS)
- [ ] Séparer past / present / future
- [ ] Archive locale des runs si on promet un historique de prévision

---

## Phase 15 — Global map

**État :** MapLibre sur la **page lieu** (tuiles IGN), pas une carte météo mondiale.

- [x] MapLibre + tuiles IGN Géoplateforme (ortho / plan) sur Grenoble / Crolles / La Pierre
- [ ] Carte mondiale ; tuiles métier (pas de grille brute navigateur)
- [ ] Couches temp, vent, pluie, SST, vagues, courants
- [ ] Palettes distinctes valeur / anomalie
- [ ] Accessibilité ≠ couleur seule

---

## Phase 16 — Time machine

**État :** « ce jour dans l’histoire » pour la station préférée (heatmap + courbe), borné à la couverture réelle de ce poste.

- [ ] Timeline 1940 → +15 j selon couverture réelle
- [x] Machine « ce jour dans l’histoire » (heatmap annuelle cliquable, records de station)
- [ ] Animation vent/courants (couches séparées)

---

## Phase 17 — Premium

- [ ] Comptes, favoris, source inspector, exports, comparaisons

---

## Phase 18 — Pro

- [ ] CSV / JSON / PDF / PNG ; NetCDF subset éventuel
- [ ] Verticals (hors certification maritime)

---

## Phase 19 — API commerciale

**État :** endpoints internes de slice, pas une offre API.

- [x] `/api/v1/history` et `/api/v1/sources` (slice Isère, `data_version=slice-isere-v1`)
- [ ] `/api/v1/*` versionné commercial
- [ ] API keys, quotas, Stripe usage, pas de proxy tiers

---

## Phase 20 — Scale

- [ ] Load tests, CDN, partitionnement mesuré, tile cache, cost dashboard

---

## Preuves de concept (gates)

### PoC 1 — Grenoble (bloquant)

- [x] Date réelle (1983-05-12)
- [x] Observation Météo-France (CORENC LA REVIREE, 6,6 / 21,6 °C, 0,1 mm)
- [ ] ERA5
- [ ] Écart
- [x] Source, station, distance, altitude (QC MF non exposé)
- [x] Provenance (origine OBSERVED + attribution)
- [x] Confiance (`confidence-v1-draft`, 90/100 sur cette date)

### PoC 2 — Méditerranée

- [ ] Coordonnée marine, SST, T(z), courant, vague, source CMEMS

### PoC 3 — Prévision

- [ ] ECMWF Open Data : temp, vent, pluie ; étiquette FORECAST

---

## Documentation obligatoire (section 33)

- [x] README.md (à réécrire produit)
- [x] AGENTS.md
- [x] CONTRIBUTING.md
- [x] docs/ROADMAP.md
- [x] docs/STATUS.md
- [x] docs/PROMPT_MAITRE_V2.md (constitution mot pour mot)
- [x] docs/PROMPT_INDEX.md (cases 0–187, anti-oubli)
- [x] skills/00-prompt-maitre + skills/00-track-development (lus à chaque prompt)
- [x] docs/ARCHITECTURE.md
- [x] docs/DATABASE.md
- [x] docs/GLOBAL_DATA_MODEL.md
- [x] docs/DATA_SOURCES.md
- [x] docs/DATA_LICENSES.md
- [x] docs/DATA_LINEAGE.md
- [x] docs/CONFIDENCE_MODEL.md
- [x] docs/CLIMATE_METHODOLOGY.md
- [x] docs/OCEAN_METHODOLOGY.md
- [x] docs/STATION_MATCHING.md
- [x] docs/BUSINESS_MODEL.md
- [x] docs/COSTS.md
- [x] docs/SEO.md
- [x] docs/SECURITY.md
- [x] docs/DEPLOYMENT.md
- [x] docs/DISASTER_RECOVERY.md
- [x] ADR-0001 france bulk first — autres ADR au fil des décisions
- [x] DATA_CHANGELOG.md (ingestion 2026-09-06 + extraits IGN UI)

Les docs méthodologiques peuvent être **normatifs mais incomplets** tant que le code n’existe pas : ils décrivent les règles, pas des résultats inventés.

Les docs méthodologiques peuvent être **normatifs mais incomplets** tant que le code n’existe pas : ils décrivent les règles, pas des résultats inventés.

---

## Definition of Done (produit global)

Recherche mondiale ; sources versionnées ; licences connues ; provenance visible ; France observations officielles ; ERA5 ; NOAA ; CMEMS ; océans ; ECMWF forecast ; unités ; cartes ; timeline ; comparaisons ; confiance documentée ; manquants ; SEO ; mobile ; coûts mesurés ; tests scientifiques ; sécurité ; backups testés ; commercial documenté.

**Le projet n’est pas « terminé » à la fin de la Phase 0.**
