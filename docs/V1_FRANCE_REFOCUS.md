# Stratégie V1 — France • grand public • historique météo

**Date :** 2026-09-06  
**Statut :** ordre d’exécution **immédiat** (France, grand public, historique).  
**Constitution définitive (vision 0–187, mot pour mot) :** [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md) — confirmée le 2026-09-06. Ce fichier **ne la remplace pas**.  
**Audit du dépôt existant :** [V1_FRANCE_REFOCUS_AUDIT.md](./V1_FRANCE_REFOCUS_AUDIT.md).  
**Roadmap à exécuter :** [ROADMAP.md](./ROADMAP.md).

Ce fichier ne remplace pas le prompt maître V2. Il **recentre l’ordre d’exécution**. Le monde, les océans et l’API commerciale restent des objectifs V2/V3, pas des suppressions.

---

## Promesse

> Le moteur de recherche de l’histoire météo de la France.

Public prioritaire : grand public. Secondaire : passionnés, enseignants, journalistes, professionnels.

L’utilisateur n’a pas besoin de connaître ERA5, GRIB, NetCDF, stations synoptiques, réanalyses ou codes techniques.

Questions types : jour de naissance, Grenoble le 12 mai 1983, été le plus chaud à Lyon, « moins chaud quand j’étais enfant », record de froid, jours > 30 °C, comparer deux villes ou deux étés.

---

## Périmètre V1

**Inclus :** France métropolitaine + Corse. Territoires ultramarins seulement si les datasets et l’admin les rendent simples ; sinon post-V1.

**Hors V1 (PARK) :** recherche mondiale, pays étrangers, globe 3D, NOAA mondial, stations internationales, océans, Copernicus Marine, prévision comme produit principal, API commerciale (clés, billing, quotas).

---

## Sources

1. Observation officielle Météo-France appropriée (bulk climatologique quotidien en priorité).
2. Autre station Météo-France pertinente.
3. Longue série homogénéisée pour tendances longues, **lorsque** le dataset est identifié et adapté — ne pas concaténer naïvement plusieurs postes.
4. ERA5 / ERA5-Land en **complément** : cohérence, zones sans station pertinente, analyses futures. France + buffer frontalier raisonnable. **Jamais** ERA5 mondial.

Le moteur multi-sources existant se conserve, règles V1 simplifiées. Extensible plus tard (`WeatherProvider` / `MeteoFranceProvider` / `ERA5Provider`). Pas d’orchestrateur mondial maintenant.

Backend peut connaître OBSERVED, HOMOGENIZED, REANALYSIS, DERIVED, INTERPOLATED.  
UI publique : **Mesure officielle** / **Série climatique corrigée** / **Estimation climatique** + bouton « En savoir plus ».

NULL ≠ 0. Afficher « Non disponible ». L’IA n’invente jamais une valeur manquante.

---

## Produit

- Accueil : grande barre « Recherchez votre ville », CTA « Explorer l’histoire météo de ma ville », secondaire « Quel temps faisait-il à une date précise ? ».
- Recherche commune (nom, plus tard code postal, département). Identité = code INSEE. Homonymes : nom + département + région.
- Mapping commune ↔ station : distance, altitude, continuité, qualité, période, variable. Ne jamais faire croire que la station est dans la commune si ce n’est pas le cas.
- Page commune : aujourd’hui dans l’histoire, climat, températures, pluie, records, jours chauds, gel, comparer, quel temps faisait-il, stations, sources.
- Fonctions : date historique + percentile ; jour de naissance + partage ; ce jour dans l’histoire ; quand j’étais enfant ; ma ville se réchauffe-t-elle ; comparateur villes / années ; heatmap annuelle ; timeline bornée à la couverture réelle ; carte France progressive (ne pas bloquer le reste).
- SEO intégré tôt, pages seulement si `seo_content_score` suffisant. Pas de millions de pages faibles. URL préférée : `/meteo/{region}/{departement}/{commune}` (alias plus simple possible plus tard).
- Mobile first. Performance : pas des décennies quotidiennes si 100 points agrégés suffisent. Cache Next.js / CDN / vues matérialisées. Redis seulement si besoin démontré.
- Précalcul : mensuel, annuel, records, day-of-year, normales (défaut 1991-2020, aussi 1961-90 / 1971-2000 / 1981-2010), indicateurs (jours >25/30/35/40, gel, nuits tropicales, jours de pluie, cumul, amplitude).

Unités UI : °C, km/h, mm, hPa, heures de soleil. Stockage canonique inchangé.

---

## Stockage V1

Préférer PostgreSQL/PostGIS + object storage. **Ne pas** introduire ClickHouse / data lake / workers complexes sans besoin mesuré. ClickHouse n’existe pas dans le dépôt : ne pas l’ajouter. SQLite reste le runtime actuel du slice Isère.

Zarr / GRIB / NetCDF : ERA5 et transformations backend seulement.

Volumes : [V1_DATA_VOLUME.md](./V1_DATA_VOLUME.md). Cible : dizaines à centaines de Go, évolution vers des To. Pas d’optimisation 100 To / Po.

---

## Business

Croissance d’abord par le **trafic grand public**. FREE riche (historique, records, graphiques, date, comparaison simple). PREMIUM après validation (comparaisons avancées, exports, favoris). Publicité prévue techniquement, sans casser Core Web Vitals ni la crédibilité. API commerciale : PARK V2.

---

## Design

Moderne, éditorial, data viz, météo, émotion, souvenir, histoire. « La mémoire météo de la France ». Pas un dashboard data engineer. Critère : une personne normale comprend en moins de 5 secondes.

---

## Architecture

Extensible mais simple maintenant. Noms génériques (`WeatherObservationService`), pas `FrenchTemperatureService`. Pas 15 couches pour un besoin hypothétique.

Feature flags : `ENABLE_GLOBAL_DATA`, `ENABLE_OCEAN`, `ENABLE_GLOBAL_SEARCH` (défaut false).

API interne V1 : search, communes (daily/monthly/yearly/records), compare, sources. Pas de portail développeurs.

---

## MVP réussi

1. Chercher une commune française  
2. Page météo historique  
3. Plusieurs décennies  
4. Sélectionner une date  
5. Tmin / Tmax / pluie si disponibles  
6. Autres occurrences du même jour  
7. Records  
8. Évolution annuelle  
9. Comparer deux communes  
10. Comprendre la source  

Priorité : utilité → simplicité → fiabilité → rapidité → beauté → complexité technique.

---

## Ne pas casser l’existant

Migration avant changement DB. Chercher consommateurs avant suppression d’endpoint. Chercher imports avant déplacement. Tests avant refactor. Ne pas supprimer `raw/`. E-OBS toujours `DISABLED`.
