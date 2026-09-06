# DATA CHANGELOG

Journal des sources, versions et recalculs. Pas de remplacement silencieux d’un dataset.

## 2026-09-07 (ERA5 SP / neige / SSRD / rafale Grenoble)

- Même maille ARCO 45,25°N, 5,75°E, 1983-05-12, 24 h UTC. 2t / rosée / TP / vent 10 m / MSL inchangés (3,4 / 14,2 °C ; 2,0 / 6,9 °C ; 0,3 mm ; 8,8 km/h, 169° ; 1005 hPa).
- `surface_pressure` : moyenne 24 h UTC **89517,36 Pa** → **895 hPa**. Orographie `geopotential_at_surface` / g0 = **985,5 m** (maille, pas Grenoble 212 m). Pas fusionné avec le MSL.
- `snow_depth` ARCO : mètres d’**équivalent en eau**, moyenne 24 h **0,027251 m** → **27,3 mm d’eau**. Pas une hauteur de manteau en ville (pas ×100 en cm).
- `surface_solar_radiation_downwards` : accumulation horaire en J m⁻², non monotone (comme TP). Somme 24 h UTC **20768388,375 J m⁻²** → **20,8 MJ/m²**. Pas un pyranomètre.
- `instantaneous_10m_wind_gust` : max des 24 pas **19,2916 m/s** → **69,4 km/h**. Pas une rafale officielle. Pas fusionné (le quotidien Météo-France importé n’a pas ces champs).
- Fichier point SHA-256 `eece40036986b49aaab3e70d9e53ec8ae7fcfc1af8110ab5fa39b96d44062e82`. `method_version=era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1`. Import : **14** lignes `point_extractions`. Quotidien France 2t JSON inchangé (pas réécrit).

## 2026-09-07 (ERA5 vent 10 m + MSL Grenoble)

- Même maille ARCO 45,25°N, 5,75°E, 1983-05-12, 24 h UTC. 2t / rosée / TP inchangés (3,4 / 14,2 °C ; 2,0 / 6,9 °C ; 0,3 mm).
- `10m_u_component_of_wind` / `10m_v_component_of_wind` : m s⁻¹. Vitesse quotidienne = moyenne des hypot(u,v) horaires **2,4516 m/s** → **8,8 km/h**. Direction d’où vient le vent = moyenne vectorielle **169,3°** → **169°**. Pas une rafale, pas un anémomètre. Pas fusionné (le quotidien Météo-France importé n’a pas de vent).
- `mean_sea_level_pressure` : moyenne 24 h UTC **100523,66 Pa** → **1005 hPa**. Pas la pression au sol de Grenoble. Pas de `surface_pressure`.
- Fichier point SHA-256 `63cb522f6e9a5c2e18b07e70d52d4c96eb9170a19ccbec1b3c6bfb6e66d4331f`. `method_version=era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-v1`. Import : **10** lignes `point_extractions`. Quotidien France 2t JSON inchangé (pas réécrit).

## 2026-09-07 (ERA5 pluie Grenoble + quotidien France 2t un jour)

- Même maille ARCO 45,25°N, 5,75°E, 1983-05-12, 24 h UTC. `2m_temperature` inchangé : Tmin **276,5640 K** (3,4 °C), Tmax **287,3429 K** (14,2 °C). Point de rosée inchangé : **275,1994 / 280,0102 K**.
- `total_precipitation` ARCO : accumulation horaire en **mètres**, série non monotone (pas un cumul de step CDS). Somme 24 h UTC **0,0003234409 m** → **0,3 mm** à l’affichage. Pas fusionné avec CORENC **0,1 mm**. SHA-256 point `082273eb5d811c8676740d511820d49cdea171ff3ca1fd1c7d32c6c3441346f9`. `method_version=era5-point-nearest-hourly-2t-d2m-tp-v1`. Import : **7** lignes `point_extractions`.
- Quotidien 2t bbox France, **un jour** seulement : 2709 mailles, longitudes signées −5,5–10°E (ARCO 0–360). Maille Grenoble = mêmes Kelvin. Fichier `pipelines/era5/extracts/france-1983-05-12-2t-daily.json` (95 Ko), SHA-256 `9c7b9a9836b23b1252d09b3c410f96cbe5ccd61558b59c92f19b8f3fbfb1cbe2`. `method_version=era5-france-daily-2t-minmax-v1`. **Pas** importé en SQLite. Pas 1940–2026. Chunks ARCO toujours 1 h × globe.

## 2026-09-07 (ERA5 point de rosée Grenoble)

- Même maille ARCO 45,25°N, 5,75°E, 1983-05-12, 24 h UTC. `2m_temperature` inchangé : Tmin **276,5640 K** (3,4 °C), Tmax **287,3429 K** (14,2 °C).
- `2m_dewpoint_temperature` : min **275,1994 K** (2,0 °C), max **280,0102 K** (6,9 °C), moyenne **278,0557 K** (4,9 °C). Aucune valeur inventée. Pas une mesure d’abri. Pas fusionné avec CORENC.
- Fichier : `pipelines/era5/extracts/grenoble-1983-05-12.json`. SHA-256 `c9524523a50333f1a5f76f9d6f6d4c4cff25ad315f27961380755cdbbbf226e2`. `method_version=era5-point-nearest-hourly-2t-d2m-minmax-v1`. Import : **6** lignes `point_extractions`. Bbox France : un point hors 41–51,5°N / 5,5°W–10°E est refusé. Pas de grille France.

## 2026-09-07 (extrait IGN Grenoble recompressé)

- Même fichier `public/images/places/grenoble.jpg` (extrait IGN déjà présent, pas une nouvelle tuile). JPEG mozjpeg qualité 58 : **201 Ko → 174 Ko**. Ce n’est pas une observation météo. Crolles / La Pierre inchangés.

## 2026-09-06 (visuels UI recompressés)

- Mêmes fichiers d’ambiance et extraits IGN déjà présents : convertis JPEG (qualité 68), sans nouvelle tuile IGN, sans autre photo. `hero-earth` 2247 → 89 Ko ; `origin-observed` 1366 → 59 Ko ; `place-alps` 2903 → 133 Ko ; `places/grenoble.jpg` 273 → 196 Ko. PNG sources retirés. Ce ne sont pas des observations météo.

## 2026-09-06 (normales mensuelles 1991-2020)

- Dérivé uniquement des `monthly_statistics` déjà calculées (`precompute-v2`). Aucune valeur inventée, pas de second téléchargement, une page vue ne lance pas `stats:compute`.
- Méthode `month-normal-1991-2020-v1` : moyenne des mois complets (≥ 25 j Tmin et Tmax) par calendrier, seuil **24** mois (80 % de 30 ans). Pluie seulement si ≥ 24 mois à précipitation complète (`NULL` sinon).
- 16 postes Isère ont les 12 mois affichables. GRENOBLE - LVD : 21–22 mois complets sur 1991-2020 → pas une normale LVD. Profil affiché pour Grenoble : **CHATTE_SAPC** (29–30 mois), sans anomalie croisée.
- Preuve CHATTE : janvier −0,5 / 7,2 °C, 66,4 mm ; juillet **14,3 / 28,3 °C**, 68,3 mm ; mai 9,1 / 21,2 °C, 95,8 mm.

## 2026-09-06 (ERA5 point Grenoble)

- Source : ERA5 hourly single levels (C3S / ECMWF), DOI `10.24381/cds.adbb2d47`, CC-BY-4.0, `origin_type=REANALYSIS`. Accès : miroir public ARCO `gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3` (même jeu, pas une autre réanalyse).
- Point demandé : Grenoble 45,1885 / 5,7245. Maille la plus proche : **45,25°N, 5,75°E**. Date **1983-05-12**, 24 heures UTC, variable `2m_temperature` (Kelvin).
- Extrêmes horaires : Tmin **276,5640 K** (3,4 °C), Tmax **287,3429 K** (14,2 °C), moyenne **282,7494 K** (9,6 °C). Aucune valeur inventée.
- Fichier : `pipelines/era5/extracts/grenoble-1983-05-12.json`. SHA-256 `bc400068cf019e64cebd974445af9a49a551339527613d4af388515affa15afb`. `method_version=era5-point-nearest-hourly-2t-minmax-v1`. `dataset_version=ERA5` (pas ERA5T).
- Import : 3 lignes `point_extractions` (min / max / mean). SQLite gitignorée. Pas de grille France, pas de téléchargement mondial.

## 2026-09-06 (normales 1991-2020)

- Dérivé uniquement des `annual_statistics` déjà calculées (observations Météo-France quotidien bulk, département 38). Aucune valeur inventée, pas de second téléchargement.
- Table `station_normals`, période **1991-2020**. Affichable si ≥ 24 années climatiques (80 % de 30 ans). Pluie moyenne seulement si ≥ 24 années à précipitation complète (sinon `NULL`).
- Recalcul `npm run stats:compute` : 141 lignes, **16 normales affichables**. `method_version=precompute-v2`.
- Grenoble-LVD : 21 années sur 1991-2020 → pas une normale 1991-2020. CHATTE_SAPC : 29 années, affichable.
- Une page vue ne lance pas ce job.

## 2026-09-06 (stats mois / saisons `precompute-v2`)

- Dérivé uniquement des observations déjà importées (Météo-France quotidien bulk, département 38). Aucune valeur inventée.
- Tables `monthly_statistics` et `seasonal_statistics` ajoutées. Recalcul `npm run stats:compute` : 3976 années-station (1657 complètes), 40754 mois-station (23143 complets), 14149 saisons-station (7190 complètes), 49926 jours de l’année. `method_version=precompute-v2`.
- Mois complet ≥ 25 jours Tmin **et** Tmax. Saison complète ≥ 75 jours. Pluie stockée seulement si le seuil de jours connus est atteint (sinon `NULL`, jamais 0).
- Saisons météorologiques nord : DJF (décembre compte pour l’hiver suivant) / MAM / JJA / SON.
- Une page vue ne lance pas ce job.

## 2026-09-06 (base locale / anti-ban)

- Ingestion **local-first** : les prochains téléchargements Météo-France iront dans `raw/meteo-france/quotidiennes/` et ne seront plus retéléchargés. Snapshot communes déjà prévu dans `raw/geo-api-gouv/`.
- Catalogue data.gouv et référentiel communes versionnés par checksum. `--refresh` n’efface rien.
- Tuiles IGN : cache disque `data/tiles/ign/` des tuiles **déjà affichées** (LO 2.0, extraits d’affichage, pas d’extract massif du département).
- L’endpoint `/api/import` du dashboard est **offline** par défaut (pas de data.gouv depuis l’UI).
- Aucune donnée météo nouvelle : même slice Isère 1 208 439 observations.

## 2026-09-06 (stats précalculées)

- Dérivé uniquement des observations déjà importées (Météo-France quotidien bulk, département 38). Aucune valeur inventée.
- Tables `annual_statistics` et `day_of_year_statistics`, `method_version=precompute-v1`.
- Année climatique complète = au moins 330 jours avec Tmin **et** Tmax connus. Pluie annuelle stockée seulement si ≥ 330 jours de précipitation connus (sinon `NULL`, jamais 0 de substitution).
- Recalcul : `npm run stats:compute` (preuve 2026-09-06 : 3976 années-station, 1657 années complètes, 49926 jours de l’année). Une page vue ne lance pas ce job.

## 2026-09-06 (communes Isère)

- Import référentiel **512 communes** du département 38 via `https://geo.api.gouv.fr/departements/38/communes` (centres WGS-84 uniquement, pas de contours).
- `source_id=etalab.geo-api.communes`, Licence Ouverte 2.0. SHA-256 `b4cecd40c1a9f81d13e8ad3f0d2db2c747e3053f0e0f0e1f345fe90d229f2469`.
- Grenoble / Crolles / La Pierre : lat/lon/altitude du slice conservés (pas remplacés par le centroïde API).

## 2026-09-06 (constitution définitive)

- Collage PROMPT MAÎTRE V2 confirmé comme constitution **déjà présente** dans [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md) (sections 0–187). Aucune donnée ERA5 ajoutée.

## 2026-09-06 (recentrage V1)

- Recentrage produit : V1 = France grand public historique. Audit KEEP/ADAPT/PARK/REMOVE : [docs/V1_FRANCE_REFOCUS_AUDIT.md](docs/V1_FRANCE_REFOCUS_AUDIT.md). Aucune donnée ni pipeline supprimé. ERA5 / NOAA / CMEMS toujours non ingérés.
- Roadmap mondiale copiée vers [docs/roadmap-archive/GLOBAL_VISION.md](docs/roadmap-archive/GLOBAL_VISION.md). Roadmap active : phases R0–R14.
- Accueil : recherche communes seed (Grenoble, Crolles, La Pierre). API `GET /api/v1/search`. URL `/meteo/{région}/{département}/{commune}`. Labels publics « Mesure officielle » / « Estimation climatique ».

## 2026-09-06 (soir)

- Constitution figée **mot pour mot** : [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md). Index anti-oubli 0–187 : [docs/PROMPT_INDEX.md](docs/PROMPT_INDEX.md). Skills `00-prompt-maitre` + `00-track-development` lus à chaque prompt.
- Accueil visuel (héros Terre) + pages lieu avec carte IGN Géoplateforme (orthophoto / plan) et heatmap annuelle.
- Les visuels d’ambiance (`public/images/hero-earth.jpg`, `origin-*.jpg`) sont des illustrations de marque, **pas** des photos du lieu.
- Extraits UI IGN WMS dans `public/images/places/{grenoble,crolles,la-pierre}.jpg` (affichage, pas extract massif). Attribution : © IGN — Géoplateforme.

- Phase 0 : création du registre licences / sources.
- Import réel Isère (38), Météo-France quotidien bulk, 1980-01-01 → 2026-09-04 : **1 208 439** observations, 4 fichiers, checksum SHA-256, `origin_type=OBSERVED`.
- Preuve Grenoble 1983-05-12 : station `38126001` CORENC LA REVIREE, Tmin 6.6 °C, Tmax 21.6 °C, RR 0.1 mm (unité telle que publiée). ERA5 non ingéré (aucune valeur inventée).
