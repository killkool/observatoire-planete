# Avancement — Observatoire Planète

**Date de revue :** 2026-09-07 (héros = mesure officielle, LCP lab 2168 ms)  
**Constitution définitive :** [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) — mot pour mot, sections 0–187.  
**Livraison V1 :** [V1_FRANCE_REFOCUS.md](./V1_FRANCE_REFOCUS.md) + [ROADMAP.md](./ROADMAP.md).  
**Stack cible :** [ARCHITECTURE_PRODUCTION.md](./ARCHITECTURE_PRODUCTION.md) — [ADR-0002](./adr/ADR-0002-production-stack-v1.md). Runtime encore SQLite.

Les fournisseurs sont des **sources**, jamais des partenaires.

---

## En une phrase

Le parcours **Isère → Météo-France → Grenoble → 1983-05-12 → ERA5 point (2t + rosée + pluie + vent 10 m + MSL + SP + neige SWE + SSRD + rafale) → comparaison sans fusion → provenance → confiance** est livré. Même point **5 jours** (12 mai 1982 et 1986, 11–13 mai 1983 ; 70 lignes SQL). Quotidien 2t bbox France : **3 jours** (2709 mailles JSON, pas SQL). Heatmap « ce jour » : liens `?date=`. Héros = Tmin/Tmax officiels (pas de photo IGN, pas d’ERA5). LCP lab **2168 ms**.

## Prochaine action

1. **Science / R9 remainder :** point Grenoble = **5 jours**, quotidien France 2t = **3 jours**, pas 1940–2026. Pas d’import SQL de la grille.  
2. **Produit :** LCP lab **2168 ms** (seuil 2500 ms tenu en lab localhost) ; pas CrUX, pas de CDN ; case Core Web Vitals **non** cochée.

Ne pas : E-OBS, ERA5 mondial, océan, extract massif IGN, migrer vers un faux Supabase, déclencher un import à la page vue.

## File d’exécution

| Phase | Statut | Preuve |
|---|---|---|
| R2 communes Isère | **Fait (38 seulement)** | 512 communes |
| R3 Isère obs | **Fait** | 1 208 439 obs |
| R4 climat annuel | **Fait** | yearly API + graphique |
| R6 naissance | **Fait** | `/naissance` + enfance + OG PNG + ce jour (moyenne ≥ 5 ans) ; pas de SDK social |
| R7 mois/saisons/normales | **Partiel** | mois + 4 saisons + normale annuelle et mensuelle 1991-2020 + épisodes Tmax ; pas d’anomalies LSH, pas de canicule officielle |
| R8 comparateur | **Partiel** | année vs année + saison vs **même** saison + ville vs ville Isère ; pas hiver vs été, pas France entière |
| R9 ERA5 | **Partiel** | point Grenoble toutes variables essentielles **5 jours** (12 mai 1982/1986 + 11–13 mai 1983) ; quotidien 2t bbox France **3 jours** (JSON) ; pas 1940–2026 |
| R11 SEO | **Fait (Isère)** | titres + sitemap filtré + OG + hreflang fr/x-default + JSON-LD + `seo-content-v1` ; pas de pages en |
| R12 mobile | **Partiel** | 390 px ; HTML initial 56 Ko ; héros = mesure officielle sans photo IGN ; Lighthouse lab LCP 2168 ms ; pas CDN, pas CrUX |
| PoC 1 ERA5 | **Fait** | `point_extractions` = 70 |

## Preuve statistiques `precompute-v2`

Recalcul `npm run stats:compute` (2026-09-06) : 3976 années-station (1657 complètes), 40754 mois-station (23143 complets), 14149 saisons-station (7190 complètes), **141 normales / 16 affichables** (≥ 24 années 1991-2020), 49926 jours de l’année. Une page vue ne lance pas ce job.

Seuils : année 330 j ; mois 25 j ; saison 75 j ; normale 24 années climatiques. Pluie incomplète = `NULL`, jamais 0.

## Preuve Grenoble

- Jour : CORENC LA REVIREE (`38126001`), 6,6 / 21,6 °C, 0,1 mm (1983-05-12), 4,7 km, Δz 15 m.
- Estimation climatique ERA5 (réanalyse, pas une mesure) : maille **45,25°N, 5,75°E**, 24 h UTC. `2m_temperature` min/max **3,4 / 14,2 °C** (276,5640 / 287,3429 K, inchangés). Point de rosée `2m_dewpoint_temperature` min/max **2,0 / 6,9 °C** (275,1994 / 280,0102 K). Pluie `total_precipitation` : somme 24 h UTC **0,0003234409 m** → **0,3 mm** (CORENC 0,1 mm, écart **+0,2 mm**, pas une fusion). Vent 10 m : moyenne des hypot(u,v) **2,4516 m/s** → **8,8 km/h**, d’où il vient **169°** (moyenne vectorielle, pas un anémomètre). MSL moyenne 24 h **100523,66 Pa** → **1005 hPa**. SP moyenne 24 h **89517,36 Pa** → **895 hPa** (orographie modèle **985,5 m**, pas Grenoble 212 m). Neige `snow_depth` moyenne **0,027251 m** d’équivalent en eau → **27,3 mm d’eau** (pas une hauteur en ville). SSRD somme 24 h **20768388,375 J m⁻²** → **20,8 MJ/m²**. Rafale max `instantaneous_10m_wind_gust` **19,2916 m/s** → **69,4 km/h** (pas une rafale officielle). Accès ARCO, DOI 10.24381/cds.adbb2d47, SHA-256 `eece40036986b49aaab3e70d9e53ec8ae7fcfc1af8110ab5fa39b96d44062e82`. `method_version=era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1`. Détail derrière « En savoir plus ». Pas dans le JSON-LD.
- Même point **1983-05-11** : 2t **4,3 / 10,6 °C** (277,4869 / 283,7463 K = quotidien France). Rosée **2,5 / 5,3 °C**. Pluie **3,6 mm** vs CORENC **0,1 mm** (écart **+3,5 mm**). Vent **7,4 km/h**, 165°. MSL **1004 hPa**, SP **893 hPa**, neige **30,8 mm d’eau**, SSRD **12,3 MJ/m²** (9 h ARCO à −0,25 J m⁻² ramenées à 0 avant somme), rafale **62,9 km/h**. SHA-256 `4cd8ca90234fe597aae3eaa3584a39431972151d894b40b57c0367bbb602e14d`. Écart 2t : Tmin **−3,8 °C**, Tmax **−5,7 °C**. Pas fusionné, pas JSON-LD.
- Même point **1983-05-13** : 2t **6,5 / 13,4 °C** (279,6589 / 286,5999 K = quotidien France). Rosée **4,6 / 8,5 °C**. Pluie **7,2 mm** vs CORENC **2,8 mm** (écart **+4,4 mm**). Vent **3,8 km/h**, 166°. MSL **1011 hPa**, SP **900 hPa**, neige **21,1 mm d’eau**, SSRD **18,4 MJ/m²**, rafale **60,0 km/h**. SHA-256 `c8173bd130bb9b7ebc0a2fa874e0ccb1045d3b8c335a0c9b38baf37a219255f7`. Écart 2t : Tmin **−8,3 °C**, Tmax **−2,7 °C** (grand écart affiché, pas fusionné, pas de bonus d’indépendance). Pas JSON-LD.
- Même point **1982-05-12** (record de froid CORENC du 12 mai) : mesure **5,1 / 26,1 °C**, 0 mm. ERA5 **2,8 / 18,6 °C** (275,9109 / 291,7585 K), pluie affichée **0,0 mm** (0,0375 mm avant arrondi), écart 2t **−2,3 / −7,5 °C**. SHA-256 `cdca84c352a45e87b5832a70240dd8a0edd88be4c30ef1a33afe519ada59e31e`. Pas fusionné, pas JSON-LD.
- Même point **1986-05-12** (record de chaleur CORENC du 12 mai) : mesure **11,6 / 32,1 °C**, 0 mm. ERA5 **8,6 / 22,2 °C** (281,7421 / 295,3950 K), pluie **2,1 mm** vs 0 mm, écart 2t **−3,0 / −9,9 °C**. SWE modèle **56,0 mm d’eau** (maille 985,5 m, pas la ville). SHA-256 `ce1f615b413ec682db9fb5313b14a0b3a4d7cfece0df2bd486b2a973958cd951`. Grand écart affiché, pas fusionné, pas JSON-LD.
- Quotidien 2t bbox France **3 jours** (11–13 mai 1983) : 2709 mailles / jour, JSON hors SQL. Preuve 12 mai SHA-256 `9c7b9a9836b23b1252d09b3c410f96cbe5ccd61558b59c92f19b8f3fbfb1cbe2` (inchangée). 11 mai maille Grenoble **4,3 / 10,6 °C** (277,4869 / 283,7463 K). 13 mai **6,5 / 13,4 °C** (279,6589 / 286,5999 K). Index `france-2t-daily-index.json`. Pas 1940–2026. Chunks ARCO = 1 h × globe.
- Écart estimation − mesure : Tmin **−3,2 °C**, Tmax **−7,4 °C**. Pas de fusion, pas de correction d’altitude. ERA5 n’est pas une confirmation indépendante.
- Confiance `confidence-v1-draft` : **90**/100 (observé + distance + Δz + couverture). Pas de bonus d’indépendance ERA5. Pas de bonus de cohérence (|ΔTmax| > 2 °C).
- Série annuelle / étés / records d’année : **GRENOBLE - LVD** (10,2 km, 26 années 2000–2025). Année la plus chaude **2022** (max. moyenne 20,2 °C), la plus froide **2005** (min. moyenne 6,2 °C), la plus arrosée **2001** (1182,2 mm). Observé sur ce poste, pas ERA5.
- Normale 1991-2020 : LVD n’a que **21** années climatiques sur 1991-2020 → **pas** une normale 1991-2020. Normale affichée : **CHATTE_SAPC** (33,2 km, 29 ans) 6,6 / 17,6 °C, 970,1 mm. **Pas d’anomalie** sur le graphique LVD.
- Tendance (LVD, 26 années climatiques 2000–2025, `ols-complete-years-v1`, série brute) : max. **+0,8 °C / 10 ans**, min. **+0,6 °C / 10 ans**, jours ≥ 30 °C **+9,5 / 10 ans**, gel **−9,6 / 10 ans**, nuits tropicales **+1,6 / 10 ans**. Fenêtres 2000–2009 vs 2016–2025 : max. 17,9 → 19,1 °C (+1,2). Série courte (< 30 ans). Pas une expertise certifiée.
- Mois (LVD, 327 mois complets, 26 années 2000–2025 avec 12 mois) : plus chaud **août 2003** (max. moyenne 33,5 °C), plus froid **janvier 2017** (min. moyenne −5,8 °C), plus arrosé **mars 2001** (249 mm). Observé sur ce poste, pas le record de la commune.
- Normale mensuelle 1991-2020 (`month-normal-1991-2020-v1`) : LVD a 21–22 mois complets par calendrier → **pas** une normale LVD. Profil affiché : **CHATTE_SAPC** (33,2 km, 29–30 mois). Janvier −0,5 / 7,2 °C, 66,4 mm ; mai 9,1 / 21,2 °C, 95,8 mm ; juillet **14,3 / 28,3 °C**, 68,3 mm. Pas de pointillés ni d’anomalie sur le graphique LVD.
- Hivers DJF (LVD, 27 hivers complets 2000–2026) : plus froid **2017**, min. moyenne **−2,9 °C**. Décembre compte pour l’hiver suivant. Pas une comparaison hiver vs été.
- Épisodes Tmax (LVD, `heat-streak-tmax-v1`, pas une canicule officielle) : 131 épisodes ≥ 30 °C (856 j). Plus long **43 j** du 13 juin au 25 juillet 2026 (max. moyenne 33,9 °C, pic 38,3 °C). Plus chaud **1–17 août 2003** (max. moyenne 36,2 °C, pic 39,5 °C). ≥ 35 °C : plus long **12 j** du 3 au 14 août 2003. Aucun épisode de 3 jours ≥ 40 °C. Observé sur ce poste, série jusqu’au 4 septembre 2026.
- Carte de partage : `/og/grenoble/1983-05-12` → PNG. Date sans mesure : `/og/grenoble/1900-01-01` → PNG « aucune mesure officielle », pas de 0 inventé. Pas d’ERA5 sur la carte.
- SEO page commune : canonical + hreflang `fr` / `x-default` vers `/meteo/auvergne-rhone-alpes/isere/grenoble`. JSON-LD `City` INSEE **38185**, geo 45,1885 / 5,7245. Pour `?date=1983-05-12` : `WeatherObservation` CORENC 6,6 / 21,6 °C, 0,1 mm. Pas d’ERA5 dans le graphe.
- `seo_content_score` `seo-content-v1` : Grenoble **100**/100 (identité + **26** années climatiques LVD `38538002` + historique observé). Sitemap Isère : **512 / 512** indexables — chaque commune a une station climatique proche avec ≥ 10 années, ce n’est pas un `true` forcé. Une coquille sans mesure ni série annuelle n’entre pas (`noindex`). ERA5 ne compte pas.
- Ce jour (CORENC, 8 × 12 mai) : maximale moyenne **21,6 °C**, minimale moyenne **7,3 °C**, plus chaude que **50 %**. Records 5,1 °C (1982) / 32,1 °C (1986). Heatmap : liens `?date=` (`prefetch` off). Depuis `?date=1986-05-12`, ouvrir 1982 affiche CORENC **5,1 / 26,1 °C** et ERA5 **2,8 / 18,6 °C**. Pas une normale climatique.
- Page commune 390×844 : nav horizontale défilable, date + partage en colonne, **Tmin/Tmax dans le héros** (mesure officielle seulement), puis récit et carte IGN, cibles ≥ 44 px. Desktop : carte toujours au-dessus du récit. Pas de photo IGN dans le héros (elle reste dans la carte au scroll). Pas de bottom sheet.
- Accueil / naissance / comparer 390×844 : recherche et CTA pleine largeur, 1 colonne, overflow-x absent, cibles ≥ 44 px. Comparer Grenoble vs Voiron : LVD vs COUBLEVIE, 21 années, écarts inchangés.
- Graphiques commune : Recharts **et** MapLibre chargés seulement près du viewport (`DeferInView`). HTML initial Grenoble naissance : placeholder « Carte IGN… », **sans** `maplibre` / `recharts` dans le premier HTML. Après scroll : Photo IGN + pins CORENC.
- Cache Next `unstable_cache` 1 h : accueil + sitemap **517** URL + historique d’un jour + climat annuel (page : **sans** mois / saisons / chaleur, `commune-yearly-page-v2`, `detailRows: false`) + enfance. HTML Grenoble 1983-05-12 : **56 Ko** (avant 78 Ko), jour CORENC 6,6 / 21,6 °C, climat LVD 2025 · 901,1 mm. Les détails se chargent à l’approche de `#mois` (`GET /yearly` complet). Un payload chaleur vide n’affiche pas « aucun épisode » : texte de chargement jusqu’à l’API. Date 1900-01-01 : aucune mesure inventée.
- Lighthouse **13.4.1** mobile, `next start` :3002, Grenoble `?date=1983-05-12`, 2026-09-07T00:39Z : performance **0,99** ; FCP **0,9 s** ; LCP **2,2 s** (**2168 ms**, score 0,95) ; TBT **13 ms** ; CLS **0**. Héros sans JPEG IGN : la mesure officielle **6,6 / 21,6 °C** est dans le HTML. Date 1900-01-01 : héros « aucune mesure officielle », pas de 0 inventé. Lab localhost, pas CrUX. Case Core Web Vitals **non** cochée. Tentative héros WebP hors optimizer (2779 ms) restée revertie.

Ville vs ville (preuve 2026-09-06) :

- Grenoble vs Crolles / La Pierre : **même poste GRENOBLE - LVD** → aucun écart affiché.
- Grenoble vs Voiron : LVD vs **COUBLEVIE**, 21 années climatiques 2005–2025. Max. moyenne 18,5 → 18,2 °C (−0,3) ; min. 7,3 → 8,4 °C (+1,1) ; pluie 980,8 → 1117,6 mm. Pas de normale 1991-2020 (LVD n’a que 21 ans sur la période).

Tests : `npm run test:science`. Pages : `/meteo/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12` (héros Minimale 6.6 °C / Maximale 21.6 °C, pas d’ERA5) · `?date=1983-05-11` · `?date=1983-05-13` · `?date=1982-05-12` · `?date=1986-05-12` · heatmap 1986 → lien 1982 · `?date=1900-01-01` (héros : aucune mesure officielle) · `/` · `/naissance` · `/comparer?a=38185&b=38563`.

## Runtime

| Élément | Valeur |
|---|---|
| Communes | 512 (Isère) |
| Observations | 1 208 439 |
| ERA5 | 70 points (Grenoble 12 mai 1982/1986 + 11–13 mai 1983, 14 variables × 5) |
| method_version stats | precompute-v2 |
| method_version ERA5 | era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1 |
| method_version normale mensuelle | month-normal-1991-2020-v1 |
| method_version SEO | seo-content-v1 |
| Normales 1991-2020 affichables | 16 postes (annuel et profil mensuel 12/12) |
