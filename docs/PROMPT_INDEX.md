# Index du PROMPT MAÎTRE V2

Ce fichier **ne remplace pas** [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md).
Le prompt maître est la **constitution définitive** du produit (sections 0–187), mot pour mot — confirmée le 2026-09-06. Ne pas paraphraser, ne pas l’effacer.

**Exécution immédiate :** [ROADMAP.md](./ROADMAP.md) V1 France (R0–R14) + fermeture du vertical slice (Isère → MF → Grenoble → date → **ERA5 point** → comparaison sans fusion). Les sections monde / océan / NOAA / API commerciale restent **PARK** : [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md). On ne les coche pas, on ne les efface pas.

Cet index sert à **ne rien oublier**. Cases : [x] = exigence déjà prouvée dans le dépôt ; [ ] = pas livré (y compris PARK V2).
Partiel = case non cochée + mention *partiel*.

Source : sections 0 à 187 du prompt maître.

| # | Titre (identique au prompt) | Suivi |
|---|---|---|
| 0 | MISSION GÉNÉRALE | [x] constitution figée |
| 1 | VISION PRODUIT | [ ] |
| 2 | QUESTIONS AUXQUELLES LE PRODUIT DOIT SAVOIR RÉPONDRE | [ ] |
| 3 | PRINCIPE FONDAMENTAL : PLUSIEURS SOURCES | [ ] *partiel* |
| 4 | NE JAMAIS CONFONDRE LES TYPES DE DONNÉES | [x] |
| 5 | HIÉRARCHIE GÉNÉRALE DES SOURCES | [ ] *partiel* |
| 6 | SOURCE NATIONALE PRIORITAIRE | [ ] |
| 7 | SOURCE FRANCE : MÉTÉO-FRANCE | [x] |
| 8 | ERA5 | [ ] *partiel* (point Grenoble 2t + d2m + TP + 10u/v + MSL + SP + neige SWE + SSRD + rafale **5 jours** dont records 12 mai 1982/1986 ; quotidien 2t **3 jours** ; pas 1940–2026, pas mondial) |
| 9 | ERA5-LAND | [ ] |
| 10 | NOAA GHCN DAILY | [ ] |
| 11 | NOAA ISD | [ ] |
| 12 | NOAA OCÉAN | [ ] |
| 13 | COPERNICUS MARINE | [ ] |
| 14 | ECMWF OPEN DATA | [ ] |
| 15 | AUTRES SOURCES | [ ] |
| 16 | LICENCE REGISTRY OBLIGATOIRE | [x] |
| 17 | INTERDICTION E-OBS PAR DÉFAUT | [x] |
| 18 | ATTRIBUTIONS | [ ] *partiel* (MF + ERA5 point sur la page date) |
| 19 | DATA LINEAGE | [ ] *partiel* (checksum extract ERA5 + lineage import) |
| 20 | CROSS-SOURCE VALIDATION ENGINE | [ ] |
| 21 | DÉPENDANCE DES SOURCES | [ ] *partiel* (ERA5 assimilée ≠ indépendante) |
| 22 | CONFIDENCE ENGINE | [ ] *partiel* (`confidence-v1-draft` ; pas de bonus d’indépendance ERA5) |
| 23 | NE PAS INVENTER UNE PRÉCISION | [x] |
| 24 | GESTION ALTITUDE | [ ] *partiel* (orographie maille ERA5 985,5 m stockée ; pas de correction lapse) |
| 25 | ARCHITECTURE DE STOCKAGE | [ ] *partiel* (SQLite + schéma stats ; Postgres/R2 = cible ADR-0002) |
| 26 | FORMAT DATA LAKE | [ ] |
| 27 | FORMATS | [ ] |
| 28 | STACK FRONTEND | [ ] *partiel* |
| 29 | VISUALISATION | [ ] *partiel* |
| 30 | DATA ENGINEERING PYTHON | [ ] *partiel* (`extract_point.py` ARCO, un jour) |
| 31 | BACKEND | [ ] |
| 32 | MONOREPO | [ ] *partiel* |
| 33 | DOCUMENTATION OBLIGATOIRE | [x] |
| 34 | SKILLS À CRÉER | [x] |
| 35 | SCHÉMA GLOBAL DES STATIONS | [ ] *partiel* |
| 36 | IDENTIFICATION DES STATIONS DUPLIQUÉES | [ ] |
| 37 | MODÈLE D'OBSERVATION STANDARD | [ ] *partiel* |
| 38 | VARIABLE REGISTRY | [ ] *partiel* |
| 39 | UNIT ENGINE | [x] |
| 40 | TEMPS ET TIMEZONES | [ ] *partiel* |
| 41 | GLOBAL PLACE ENGINE | [ ] |
| 42 | FRANCE | [x] |
| 43 | GLOBAL | [ ] |
| 44 | CLICK ANYWHERE | [ ] |
| 45 | MODE TERRE | [ ] |
| 46 | MODE OCÉAN | [ ] |
| 47 | PROFIL OCÉANIQUE | [ ] |
| 48 | VENT | [ ] *partiel* |
| 49 | COURANTS OCÉANIQUES | [ ] |
| 50 | ANIMATION VENT | [ ] |
| 51 | ANIMATION COURANTS | [ ] |
| 52 | TIMELINE MONDIALE | [ ] |
| 53 | MACHINE À REMONTER LE TEMPS | [ ] |
| 54 | COMPARATEUR | [ ] *partiel* (année vs année + même saison + ville vs ville Isère ; pas France, pas hiver vs été) |
| 55 | SOURCE COMPARISON | [ ] *partiel* (Grenoble 1983-05-12, écart sans fusion) |
| 56 | BIAS ANALYSIS | [ ] |
| 57 | NORMALES CLIMATIQUES | [ ] *partiel* (1991-2020 annuelle + mensuelle, ≥ 24 ; 16 postes Isère) |
| 58 | ANOMALIES | [ ] *partiel* (même station que la normale seulement) |
| 59 | STATISTIQUES QUOTIDIENNES | [ ] |
| 60 | STATISTIQUES MENSUELLES | [ ] *partiel* (UI mois complets + records + normale 1991-2020 ; pas LSH) |
| 61 | STATISTIQUES SAISONNIÈRES | [ ] *partiel* (DJF/MAM/JJA/SON à l’écran, un poste ; pas de normale saisonnière) |
| 62 | STATISTIQUES ANNUELLES | [x] |
| 63 | RECORD ENGINE | [ ] *partiel* (jour + année + mois + épisodes Tmax ; pas ERA5, pas canicule officielle) |
| 64 | SCIENTIFIC HONESTY | [ ] *partiel* |
| 65 | COUVERTURE | [ ] |
| 66 | DONNÉES MANQUANTES | [x] |
| 67 | INTERPOLATION | [ ] |
| 68 | GRID DATA | [ ] |
| 69 | EXTRACTION POINT | [x] (nearest 2t horaire, un point, un jour) |
| 70 | CARTOGRAPHIE | [ ] |
| 71 | TILES | [ ] |
| 72 | COLOR SCALES | [ ] |
| 73 | ACCESSIBILITÉ | [ ] |
| 74 | PAGE LIEU | [x] |
| 75 | PAGE DATE | [x] |
| 76 | PAGE OCÉAN | [ ] |
| 77 | FEATURE "LE JOUR DE MA NAISSANCE" | [ ] *partiel* (page /naissance + récit pluie/station + titres date officiels + exemples SSR 1983/1986/1900 + OG `/og/naissance` 1983 CORENC ; pas de SDK social) |
| 78 | FEATURE "CE JOUR DANS L'HISTOIRE" | [x] (moyenne + percentile + records + courbe, un poste ; pas une normale) |
| 79 | FEATURE "QUAND J'ÉTAIS ENFANT" | [ ] *partiel* (moyennes d’années complètes, un poste, fenêtre 2016–2025 pour un né en 1983) |
| 80 | FEATURE "MA VILLE SE RÉCHAUFFE-T-ELLE ?" | [ ] *partiel* (OLS Isère, un poste, ≥ 15 ans ; héros 2025 = **57 j ≥ 30 °C** et **46 j de gel** observés, pas 2022 71 j ni 2005 94 j ; pas LSH, pas France) |
| 81 | FEATURE "100 ANS EN 30 SECONDES" | [ ] |
| 82 | FEATURE OCEAN TIME MACHINE | [ ] |
| 83 | FEATURE SOURCE INSPECTOR | [ ] *partiel* |
| 84 | API INTERNE | [ ] *partiel* |
| 85 | FUTURE API COMMERCIALE | [ ] |
| 86 | RÉPONSE API COMMERCIALE | [ ] |
| 87 | NE PAS REVENDRE NAÏVEMENT UNE API TIERS | [ ] |
| 88 | INGESTION BULK | [ ] *partiel* (Isère + raw/ local-first ; France entière ouverte) |
| 89 | SYNCHRONISATION | [ ] |
| 90 | IDEMPOTENCE | [x] |
| 91 | CHECKSUM | [x] |
| 92 | DATA VERSIONING | [ ] |
| 93 | QUARANTINE | [ ] |
| 94 | SCHEMA DRIFT | [ ] |
| 95 | QUALITY TESTS | [ ] |
| 96 | OUTLIERS | [ ] |
| 97 | ROADMAP OBLIGATOIRE | [x] |
| 98 | PHASE 0 — RESEARCH & LEGAL | [x] |
| 99 | PHASE 1 — ARCHITECTURE | [ ] *partiel* (ADR-0002 accepté ; stack Vercel/Supabase non branché) |
| 100 | PHASE 2 — SOURCE REGISTRY | [ ] *partiel* |
| 101 | PHASE 3 — FRANCE MVP | [ ] *partiel* |
| 102 | PHASE 4 — PREMIÈRE PAGE HISTORIQUE | [ ] *partiel* (recherche Isère + page date + climat annuel + comparateur d’années et de communes Isère, HTML initial) |
| 103 | PHASE 5 — ERA5 FRANCE | [ ] *partiel* (point Grenoble 2t + d2m + TP + vent 10 m + MSL + SP + neige SWE + SSRD + rafale **5 jours** ; quotidien 2t **3 jours** JSON ; pas 1940–2026) |
| 104 | PHASE 6 — SOURCE FUSION ENGINE | [ ] |
| 105 | PHASE 7 — CONFIDENCE ENGINE | [ ] *partiel* |
| 106 | PHASE 8 — NOAA | [ ] |
| 107 | PHASE 9 — FRANCE COMPLETE | [ ] |
| 108 | PHASE 10 — WORLD STATIONS | [ ] |
| 109 | PHASE 11 — ERA5 WORLD | [ ] |
| 110 | VARIABLES ERA5 PRIORITAIRES | [ ] *partiel* (2t + rosée + TP + 10u/v + MSL + SP + neige SWE + SSRD + rafale un jour ; pas 1940–2026) |
| 111 | PHASE 12 — OCEAN MVP | [ ] |
| 112 | PHASE 13 — GLOBAL OCEAN | [ ] |
| 113 | PHASE 14 — ECMWF FORECAST | [ ] |
| 114 | PHASE 15 — GLOBAL MAP | [ ] |
| 115 | PHASE 16 — TIME MACHINE | [ ] |
| 116 | PHASE 17 — PREMIUM | [ ] |
| 117 | PHASE 18 — PRO | [ ] |
| 118 | PHASE 19 — API COMMERCIALE | [ ] |
| 119 | PHASE 20 — SCALE | [ ] |
| 120 | MVP EXACT | [ ] *partiel* |
| 121 | POURQUOI LA FRANCE EN PREMIER | [ ] |
| 122 | UX ACCUEIL | [ ] *partiel* (recherche commune + CTAs 390 px + cartes climat officiel LVD 2025 min. 8,2 / max. 19,6 °C · 57 j ≥ 30 °C · 46 j de gel + OG `/og/accueil` exemple Grenoble ; pas France entière) |
| 123 | DESIGN | [ ] *partiel* |
| 124 | HOME HERO | [ ] *partiel* (hero compact 390 px, JPEG, `decoding=sync`, `quality=70`, sizes ≤ 1480 px) |
| 125 | PAGE MOBILE | [ ] *partiel* (390 px ; HTML page 56 Ko si `?date=` ; héros sans query = climat LVD 2025 min. 8,2 / max. 19,6 °C · 57 j ≥ 30 °C · 46 j de gel, date vide, partage année ; héros `?date=` = Tmin/Tmax/pluie + station à X km ; accueil = climat officiel LVD ; naissance / comparer = exemples officiels ; Lighthouse lab LCP 2178 ms ; pas CrUX ; pas de bottom sheet GIS) |
| 126 | SEO | [ ] *partiel* (titres, héros et OG commune sans query = dernière année climatique officielle min. 8,2 / max. 19,6 °C · **57 j ≥ 30 °C** · **46 j de gel** ; landings OG accueil/naissance/comparer = exemples officiels ; pas le jour par défaut ; JSON-LD jour seulement si `?date=` ; titres `?date=` / naissance / comparer = mesure officielle ; comparer landing = exemples officiels ; sitemap filtré + hreflang fr + JSON-LD + score v1 ; pas de pages en) |
| 127 | INTERNATIONALISATION | [ ] *partiel* (html lang=fr, hreflang fr/x-default ; routage `en` = V2) |
| 128 | PARTAGE SOCIAL | [ ] *partiel* (carte PNG + copie URL ; OG commune `/og/climat/{slug}` = min./max./pluie/**57 j ≥ 30 °C**/**46 j de gel** ; landings `/og/accueil` `/og/naissance` `/og/comparer` = exemples officiels étiquetés ; « Partager cette année » sans `?date=` ; mesure officielle si `?date=` ; pas de SDK) |
| 129 | BUSINESS MODEL | [ ] |
| 130 | OCEAN BUSINESS | [ ] |
| 131 | WEATHER BUSINESS | [ ] |
| 132 | CLIMATE BUSINESS | [ ] |
| 133 | PRICING HYPOTHÈSES | [ ] |
| 134 | COÛT MARGINAL | [ ] |
| 135 | FINOPS | [ ] |
| 136 | NE PAS STOCKER L'INUTILE | [ ] |
| 137 | HOT/WARM/COLD DATA | [ ] |
| 138 | CACHE | [ ] *partiel* (`unstable_cache` 1 h ; yearly **page** `commune-yearly-page-v3` `detailRows: false` ; comparer ville vs ville + `compare-examples-v1` ; accueil `featured-climate-v5` ; naissance `birth-examples-v1` ; `/yearly` complet à la demande ; pas CDN) |
| 139 | PRECOMPUTATION | [ ] |
| 140 | POSTGRES PARTITIONING | [ ] |
| 141 | INDEXATION SPATIALE | [ ] |
| 142 | NEAREST STATION | [ ] |
| 143 | STATION MATCHING SCORE | [ ] *partiel* |
| 144 | SOURCE SELECTION SCORE | [ ] |
| 145 | LAND/OCEAN MASK | [ ] |
| 146 | LARGE LAKES | [ ] |
| 147 | BATHYMETRY FUTURE | [ ] |
| 148 | ADMIN BACKOFFICE | [ ] |
| 149 | SOURCE HEALTH | [ ] |
| 150 | ALERTING | [ ] |
| 151 | LICENCE CHANGE ALERT | [ ] |
| 152 | SECURITY | [ ] |
| 153 | API SOURCE SECRETS | [ ] |
| 154 | AUTH | [ ] |
| 155 | STRIPE | [ ] |
| 156 | RGPD | [ ] |
| 157 | OBSERVABILITY | [ ] |
| 158 | TESTS | [ ] |
| 159 | GOLDEN DATASETS | [ ] |
| 160 | SCIENTIFIC REGRESSION TESTS | [ ] |
| 161 | UI DATA DISCLAIMER | [x] |
| 162 | PUBLIC TRUST | [ ] |
| 163 | SOURCES PAGE | [x] |
| 164 | METHOD PAGE | [x] |
| 165 | PAS D'IA POUR INVENTER DES DONNÉES | [x] |
| 166 | IA FUTURE | [ ] |
| 167 | FEATURES IA FUTURES | [ ] |
| 168 | PRODUCT DIFFERENTIATION | [ ] |
| 169 | ARCHITECTURE DE MARQUE | [x] |
| 170 | PREMIÈRE ACTION DE L'AGENT | [x] |
| 171 | PREMIÈRE PREUVE DE CONCEPT | [x] |
| 172 | DEUXIÈME PREUVE | [ ] |
| 173 | TROISIÈME PREUVE | [ ] |
| 174 | CRITÈRE D'EXTENSION MONDIALE | [ ] |
| 175 | AUCUNE FAUSSE DONNÉE EN PRODUCTION | [ ] |
| 176 | ADR | [x] |
| 177 | CHANGELOG DATA | [x] |
| 178 | REPRODUCIBILITÉ | [ ] |
| 179 | DATA PRODUCT VERSION | [x] |
| 180 | SLO | [ ] |
| 181 | BACKUP | [ ] |
| 182 | DISASTER RECOVERY | [ ] |
| 183 | DEFINITION OF DONE | [ ] |
| 184 | RÈGLES ABSOLUES DE L'AGENT | [x] |
| 185 | PRIORITÉ PRODUIT | [x] |
| 186 | OBJECTIF COMMERCIAL FINAL | [ ] |
| 187 | COMMENCE MAINTENANT | [x] (slice Isère → MF → Grenoble → date → ERA5 point → comparaison → provenance → confiance) |

## Règle

Si une ligne est [ ] ici, elle **reste dans l’objectif**.
Ne jamais supprimer une section du prompt maître parce que le slice Isère ne la couvre pas encore.
Mettre à jour cet index dans le même lot que STATUS / ROADMAP.
