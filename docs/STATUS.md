# Avancement — Observatoire Planète

**Date de revue :** 2026-09-07 (ERA5 vent 10 m + MSL Grenoble)  
**Constitution définitive :** [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) — mot pour mot, sections 0–187.  
**Livraison V1 :** [V1_FRANCE_REFOCUS.md](./V1_FRANCE_REFOCUS.md) + [ROADMAP.md](./ROADMAP.md).  
**Stack cible :** [ARCHITECTURE_PRODUCTION.md](./ARCHITECTURE_PRODUCTION.md) — [ADR-0002](./adr/ADR-0002-production-stack-v1.md). Runtime encore SQLite.

Les fournisseurs sont des **sources**, jamais des partenaires.

---

## En une phrase

Le parcours **Isère → Météo-France → Grenoble → 1983-05-12 → ERA5 point (2t + rosée + pluie + vent 10 m + MSL) → comparaison sans fusion → provenance → confiance** est livré. Vent ERA5 **8,8 km/h**, d’où il vient **169°**. MSL **1005 hPa**. LCP lab **2535 ms** — pas un pass Core Web Vitals.

## Prochaine action

1. **Science / R9 remainder :** SP / neige / SSRD / rafale non extraits. Quotidien France encore **un jour** 2t (pas 1940–2026).  
2. **Produit :** LCP lab encore **2535 ms** (seuil 2500 ms) ; pas de CDN tant que le besoin n’est pas démontré.

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
| R9 ERA5 | **Partiel** | point Grenoble 2t + d2m + TP + 10u/v + MSL 1983-05-12 ; quotidien 2t bbox France un jour (JSON) ; pas SP/neige/SSRD, pas 1940–2026 |
| R11 SEO | **Fait (Isère)** | titres + sitemap filtré + OG + hreflang fr/x-default + JSON-LD + `seo-content-v1` ; pas de pages en |
| R12 mobile | **Partiel** | 390 px ; HTML initial 56 Ko sans mois/saisons/chaleur ; Lighthouse lab LCP 2535 ms ; pas CDN, pas CrUX |
| PoC 1 ERA5 | **Fait** | `point_extractions` = 10 |

## Preuve statistiques `precompute-v2`

Recalcul `npm run stats:compute` (2026-09-06) : 3976 années-station (1657 complètes), 40754 mois-station (23143 complets), 14149 saisons-station (7190 complètes), **141 normales / 16 affichables** (≥ 24 années 1991-2020), 49926 jours de l’année. Une page vue ne lance pas ce job.

Seuils : année 330 j ; mois 25 j ; saison 75 j ; normale 24 années climatiques. Pluie incomplète = `NULL`, jamais 0.

## Preuve Grenoble

- Jour : CORENC LA REVIREE (`38126001`), 6,6 / 21,6 °C, 0,1 mm (1983-05-12), 4,7 km, Δz 15 m.
- Estimation climatique ERA5 (réanalyse, pas une mesure) : maille **45,25°N, 5,75°E**, 24 h UTC. `2m_temperature` min/max **3,4 / 14,2 °C** (276,5640 / 287,3429 K, inchangés). Point de rosée `2m_dewpoint_temperature` min/max **2,0 / 6,9 °C** (275,1994 / 280,0102 K). Pluie `total_precipitation` : somme 24 h UTC **0,0003234409 m** → **0,3 mm** (CORENC 0,1 mm, écart **+0,2 mm**, pas une fusion). Vent 10 m : moyenne des hypot(u,v) **2,4516 m/s** → **8,8 km/h**, d’où il vient **169°** (moyenne vectorielle, pas un anémomètre). MSL moyenne 24 h **100523,66 Pa** → **1005 hPa** (pas la pression au sol). Accès ARCO, DOI 10.24381/cds.adbb2d47, SHA-256 `63cb522f6e9a5c2e18b07e70d52d4c96eb9170a19ccbec1b3c6bfb6e66d4331f`. `method_version=era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-v1`. Rosée, pluie, vent et MSL derrière « En savoir plus ». Pas dans le JSON-LD.
- Quotidien 2t bbox France **1983-05-12 seulement** : 2709 mailles, SHA-256 `9c7b9a9836b23b1252d09b3c410f96cbe5ccd61558b59c92f19b8f3fbfb1cbe2`. Maille Grenoble = mêmes Kelvin. Pas importé en SQL. Chunks ARCO = 1 h × globe.
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
- Ce jour (CORENC, 8 × 12 mai) : maximale moyenne **21,6 °C**, minimale moyenne **7,3 °C**, plus chaude que **50 %**. Records 5,1 °C (1982) / 32,1 °C (1986). Pas une normale climatique.
- Page commune 390×844 : nav horizontale défilable, date + partage en colonne, Tmin/Tmax puis carte IGN, cibles ≥ 44 px. Desktop inchangé (carte toujours au-dessus du récit). Pas de bottom sheet.
- Accueil / naissance / comparer 390×844 : recherche et CTA pleine largeur, 1 colonne, overflow-x absent, cibles ≥ 44 px. Comparer Grenoble vs Voiron : LVD vs COUBLEVIE, 21 années, écarts inchangés.
- Graphiques commune : Recharts **et** MapLibre chargés seulement près du viewport (`DeferInView`). HTML initial Grenoble naissance : placeholder « Carte IGN… », **sans** `maplibre` / `recharts` dans le premier HTML. Après scroll : Photo IGN + pins CORENC.
- Cache Next `unstable_cache` 1 h : accueil + sitemap **517** URL + historique d’un jour + climat annuel (page : **sans** mois / saisons / chaleur, `commune-yearly-page-v2`, `detailRows: false`) + enfance. HTML Grenoble 1983-05-12 : **56 Ko** (avant 78 Ko), jour CORENC 6,6 / 21,6 °C, climat LVD 2025 · 901,1 mm. Les détails se chargent à l’approche de `#mois` (`GET /yearly` complet). Un payload chaleur vide n’affiche pas « aucun épisode » : texte de chargement jusqu’à l’API. Date 1900-01-01 : aucune mesure inventée.
- Lighthouse **13.4.1** mobile, `next start` :3002, Grenoble `?date=1983-05-12`, 2026-09-06T22:26Z : performance **0,97** ; FCP **0,9 s** ; LCP **2,5 s** (**2535 ms**, score 0,89) ; TBT **22 ms** ; CLS **0**. HTML plus léger, LCP lab pas sous 2500 ms. Lab localhost, pas CrUX. Case Core Web Vitals **non** cochée.

Ville vs ville (preuve 2026-09-06) :

- Grenoble vs Crolles / La Pierre : **même poste GRENOBLE - LVD** → aucun écart affiché.
- Grenoble vs Voiron : LVD vs **COUBLEVIE**, 21 années climatiques 2005–2025. Max. moyenne 18,5 → 18,2 °C (−0,3) ; min. 7,3 → 8,4 °C (+1,1) ; pluie 980,8 → 1117,6 mm. Pas de normale 1991-2020 (LVD n’a que 21 ans sur la période).

Tests : `npm run test:science`. Pages : `/meteo/auvergne-rhone-alpes/isere/grenoble?date=1983-05-12` (CORENC 6,6 / 21,6 °C, ERA5 3,4 / 14,2 °C, rosée 2,0 / 6,9 °C, pluie 0,3 mm, vent 8,8 km/h / 169°, MSL 1005 hPa dans En savoir plus) · `?date=1900-01-01` · `/` · `/naissance` · `/comparer?a=38185&b=38563`.

## Runtime

| Élément | Valeur |
|---|---|
| Communes | 512 (Isère) |
| Observations | 1 208 439 |
| ERA5 | 10 points (Grenoble 1983-05-12, 2t + d2m min/max/mean + pluie + vent + MSL) |
| method_version stats | precompute-v2 |
| method_version ERA5 | era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-v1 |
| method_version normale mensuelle | month-normal-1991-2020-v1 |
| method_version SEO | seo-content-v1 |
| Normales 1991-2020 affichables | 16 postes (annuel et profil mensuel 12/12) |
