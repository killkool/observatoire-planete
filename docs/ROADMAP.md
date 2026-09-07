# Roadmap — Observatoire Planète (V1 France)

Nom de travail. Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF, IGN) sont des **sources**, jamais des partenaires.

**Produit actif (livraison) :** moteur de recherche de l’histoire météo de la **France**, grand public.  
**Constitution définitive (vision) :** [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) mot pour mot, sections 0–187.  
**Séquençage V1 :** [V1_FRANCE_REFOCUS.md](./V1_FRANCE_REFOCUS.md) · audit : [V1_FRANCE_REFOCUS_AUDIT.md](./V1_FRANCE_REFOCUS_AUDIT.md)  
**Stack cible :** [ARCHITECTURE_PRODUCTION.md](./ARCHITECTURE_PRODUCTION.md) (ADR-0002)  
**Monde / océan / API (PARK) :** [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md) · archive : [roadmap-archive/GLOBAL_VISION.md](./roadmap-archive/GLOBAL_VISION.md)

**Priorité :** utilité → simplicité → fiabilité → rapidité → beauté → complexité technique.  
Les cases `[x]` = livré **et** vérifié (preuve). Un fichier vide ne compte pas.

Dernière mise à jour : 2026-09-07 (année climatique canonique = jours de pluie observés, 144 j LVD 2025). Tableau : [STATUS.md](./STATUS.md).

---

## File d’exécution immédiate

1. [x] Phase R0 — audit du projet actuel ([V1_FRANCE_REFOCUS_AUDIT.md](./V1_FRANCE_REFOCUS_AUDIT.md))
2. [x] Phase R1 — docs + roadmap + archive vision mondiale (ce fichier)
3. [x] Phase R1 suite — accueil recherche + langage grand public + flags de scope
4. [x] **PoC 1 / R9 anticipé** — ERA5 point Grenoble 1983-05-12 (JSON ARCO réel, aucune invention). `point_extractions` = 3
5. [x] Phase R2 — communes **Isère** (512, geo.api.gouv.fr, centres officiels). France entière encore ouverte
6. [x] Phase R3 — Isère pilote (obs + 512 communes)
7. [x] Phase R4 — page commune (climat annuel + comparateur d’années complètes). Records d’année = R7
8. [x] Phase R6 — jour de naissance + enfance (moyennes d’années complètes, un seul poste). Réseaux sociaux ouverts
9. [x] Phase R8 — ville vs ville Isère (`/comparer`, même poste = pas d’écart)
10. [x] Phase R6 suite — ma ville se réchauffe-t-elle (OLS, un poste, ≥ 15 années climatiques)
11. [x] Phase R7 suite — mois à l’écran (seuil 25 j) + SEO titres/sitemap Isère
12. [x] Phase R7/R6 — quatre saisons à l’écran + carte PNG `/og/{slug}/{date}`
13. [x] Phase R7 — épisodes de forte chaleur (Tmax consécutives, un poste ; pas canicule officielle)
14. [x] Phase R6 — ce jour dans l’histoire (moyenne + percentile + records, un poste)
15. [x] Phase R7 — normale mensuelle 1991-2020 (≥ 24 mois complets / calendrier, un poste)
16. [x] Phase R11 — hreflang `fr` + `x-default` + JSON-LD lieu/mesure (pas de pages `en`)
17. [x] Phase R11 — `seo_content_score` réel au sitemap (seuil 50, pas un scorer éditorial)
18. [x] Phase R12 — page commune lisible au doigt (stack météo → carte, cibles 44 px ; pas de bottom sheet GIS)
19. [x] Phase R12 suite — accueil / naissance / comparer 390 px ; Recharts à la demande ; cache 1 h accueil+sitemap (pas CDN, pas CWV mesuré)
20. [x] Phase R12 suite — mesure du jour dans le HTML initial (plus de waterfall `/api/v1/history` pour le premier écran)
21. [x] Phase R12 suite — climat annuel dans le HTML initial ; date sans poste ≠ import manquant
22. [x] Phase R12 suite — MapLibre/Recharts hors écran ; enfance dans le HTML ; Lighthouse lab localhost (LCP 3,0 s, pas un pass)
23. [x] Phase R12 suite — JPEG des visuels déjà présents (pas une nouvelle photo) ; héros `decoding=sync` ; LCP lab 2523 ms
24. [x] Phase R12 suite — premier HTML sans les mois-station (78 Ko) ; `/yearly` complet près de `#mois` ; LCP lab 2508 ms
25. [x] Phase R12 suite — HTML sans saisons ni chaleur (56 Ko) ; `detailRows` ; héros IGN q=60 ; LCP lab 2535 ms
26. [x] Phase R9 suite — point de rosée ERA5 Grenoble 1983-05-12 (2,0 / 6,9 °C) ; bbox France ; 2t inchangé
27. [x] Phase R9 suite — pluie ERA5 Grenoble 1983-05-12 (0,3 mm, pas fusionnée) ; quotidien 2t bbox France un jour (2709 mailles, pas SQL)
28. [x] Phase R9 suite — vent 10 m ERA5 Grenoble 1983-05-12 (8,8 km/h, 169°, dérivé u/v) et MSL 1005 hPa ; pas une mesure
29. [x] Phase R9 suite — SP 895 hPa (maille 985,5 m), neige 27,3 mm d’eau, SSRD 20,8 MJ/m², rafale 69,4 km/h ; pas fusionné, pas JSON-LD
30. [x] Phase R9 suite — quotidien 2t bbox France **3 jours** (11–13 mai 1983, 2709 mailles JSON) ; preuve du 12 mai non réécrite ; pas SQL, pas 1940–2026
31. [x] Phase R9 suite — point Grenoble **11 et 13 mai 1983** (mêmes 14 variables, maille 45,25 / 5,75) ; 2t = quotidien France ; 12 mai non réécrit ; pas fusionné, pas JSON-LD
32. [x] Phase R9 suite — point Grenoble **12 mai 1982 et 1986** (records CORENC du 12 mai, 5,1 / 32,1 °C) ; même maille ; 1983 non réécrit ; pas fusionné, pas JSON-LD
33. [x] Phase R12 suite — heatmap « ce jour » en liens `?date=` (1986 → 1982 : CORENC 5,1 / 26,1 °C) ; pas de prefetch des 8 années ; LCP lab alors **2535 ms**
34. [x] Phase R12 suite — héros = Tmin/Tmax officiels (pas de photo IGN, pas d’ERA5) ; 1900 sans invention ; Lighthouse lab LCP **2168 ms**
35. [x] Phase R12 suite — héros = pluie officielle + station à X km (1983 : 0,1 mm, CORENC 4,7 km ; 1986 : 0,0 mm ≠ ERA5 2,1 mm) ; LCP lab **2178 ms**
36. [x] Phase R6/R11 suite — récit naissance = pluie officielle + station ; titres `?date=` / `histoire=naissance` = mesure officielle (1983 : 0,1 mm CORENC ; 1986 : 0,0 mm ≠ ERA5 2,1 mm ; 1900 sans invention) ; canonical inchangé
37. [x] Phase R8/R11/R12 — comparer : HTML initial + titres = stations officielles (Grenoble vs Voiron : 18,5 → 18,2 °C, LVD / COUBLEVIE ; vs Crolles : même station, pas d’écart inventé) ; canonical `/comparer`
38. [x] Phase R1/R4/R12 — accueil : cartes Grenoble / Crolles / La Pierre = dernière année climatique officielle (LVD 2025 · max. 19,6 °C · 901,1 mm · **144 j de pluie** · **110 j ≥ 25 °C** · **57 j ≥ 30 °C** · **15 j ≥ 35 °C** · **0 j ≥ 40 °C** · **46 j de gel** · **5 nuits tropicales**, 10,2 km, pas le record 2022) ; même poste = mêmes chiffres, pas d’écart inventé ; cache `featured-climate-v11`
39. [x] Phase R6/R11/R12 — naissance : exemples Grenoble dans le HTML initial (1983 : 6,6 / 21,6 °C, 0,1 mm, CORENC 4,7 km ; 1986 : 0,0 mm ≠ ERA5 2,1 mm ; 1900 : aucune mesure inventée) ; cache `birth-examples-v1`
40. [x] Phase R8/R11/R12 — comparer sans query : exemples Grenoble vs Voiron (18,5 → 18,2 °C, LVD / COUBLEVIE) et vs Crolles (même station, pas d’écart) dans le HTML initial ; canonical `/comparer` ; cache `compare-examples-v1`
41. [x] Phase R11 — titres commune sans `?date=` = dernière année climatique officielle (Grenoble 2025 · max. 19,6 °C · 901,1 mm, LVD 10,2 km ; pas le record 2022 ; pas le jour CORENC ; canonical inchangé)
42. [x] Phase R11/R12 — héros commune sans query = dernière année climatique officielle (2025 · max. 19,6 °C · 901,1 mm, LVD 10,2 km) ; JSON-LD `WeatherObservation` seulement si `?date=` / naissance ; pas le jour par défaut collé sur 2025
43. [x] Phase R11/R12 — URL canonique : pas d’historique du jour par défaut (heatmap 04/09, 12,8 / 35,4 °C) ; carte OG `/og/climat/grenoble` = 2025 · 19,6 °C · 901,1 mm, LVD 10,2 km, pas le record 2022
44. [x] Phase R6/R11/R12 — année climatique canonique : minimale moyenne officielle (Grenoble 2025 · **8,2 °C**, pas le record 2005 6,2 °C) + maximale 19,6 °C + 901,1 mm ; sélecteur de date vide ; « Partager cette année » copie l’URL sans `?date=` ; OG `/og/climat/grenoble` = min. 8,2 / max. 19,6 °C ; accueil = min. 8,2 °C
45. [x] Phase R6/R11 — cartes OG des landings : `/og/accueil` = exemple Grenoble 2025 (min. 8,2 / max. 19,6 °C, pas Crolles, pas une moyenne France) ; `/og/naissance` = 12 mai 1983 CORENC 6,6 / 21,6 °C, 0,1 mm (pas 1900, pas ERA5 2,1 mm) ; `/og/comparer` = Grenoble vs Voiron 18,5 → 18,2 °C (pas Crolles, pas collé sur `?a=&b=`)
46. [x] Phase R4/R11/R12 — année climatique canonique : jours officiels ≥ 30 °C (Grenoble 2025 · **57 j**, pas le record 2022 **71 j**) dans le héros, l’accueil, la description, le partage et les OG `/og/climat/grenoble` `/og/accueil`
47. [x] Phase R4/R11/R12 — année climatique canonique : jours de gel officiels (Grenoble 2025 · **46 j**, Tmin < 0 °C, pas le record 2005 **94 j**, pas les 57 j de gel 2022) dans le héros, l’accueil, la description, le partage et les OG
48. [x] Phase R4/R11/R12 — année climatique canonique : nuits tropicales officielles (Grenoble 2025 · **5 nuits**, Tmin ≥ 20 °C, pas le record 2024 **7 nuits**) dans le héros, l’accueil, la description, le partage et les OG `/og/climat/grenoble` `/og/accueil`
49. [x] Phase R4/R11/R12 — année climatique canonique : jours officiels ≥ 35 °C (Grenoble 2025 · **15 j**, pas 2022 **18 j**, pas le record 2003 **22 j**) dans le héros, l’accueil, la description, le partage et les OG
50. [x] Phase R4/R11/R12 — année climatique canonique : jours officiels ≥ 25 °C (Grenoble 2025 · **110 j**, pas le record 2018 **135 j**, pas 2022 **126 j**) dans le héros, l’accueil, la description, le partage et les OG
51. [x] Phase R4/R11/R12 — année climatique canonique : jours officiels ≥ 40 °C (Grenoble 2025 · **0 j**, vrai zéro LVD, pas une absence, pas les 8 j d’un autre poste en 2003) dans le héros, l’accueil, la description, le partage et les OG
52. [x] Phase R4/R11/R12 — année climatique canonique : jours de pluie observés (Grenoble 2025 · **144 j**, précipitation mesurée > 0 mm, série pluie complète, pas le record 2001 **210 j**, pas 2014 **205 j**, pas 89 j / 2026 incomplet) dans le héros, l’accueil, la description, le partage et les OG
53. Ne **pas** extraire ERA5 mondial. Ne **pas** activer océan / NOAA / API commerciale. Ne **pas** feindre Vercel/Supabase. Ne **pas** extraire massivement les tuiles IGN.

Héritage déjà vérifié (ne pas recommencer) : licences Phase 0, import Isère 1 208 439 obs, Grenoble 1983-05-12 (CORENC, 6,6 / 21,6 °C), matching station v1, carte IGN, provenance. Runtime encore SQLite. Cible prod : [ARCHITECTURE_PRODUCTION.md](./ARCHITECTURE_PRODUCTION.md).

---

## PHASE R0 — Audit du projet actuel

- [x] analyser repo
- [x] analyser architecture
- [x] analyser DB (SQLite réelle + schéma Postgres cible)
- [x] analyser pipelines (MF réel, ERA5 prêt non ingéré)
- [x] analyser UI
- [x] analyser roadmap
- [x] analyser coûts ([COSTS.md](./COSTS.md) + [V1_DATA_VOLUME.md](./V1_DATA_VOLUME.md))
- [x] classer KEEP / ADAPT / PARK / REMOVE
- [x] produire [V1_FRANCE_REFOCUS_AUDIT.md](./V1_FRANCE_REFOCUS_AUDIT.md)

**Aucune suppression de code métier.** ClickHouse : absent, ne pas l’ajouter.

---

## PHASE R1 — Recentrage

- [x] archiver vision mondiale ([roadmap-archive/GLOBAL_VISION.md](./roadmap-archive/GLOBAL_VISION.md))
- [x] mettre à jour ROADMAP (ce fichier = active)
- [x] mettre à jour README
- [x] mettre à jour ARCHITECTURE
- [x] mettre à jour BUSINESS_MODEL
- [x] mettre à jour DATA_SOURCES
- [x] feature flags `ENABLE_GLOBAL_DATA=false` `ENABLE_OCEAN=false` `ENABLE_GLOBAL_SEARCH=false`
- [x] désactiver l’exposition UI des fonctions hors scope (océan, globe, ERA5 comme cœur)
- [x] recherche sur les communes déjà seedées + accueil grand public

**État :** audit, archive mondiale, README, ARCHITECTURE, flags, accueil recherche (3 communes + climat officiel LVD 2025), labels publics. Référentiel INSEE national = R2.

---

## PHASE R2 — Data France

- [x] communes Isère (512, API Découpage administratif, centres WGS-84, **pas** de contours)
- [ ] communes France entière (ADMIN EXPRESS / COG national)
- [x] département Isère (table `departments`)
- [x] région Auvergne-Rhône-Alpes (table `regions`)
- [ ] autres départements / régions
- [x] stations Météo-France (156 postes Isère issus du bulk)
- [ ] historique station (métadonnées d’ouverture / fermeture officielles, au-delà du min/max d’obs)
- [x] données quotidiennes (département 38)
- [ ] quality flags exposés (présents dans le CSV source, pas encore en UI)

---

## PHASE R3 — Isère pilote

- [x] importer Isère (1 208 439 obs, 1980-01-01 → 2026-09-04)
- [x] Grenoble (preuve 1983-05-12)
- [x] Crolles
- [x] La Pierre
- [x] vérifier historique + qualité NULL ≠ 0
- [x] vérifier station mapping (CORENC vs Galochère)

Reste : France entière (autres départements) en R10. Isère : 512 communes importées.

---

## PHASE R4 — Page commune

- [x] recherche (nom, code postal, INSEE ; 512 communes Isère)
- [x] page Grenoble (adaptée grand public : mesure officielle, station à X km)
- [x] historique date + heatmap « ce jour » (liens `?date=`, pas `router.replace`)
- [x] graphique annuel précalculé (années complètes seulement, une station climatique, pas de concaténation)
- [x] comparateur année vs année (années complètes, même station climatique)
- [x] records du jour (station préférée)
- [x] source + station (« mesures provenant de… à X km »)
- [x] URL `/meteo/{région}/{département}/{commune}` (+ redirect depuis `/weather/france/...`)

**État :** climat annuel + comparateur d’années livrés. Ville vs ville = R8 (Isère). Records d’année observés = R7 (livrés).

---

## PHASE R5 — Date historique

- [x] date picker
- [x] Tmin / Tmax / pluie si disponibles
- [x] comparaison historique (percentile Tmax si ≥ 5 années du même jour-mois ; sinon non affiché)
- [x] records Tmin/Tmax du même jour-mois (station)

---

## PHASE R6 — Fonctions grand public

- [x] jour de ma naissance + partage (copie du texte + URL + carte PNG serveur ; pas de SDK social)
- [x] ce jour dans l’histoire (heatmap en liens `?date=` + moyenne du jour-mois + percentile + records + courbe ; pas une normale)
- [x] quand j’étais enfant (moyenne des années climatiques complètes, un seul poste, fenêtre récente = 10 dernières années civiles ; pas une T quotidienne)
- [x] ma ville se réchauffe-t-elle ? (OLS `ols-complete-years-v1`, un poste, ≥ 15 années climatiques, série brute pas LSH)
- [x] partage social (carte PNG `/og/{slug}/{date}` + `/og/climat/{slug}` + landings `/og/accueil` `/og/naissance` `/og/comparer` ; copie du texte année climatique sans `?date=` ; mesures réelles seulement)

**État :** `/naissance` + page commune `?histoire=naissance` (récit = Tmin/Tmax/pluie officiels + station ; titres date = mesure officielle) + **exemples SSR** 1983 / 1986 / 1900 + carte de partage + « ce jour » (moyenne si ≥ 5 années, pas une normale). Pas de SDK Facebook/Twitter. Pas d’homogénéisation.

---

## PHASE R7 — Statistiques

- [x] mois / saisons / années (mois + DJF/MAM/JJA/SON + annuel à l’écran + normale mensuelle 1991-2020)
- [x] normales (défaut 1991-2020, ≥ 24 années climatiques, même station ; sinon autre poste unique sans anomalie croisée)
- [x] anomalies (année − normale **du même poste** seulement)
- [x] records d’année observés (plus chaude / plus froide / plus arrosée, station + période) ; records jour déjà en R5. Records de **mois** livrés. Épisodes Tmax consécutifs livrés (`heat-streak-tmax-v1`) — **pas** la canicule officielle Météo-France

**État :** quatre saisons à l’écran (seuil 75 j, un poste). Hiver DJF étiqueté par l’année de janvier. Pas de comparaison hiver vs été. Pas de LSH. Pas de canicule officielle. Normale mensuelle 1991-2020 : ≥ 24 mois complets par calendrier, un poste ; LVD Grenoble insuffisant → CHATTE_SAPC sans anomalie croisée.

---

## PHASE R8 — Comparaisons

- [x] ville vs ville (Isère, `GET /api/v1/compare?inseeA=&inseeB=`, `/comparer`)
- [x] année vs année (même commune, années complètes, `GET /api/v1/compare`)
- [x] saison vs saison (même saison météorologique seulement, page commune)

**État :** ville vs ville Isère livrée (HTML initial + titres + **exemples SSR** Voiron / Crolles = stations officielles ; même poste = pas d’écart). Saisons : on ne compare pas un hiver à un été. Pas France entière.

---

## PHASE R9 — ERA5 France

- [x] point Grenoble 1983-05-12 (maille 45,25 / 5,75, 24 h UTC, Kelvin réels)
- [x] comparaison station **sans fusion** (écart affiché, pas de moyenne)
- [x] contrôle de cohérence (ERA5 ≠ confirmation indépendante ; |ΔTmax| 7,4 °C → pas de bonus)
- [x] fallback documenté (« estimation climatique »)
- [ ] subset France (pas mondial)
- [x] variables essentielles au-delà de 2t min/max/mean sur un jour

**État :** point Grenoble **5 jours** (12 mai 1982 et 1986, 11–13 mai 1983), maille 45,25 / 5,75. Preuve 12 mai 1983 inchangée. Records CORENC du 12 mai : 1982 **5,1 / 26,1 °C** vs ERA5 **2,8 / 18,6 °C** ; 1986 **11,6 / 32,1 °C** vs ERA5 **8,6 / 22,2 °C** (ΔTmax **−9,9 °C**, affiché pas fusionné). Quotidien 2t bbox France **3 jours** (2709 mailles JSON). `point_extractions` = 70. Pas 1940–2026, pas d’import SQL de la grille, pas ERA5-Land. **Ne pas inventer.**

---

## PHASE R10 — France complète

- [ ] import national bulk MF
- [ ] quality validation
- [ ] jobs incrémentaux
- [ ] monitoring

---

## PHASE R11 — SEO

- [x] pages communes (contenu réel seulement, Isère)
- [x] métadonnées / sitemap / canonical / carte OG PNG / hreflang `fr` + `x-default` / JSON-LD (City + mesure officielle si OBSERVED)
- [x] `seo_content_score` — seuil 50 au sitemap et `noindex` si sous le seuil ; pas un scorer éditorial

**État :** titres et descriptions issus du nom officiel ; page commune **sans query** = dernière année climatique officielle (Grenoble 2025 · min. 8,2 °C · max. 19,6 °C · 901,1 mm · **144 j de pluie** · **110 j ≥ 25 °C** · **57 j ≥ 30 °C** · **15 j ≥ 35 °C** · **0 j ≥ 40 °C** · **46 j de gel** · **5 nuits tropicales**, LVD 10,2 km, pas le record 2022 **71 j** / **18 j ≥ 35 °C**, pas 2003 **22 j ≥ 35 °C**, pas 2018 **135 j ≥ 25 °C**, pas 2022 **126 j ≥ 25 °C**, pas 2001 **210 j de pluie**, pas 2014 **205 j**, pas le gel 2005 **94 j**, pas les nuits 2024 **7**) dans le titre (max.), le héros (min./max./pluie/jours de pluie/jours ≥ 25 °C/≥ 30 °C/≥ 35 °C/≥ 40 °C/gel/nuits tropicales), la carte OG `/og/climat/grenoble` et le texte de partage (URL sans `?date=`) ; sélecteur de date vide ; pas le jour par défaut dans le HTML ni le JSON-LD ; `?date=` et `histoire=naissance` = mesure officielle (pas ERA5) ; `/naissance` = exemples officiels 1983/1986/1900 dans le HTML + OG `/og/naissance` (1983 CORENC, pas 1900, pas ERA5) ; `/comparer` = exemples officiels Voiron / Crolles dans le HTML, canonical `/comparer`, OG landing `/og/comparer` (Voiron, pas collé sur `?a=&b=`) ; accueil OG `/og/accueil` = exemple Grenoble 2025 (pas Crolles, pas une moyenne France). Sitemap = communes dont le score repose sur l’identité INSEE **et** des années climatiques ou des mesures OBSERVED. Hreflang français seulement. JSON-LD : lieu ; `WeatherObservation` seulement si `?date=` / naissance et mesure OBSERVED ; pas d’ERA5. Pas de millions de coquilles.

---

## PHASE R12 — Mobile / performance

- [x] responsive page commune (stack tactile 650 px : jour → carte → climat ; nav défilable ; cibles ≥ 44 px)
- [x] responsive accueil / naissance / comparer (390 px, 1 colonne, cibles ≥ 44 px, pas d’overflow-x)
- [ ] Core Web Vitals
- [ ] cache Next.js / CDN / vues matérialisées
- [x] cache local tuiles IGN affichées (`data/tiles/ign/`, pas d’extract massif)
- [x] optimisation charts / images (Recharts/MapLibre hors écran ; JPEG des visuels déjà présents ; HTML page sans mois/saisons/chaleur ; héros sans photo IGN ; LCP lab **2178 ms**, pas CrUX)
- [x] HTML initial de la page commune = mesure du jour (SSR `getPlaceHistory`, pas d’attente API pour Tmin/Tmax)
- [x] HTML initial = climat annuel (SSR `getCommuneYearly`) ; date sans observation ≠ « import manquant »
- [x] HTML initial = enfance si `histoire=naissance` (SSR `getCommuneChildhood`)
- [x] HTML initial = ville vs ville si `?a=&b=` (SSR `getCommuneCityCompare` ; même poste = pas d’écart)
- [x] HTML initial accueil = dernière année climatique officielle (cartes Grenoble / Crolles / La Pierre, LVD 2025 · 19,6 °C · 901,1 mm ; même poste = pas d’écart)
- [x] HTML initial naissance = exemples officiels Grenoble (1983 0,1 mm CORENC ; 1986 0,0 mm ≠ ERA5 ; 1900 sans invention)
- [x] HTML initial comparer sans query = exemples officiels (Voiron 18,5 → 18,2 °C ; Crolles même station)
- [x] HTML initial commune sans query = dernière année climatique officielle dans le héros (Grenoble 2025 · 19,6 °C · 901,1 mm, LVD 10,2 km ; pas le jour par défaut, pas le record 2022)
- [x] HTML initial commune sans query = pas l’historique du jour par défaut (pas de heatmap 04/09, pas de 12,8 / 35,4 °C collés sur 2025) ; OG `/og/climat/grenoble`
- [x] HTML initial commune sans query = minimale moyenne officielle (Grenoble 2025 · 8,2 °C) + partage de l’année (URL canonique) + sélecteur de date vide
- [x] cartes OG landings = exemples officiels (`/og/accueil` Grenoble 2025 ; `/og/naissance` 1983 CORENC ; `/og/comparer` Voiron, pas `?a=&b=`)
- [x] HTML initial commune / accueil / OG climat = jours officiels ≥ 30 °C de la dernière année complète (Grenoble 2025 · **57 j**, pas le record 2022 **71 j**)
- [x] HTML initial commune / accueil / OG climat = jours de gel officiels de la dernière année complète (Grenoble 2025 · **46 j**, pas le record 2005 **94 j**)
- [x] HTML initial commune / accueil / OG climat = nuits tropicales officielles de la dernière année complète (Grenoble 2025 · **5 nuits**, Tmin ≥ 20 °C, pas le record 2024 **7 nuits**)
- [x] HTML initial commune / accueil / OG climat = jours officiels ≥ 35 °C de la dernière année complète (Grenoble 2025 · **15 j**, pas 2022 **18 j**, pas 2003 **22 j**)
- [x] HTML initial commune / accueil / OG climat = jours officiels ≥ 25 °C de la dernière année complète (Grenoble 2025 · **110 j**, pas 2018 **135 j**, pas 2022 **126 j**)
- [x] HTML initial commune / accueil / OG climat = jours officiels ≥ 40 °C de la dernière année complète (Grenoble 2025 · **0 j**, vrai zéro, pas les 8 j d’un autre poste en 2003)
- [x] HTML initial commune / accueil / OG climat = jours de pluie observés de la dernière année complète (Grenoble 2025 · **144 j**, precip complète, pas 2001 **210 j**, pas 2014 **205 j**, pas 89 j / 2026 incomplet)

**État :** premier HTML Grenoble **56 Ko** (`?date=`). Heatmap « ce jour » : liens `?date=`. Héros : sans query = année climatique LVD 2025 (min. **8,2 °C** · max. 19,6 °C · 901,1 mm · **144 j de pluie** · **110 j ≥ 25 °C** · **57 j ≥ 30 °C** · **15 j ≥ 35 °C** · **0 j ≥ 40 °C** · **46 j de gel** · **5 nuits tropicales**), **sans** le jour par défaut, sélecteur de date vide, partage de l’année ; avec `?date=` = Tmin/Tmax/pluie officiels + station à X km, pas d’ERA5 ni de JPEG IGN ; 1900 = « aucune mesure officielle » ; 1986 pluie héros **0,0 mm** ≠ ERA5 2,1 mm. Accueil : climat officiel LVD 2025 (min. 8,2 °C · 144 j de pluie · 110 j ≥ 25 °C · 57 j ≥ 30 °C · 15 j ≥ 35 °C · 0 j ≥ 40 °C · 46 j de gel · 5 nuits tropicales) dans le premier HTML. Naissance : exemples officiels dans le premier HTML. Comparer : exemples Voiron / Crolles dans le premier HTML. Lighthouse lab 2026-09-07T00:45Z : perf 99, LCP **2178 ms**, CLS 0 — pas CrUX. Pas de bottom sheet GIS. Pas de CDN.

---

## PHASE R13 — Monétisation

- [ ] analytics
- [ ] identifier Premium **après** traction FREE
- [ ] publicité éventuelle sans dégrader lisibilité
- [ ] Stripe seulement si validé

API commerciale : [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md).

---

## PHASE R14 — Hardening

- [x] tests science de base (`npm run test:science`)
- [x] test golden Grenoble 1983-05-12 (si `import:meteo` a été joué)
- [x] GitHub Actions `science` (`npm run test:science`)
- [ ] sécurité / backups / monitoring / costs / DR testés

---

## Hors roadmap active (V2)

Monde, NOAA, CMEMS, océans, ECMWF forecast, globe, ClickHouse, API keys : voir [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md).  
**Ne pas cocher ici.** E-OBS reste `DISABLED`.

---

## MVP V1 (critère de succès)

Un utilisateur peut : chercher une commune ; ouvrir sa page ; voir des décennies ; choisir une date ; lire Tmin/Tmax/pluie disponibles ; voir les autres années du même jour ; voir les records ; voir l’évolution annuelle ; comparer deux communes ; comprendre la source.
