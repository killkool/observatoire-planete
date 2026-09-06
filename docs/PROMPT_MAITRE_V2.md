# PROMPT MAÎTRE V2

# PLATEFORME MONDIALE MÉTÉO • CLIMAT • OCÉANS • HISTORIQUE • TEMPS RÉEL • PRÉVISIONS

## 0. MISSION GÉNÉRALE

Tu es simultanément :

* Lead Software Architect ;
* Lead Full-Stack Developer ;
* Data Engineer ;
* Climate Data Engineer ;
* GIS Engineer ;
* Ocean Data Engineer ;
* Meteorological Data Engineer ;
* Data Scientist ;
* spécialiste séries temporelles ;
* spécialiste climatologie ;
* spécialiste océanographie ;
* expert PostgreSQL/PostGIS ;
* expert données multidimensionnelles ;
* expert optimisation cloud ;
* spécialiste UX/UI data visualisation ;
* spécialiste SEO programmatique ;
* expert sécurité ;
* expert licences Open Data ;
* expert SaaS/API commercial ;
* FinOps engineer.

Ta mission est de CONCEVOIR ET DÉVELOPPER ENTIÈREMENT une plateforme mondiale permettant d'explorer, comparer et comprendre :

* la météo passée ;
* la météo actuelle ;
* les prévisions ;
* le climat ;
* l'atmosphère ;
* les océans ;
* les vagues ;
* le vent ;
* les courants ;
* la température de la mer ;
* la salinité ;
* les précipitations ;
* les records ;
* les anomalies climatiques ;
* l'évolution climatique.

Le produit doit être commercialisable et économiquement scalable.

---

# 1. VISION PRODUIT

Le produit ne doit PAS être :

* une copie de Météo-France ;
* une copie de Windy ;
* une copie de Weather.com ;
* une simple application météo ;
* une simple interface ERA5.

Il doit devenir :

> LE MOTEUR DE RECHERCHE DE L'HISTOIRE MÉTÉOROLOGIQUE ET CLIMATIQUE DE LA PLANÈTE.

Et progressivement :

> UN GOOGLE EARTH DE LA MÉTÉO, DU CLIMAT ET DES OCÉANS.

L'utilisateur doit pouvoir cliquer n'importe où sur Terre et obtenir la meilleure information disponible pour :

* aujourd'hui ;
* hier ;
* une date historique ;
* une année ;
* une décennie ;
* une période climatique ;
* les prochaines heures/jours.

---

# 2. QUESTIONS AUXQUELLES LE PRODUIT DOIT SAVOIR RÉPONDRE

Exemples :

"Quel temps faisait-il à Grenoble le 12 mai 1983 ?"

"Quel était le 15 août le plus chaud depuis 1950 ?"

"Est-ce qu'il faisait réellement moins chaud quand j'étais enfant ?"

"Comment Grenoble et Annecy ont-elles évolué depuis 1950 ?"

"Quel était le vent à cet endroit le 4 août 1978 ?"

"Quelle est actuellement la température de la Méditerranée ?"

"Quelle était la température de la Méditerranée en août 1993 ?"

"Quelle est la température à 50 m de profondeur ?"

"Dans quelle direction va le courant ?"

"Quelle était la hauteur des vagues ici hier ?"

"Quelle est l'anomalie de température actuelle par rapport à 1991-2020 ?"

"Quel est le record de chaleur de cette région ?"

"Quel temps faisait-il le jour de ma naissance ?"

"Quel est le meilleur relevé disponible pour cette coordonnée et cette date ?"

---

# 3. PRINCIPE FONDAMENTAL : PLUSIEURS SOURCES

Ne JAMAIS construire l'application autour d'une seule source.

Créer un :

# GLOBAL WEATHER SOURCE ENGINE

Ce moteur est responsable de rechercher, comparer et classer les sources disponibles.

Entrée conceptuelle :

* latitude ;
* longitude ;
* altitude éventuelle ;
* date/heure ;
* variable ;
* résolution souhaitée.

Exemple :

latitude = 45.1885

longitude = 5.7245

date = 1985-07-15

variable = air_temperature_max

Le moteur cherche ensuite :

1. station nationale officielle ;
2. autre observation fiable ;
3. réseau international ;
4. réanalyse ;
5. satellite ;
6. produit dérivé.

Il retourne toutes les sources utiles et désigne éventuellement une valeur préférée.

---

# 4. NE JAMAIS CONFONDRE LES TYPES DE DONNÉES

Chaque donnée doit obligatoirement être classée.

Créer l'enum :

DataOriginType

Valeurs minimales :

OBSERVED

REANALYSIS

SATELLITE

FORECAST

DERIVED

HOMOGENIZED

INTERPOLATED

BLENDED

MODEL

CLIMATOLOGY

Ne jamais afficher une réanalyse comme une observation.

Ne jamais afficher une interpolation comme une observation.

Ne jamais afficher une prévision comme une mesure réelle.

---

# 5. HIÉRARCHIE GÉNÉRALE DES SOURCES

La priorité dépend :

* du pays ;
* de la variable ;
* de la période ;
* de la qualité ;
* de la distance ;
* de l'altitude ;
* de la couverture temporelle ;
* de la résolution.

Exemple pour la France :

### Observation climatologique

1. Météo-France
2. NOAA/GHCN si station correspondante utile
3. ERA5-Land / ERA5

### Réanalyse

1. ERA5-Land sur terre lorsque pertinent
2. ERA5

### Océan

1. Copernicus Marine
2. NOAA lorsque approprié
3. ERA5 selon variable

### Prévision mondiale

1. ECMWF Open Data lorsque disponible
2. autres modèles ouverts ajoutés ultérieurement

La hiérarchie doit être CONFIGURABLE.

Ne jamais coder définitivement :

"Météo-France > NOAA > ERA5"

pour toutes les variables.

---

# 6. SOURCE NATIONALE PRIORITAIRE

Pour chaque pays, créer un système de connecteur météo national.

Structure :

CountryWeatherProvider

Exemples :

France
→ Météo-France

Allemagne
→ DWD

États-Unis
→ NOAA/NWS

Royaume-Uni
→ Met Office lorsque licences et données adaptées

Canada
→ Environment and Climate Change Canada

etc.

IMPORTANT :

Une source nationale ne peut être activée dans la production commerciale qu'après audit de :

* licence ;
* droits commerciaux ;
* conditions d'attribution ;
* redistribution ;
* limitation API ;
* stockage ;
* dérivés ;
* obligations spécifiques.

---

# 7. SOURCE FRANCE : MÉTÉO-FRANCE

La France constitue le PREMIER pays complètement supporté.

Utiliser notamment :

* données climatologiques quotidiennes ;
* données climatologiques horaires ;
* métadonnées stations ;
* historiques des stations ;
* longues séries homogénéisées ;
* données 6 minutes lorsque pertinent ;
* autres produits Open Data utiles.

Les données quotidiennes et horaires doivent être importées principalement via les fichiers bulk lorsqu'ils existent.

Éviter une architecture reposant sur des millions d'appels API individuels.

---

# 8. ERA5

ERA5 constitue la colonne vertébrale mondiale historique.

Utilisations :

* température ;
* vent ;
* pression ;
* précipitations ;
* humidité ;
* rayonnement ;
* neige ;
* variables terrestres ;
* variables atmosphériques ;
* vagues lorsque pertinent ;
* nombreuses autres variables.

ERA5 couvre mondialement l'historique depuis 1940.

Ne jamais appeler ERA5 une station météo.

Afficher :

"Réanalyse ERA5"

et non :

"Observation ERA5".

---

# 9. ERA5-LAND

Utiliser ERA5-Land pour certaines analyses terrestres nécessitant une résolution spatiale supérieure.

Exemples :

* température terrestre ;
* précipitations ;
* humidité du sol ;
* température du sol ;
* rayonnement ;
* variables surface.

ERA5-Land ne remplace pas automatiquement une station locale.

Il constitue une information complémentaire.

---

# 10. NOAA GHCN DAILY

Intégrer NOAA GHCN Daily comme réseau mondial de stations historiques.

Variables selon station :

* Tmin ;
* Tmax ;
* précipitation ;
* neige ;
* épaisseur neige ;
* autres variables disponibles.

GHCN doit servir notamment à :

* élargir la couverture internationale ;
* fournir des stations historiques ;
* comparer certaines données nationales ;
* construire le futur historique mondial.

---

# 11. NOAA ISD

Intégrer Integrated Surface Database pour les données horaires/synoptiques mondiales.

Variables possibles selon station :

* température ;
* point de rosée ;
* vitesse vent ;
* direction vent ;
* rafales ;
* pression ;
* visibilité ;
* précipitations ;
* neige ;
* couverture nuageuse ;
* météo observée.

---

# 12. NOAA OCÉAN

Prévoir des connecteurs NOAA spécifiques.

Exemple :

OISST pour la température de surface océanique.

Ne pas mélanger automatiquement toutes les sources NOAA.

Chaque dataset doit être une source distincte dans le catalogue.

---

# 13. COPERNICUS MARINE

Copernicus Marine devient la source marine majeure.

Supporter progressivement :

* température de l'eau ;
* température selon profondeur ;
* salinité ;
* courants ;
* hauteur vagues ;
* direction vagues ;
* période vagues ;
* niveau de mer ;
* glace marine ;
* chlorophylle lorsque pertinent ;
* oxygène lorsque disponible ;
* biogéochimie ;
* autres variables utiles.

L'utilisateur doit pouvoir sélectionner une profondeur.

Exemple :

Surface

10 m

50 m

100 m

200 m

500 m

1000 m

etc.

Selon les niveaux réellement disponibles dans le produit.

---

# 14. ECMWF OPEN DATA

Utiliser ECMWF Open Data pour les prévisions lorsque les paramètres sont ouverts.

Supporter progressivement :

* IFS ;
* AIFS ;
* atmosphère ;
* vent ;
* température ;
* pluie ;
* pression ;
* vagues ;
* autres paramètres ouverts.

ATTENTION :

Ne pas supposer que tout le catalogue ECMWF est libre.

Différencier :

OPEN

RESTRICTED

COMMERCIAL-LICENSE-REQUIRED

UNKNOWN

N'intégrer dans notre offre commerciale que les produits juridiquement validés.

---

# 15. AUTRES SOURCES

Prévoir une architecture permettant plus tard :

* NASA ;
* EUMETSAT ;
* JMA ;
* DWD ;
* Met Office ;
* Environment Canada ;
* BOM Australie ;
* services nationaux européens ;
* bouées ;
* réseaux marins ;
* satellites.

Ne jamais ajouter automatiquement une source simplement parce qu'elle est gratuite à télécharger.

---

# 16. LICENCE REGISTRY OBLIGATOIRE

Créer :

`data_sources`

et

`data_source_licenses`

Champs minimum :

source_id

provider

dataset

product_id

version

license_name

license_version

commercial_use_allowed

redistribution_allowed

derivative_work_allowed

attribution_required

share_alike

storage_allowed

cache_allowed

api_resale_allowed

logo_usage_allowed

terms_url

license_url

reviewed_at

reviewed_by

legal_status

notes

Valeurs de legal_status :

APPROVED_COMMERCIAL

APPROVED_NON_COMMERCIAL

REQUIRES_REVIEW

RESTRICTED

DISABLED

Une source avec :

REQUIRES_REVIEW

ne doit jamais être utilisée en production commerciale.

---

# 17. INTERDICTION E-OBS PAR DÉFAUT

Ne pas utiliser E-OBS dans le produit commercial tant que ses conditions ne l'autorisent pas.

Son accès gratuit ne signifie PAS utilisation commerciale autorisée.

Cette règle illustre le principe :

FREE ACCESS ≠ COMMERCIAL REUSE.

---

# 18. ATTRIBUTIONS

Créer une infrastructure d'attribution automatique.

Chaque donnée connaît :

* source ;
* dataset ;
* version ;
* licence ;
* timestamp ;
* date mise à jour ;
* transformation.

L'interface génère automatiquement les crédits appropriés.

Exemple :

Sources utilisées :

Météo-France

Copernicus Climate Change Service / ERA5

NOAA

Copernicus Marine

ECMWF

Selon ce qui a réellement servi.

Ne jamais afficher une source non utilisée.

---

# 19. DATA LINEAGE

Chaque valeur doit pouvoir être retracée.

Créer :

`data_lineage`

Permettre de répondre :

"Comment cette valeur a-t-elle été obtenue ?"

Exemple :

Displayed value

→ monthly_mean

→ daily_observations

→ station ID

→ raw Météo-France CSV

→ fichier téléchargé

→ checksum

→ date import

---

# 20. CROSS-SOURCE VALIDATION ENGINE

Créer un moteur de comparaison inter-sources.

Exemple :

Météo-France : 27.4°C

NOAA : 27.2°C

ERA5 : 26.9°C

Calculer :

* écart ;
* biais ;
* dispersion ;
* altitude ;
* distance ;
* type source.

Ne JAMAIS simplement effectuer :

moyenne(Météo-France, NOAA, ERA5).

Une réanalyse et une observation ne sont pas équivalentes.

---

# 21. DÉPENDANCE DES SOURCES

Attention :

Deux sources ne sont pas nécessairement indépendantes.

ERA5 assimile de nombreuses observations.

Certaines données NOAA peuvent contenir des observations provenant de réseaux météorologiques nationaux.

Ne jamais calculer :

3 sources = trois confirmations indépendantes.

Créer une notion :

`source_dependency_group`

Exemples :

direct_station

international_station_aggregation

reanalysis_assimilated

satellite

model

Permettre au moteur de confiance d'en tenir compte.

---

# 22. CONFIDENCE ENGINE

Créer un indice de confiance.

Il ne doit PAS être arbitraire.

Le score doit prendre en compte :

* source type ;
* quality flag ;
* station quality ;
* couverture ;
* distance ;
* altitude ;
* cohérence inter-sources ;
* indépendance ;
* présence d'une mesure ;
* interpolation ;
* ancienneté ;
* résolution spatiale ;
* résolution temporelle.

Exemple :

96/100

avec détail :

Observation nationale validée : +X

station proche : +X

écart faible avec ERA5 : +X

altitude similaire : +X

couverture complète : +X

Le calcul doit être documenté.

Créer :

`docs/CONFIDENCE_MODEL.md`

---

# 23. NE PAS INVENTER UNE PRÉCISION

Exemple interdit :

ERA5 dit 24.437°C.

Ne pas présenter :

24.437°C

si la nature du produit ne justifie pas cette précision.

Afficher par exemple :

24.4°C

selon variable.

Définir une règle de significant digits.

---

# 24. GESTION ALTITUDE

L'altitude est critique.

Stocker :

* altitude commune ;
* altitude point utilisateur ;
* altitude station ;
* altitude modèle ;
* différence altitude.

Ne jamais appliquer automatiquement un gradient thermique fixe comme vérité universelle.

Une correction altitudinale éventuelle doit être :

* optionnelle ;
* dérivée ;
* documentée ;
* identifiée comme estimation.

---

# 25. ARCHITECTURE DE STOCKAGE

NE JAMAIS stocker toute la grille mondiale ERA5 horaire dans une table SQL ligne par ligne.

Séparer :

## PostgreSQL/PostGIS

Pour :

* utilisateurs ;
* pays ;
* régions ;
* villes ;
* stations ;
* métadonnées ;
* observations ponctuelles ;
* agrégats ;
* records ;
* index ;
* mappings ;
* abonnements ;
* licences ;
* provenance.

## Object Storage

Pour :

* NetCDF ;
* GRIB ;
* Zarr ;
* Parquet ;
* COG ;
* fichiers bruts ;
* tuiles.

---

# 26. FORMAT DATA LAKE

Créer :

RAW

STANDARDIZED

DERIVED

PUBLIC

Structure conceptuelle :

`raw/meteo-france/...`

`raw/noaa/ghcn/...`

`raw/noaa/isd/...`

`raw/copernicus/era5/...`

`raw/copernicus/marine/...`

`raw/ecmwf/...`

Puis :

`standardized/...`

Puis :

`derived/...`

Ne jamais écraser le fichier raw.

---

# 27. FORMATS

Utiliser selon besoin :

Zarr
→ données multidimensionnelles cloud.

Parquet
→ tables analytiques.

COG
→ rasters/cartes.

NetCDF
→ format scientifique source.

GRIB
→ météo/modèles source.

PMTiles
→ cartes vectorielles pré-calculées lorsque pertinent.

PostgreSQL
→ métadonnées/agrégats.

---

# 28. STACK FRONTEND

Utiliser la version Active LTS stable et corrigée de sécurité disponible au moment du développement.

Préférence :

* Next.js ;
* React ;
* TypeScript strict ;
* App Router ;
* SSR ;
* Server Components ;
* Tailwind CSS ;
* design system maison.

Ne jamais figer dans le prompt une version obsolète.

---

# 29. VISUALISATION

Utiliser notamment :

Apache ECharts

MapLibre GL JS

Deck.gl si réellement nécessaire pour certaines couches massives.

Canvas/WebGL pour animation vent/courants lorsque nécessaire.

Ne pas charger des millions de points DOM.

---

# 30. DATA ENGINEERING PYTHON

Utiliser :

Python

Polars

PyArrow

Xarray

Zarr

Dask seulement lorsque nécessaire

cfgrib

eccodes

rasterio

rio-cogeo

DuckDB

psycopg

httpx

pydantic

Copernicus Marine Toolbox lorsque pertinent.

Ne pas multiplier les frameworks inutilement.

---

# 31. BACKEND

Créer une architecture séparant clairement :

Web/API

Workers

Scheduler

Ingestion

Analytics

Tile generation

Exports

Prévoir des jobs asynchrones pour :

* ingestion ;
* transformation ;
* agrégation ;
* génération tuiles ;
* exports ;
* recalcul records.

---

# 32. MONOREPO

Structure :

/
apps/
web/
api/
worker/
tile-server/

packages/
database/
weather-core/
source-engine/
confidence-engine/
climate-statistics/
geo/
ocean/
map/
ui/
auth/
billing/
licensing/
provenance/

pipelines/
meteo-france/
noaa-ghcn/
noaa-isd/
era5/
era5-land/
copernicus-marine/
ecmwf/

skills/

docs/

infrastructure/

tests/

scripts/

---

# 33. DOCUMENTATION OBLIGATOIRE

Créer :

README.md

AGENTS.md

CONTRIBUTING.md

docs/ROADMAP.md

docs/ARCHITECTURE.md

docs/DATABASE.md

docs/GLOBAL_DATA_MODEL.md

docs/DATA_SOURCES.md

docs/DATA_LICENSES.md

docs/DATA_LINEAGE.md

docs/CONFIDENCE_MODEL.md

docs/CLIMATE_METHODOLOGY.md

docs/OCEAN_METHODOLOGY.md

docs/STATION_MATCHING.md

docs/BUSINESS_MODEL.md

docs/COSTS.md

docs/SEO.md

docs/SECURITY.md

docs/DEPLOYMENT.md

docs/DISASTER_RECOVERY.md

---

# 34. SKILLS À CRÉER

Créer au minimum les skills suivants.

## 01-source-registry

Comprend :

catalogues

licences

versions

providers

audit commercial.

## 02-meteo-france

Comprend :

Open Data

stations

paramètres

formats

qualité

API

bulk datasets.

## 03-noaa-ghcn

Comprend :

stations

daily observations

flags

formats.

## 04-noaa-isd

Comprend :

hourly observations

station metadata

weather elements.

## 05-era5

Comprend :

ERA5

ERA5-Land

variables

unités

GRIB

NetCDF

Zarr

réanalyse.

## 06-copernicus-marine

Comprend :

produits océaniques

profondeurs

courants

SST

salinité

vagues

niveaux.

## 07-ecmwf-open-data

Comprend :

IFS

AIFS

GRIB

runs

lead times

licence.

## 08-climate-statistics

Comprend :

normales

anomalies

records

percentiles

trend

homogénéisation.

## 09-ocean-statistics

Comprend :

SST

depth profiles

anomalies

currents

waves

salinity.

## 10-source-fusion

Comprend :

ranking

cross-validation

source dependency

best source.

## 11-confidence-engine

Comprend :

quality scoring

flags

uncertainty.

## 12-gis-world

Comprend :

PostGIS

pays

régions

villes

coordonnées

timezone

altitude.

## 13-raster-data

Comprend :

COG

tiles

rasters

WebGL.

## 14-multidimensional-data

Comprend :

Zarr

Xarray

NetCDF

GRIB

depth/time/lat/lon.

## 15-data-engineering

Comprend :

ETL

bulk ingestion

resume

checksum

deduplication.

## 16-data-quality

Comprend :

validation

missing data

outliers

QC flags.

## 17-dataviz

Comprend :

charts

maps

timelines

heatmaps.

## 18-programmatic-seo

Comprend :

country

region

city

date

historical pages.

## 19-open-data-legal

Comprend :

licences

commercial rights

attribution

redistribution.

## 20-security

Comprend :

secrets

auth

OWASP

rate limits.

## 21-performance-finops

Comprend :

cache

storage

CDN

egress

cost monitoring.

## 22-monetization

Comprend :

Free

Premium

Pro

API

metering

Stripe.

## 23-testing

Comprend :

unit

integration

scientific regression

E2E.

---

# 35. SCHÉMA GLOBAL DES STATIONS

Créer :

weather_stations

Champs conceptuels :

id

provider_id

provider_station_id

name

country_code

latitude

longitude

altitude

timezone

station_type

start_date

end_date

is_active

metadata

source_id

Créer également :

station_aliases

station_history

station_variables

station_quality

station_source_relations

---

# 36. IDENTIFICATION DES STATIONS DUPLIQUÉES

La même station physique peut exister dans :

Météo-France

NOAA

autre réseau.

Ne pas forcément considérer cela comme deux observations indépendantes.

Créer :

`physical_station_entities`

Puis :

`provider_station_links`

Exemple :

Physical station Grenoble-X

→ Météo-France ID XXX

→ NOAA GHCN ID XXX

→ WMO ID XXX

C'est critique pour éviter le double comptage.

---

# 37. MODÈLE D'OBSERVATION STANDARD

Créer un format canonique interne.

Exemple :

observation_id

station_id

timestamp

variable_id

value

unit

original_value

original_unit

quality_flag

origin_type

source_id

dataset_version

ingested_at

validity

lineage_id

Conserver la valeur originale.

---

# 38. VARIABLE REGISTRY

Créer :

`variables`

Exemples :

air_temperature

air_temperature_min

air_temperature_max

dew_point

relative_humidity

precipitation

wind_speed

wind_direction

wind_gust

pressure

sea_level_pressure

snow_depth

solar_radiation

cloud_cover

sea_surface_temperature

water_temperature

salinity

current_velocity_u

current_velocity_v

wave_height

wave_direction

wave_period

sea_level

etc.

Chaque variable contient :

canonical_unit

description

standard_name

CF standard name si pertinent

allowed_ranges

display_precision.

---

# 39. UNIT ENGINE

Toutes les données doivent avoir une unité canonique.

Exemple :

Kelvin source

→ °C UI.

m/s

→ km/h configurable.

Pa

→ hPa.

m precipitation

→ mm.

Conserver toujours l'unité source.

---

# 40. TEMPS ET TIMEZONES

Stockage principal :

UTC.

Affichage :

timezone locale du lieu.

Attention aux relevés quotidiens météo :

un "jour climatologique" n'est pas toujours équivalent à minuit/minuit local.

Ne jamais reconstruire naïvement les valeurs quotidiennes horaires sans connaître la méthodologie source.

---

# 41. GLOBAL PLACE ENGINE

Créer une recherche mondiale.

Supporter :

pays

région

département/état

ville

commune

coordonnées

station

océan

mer

lieu remarquable.

Exemple :

Grenoble

Tokyo

New York

45.18,5.72

Méditerranée

Atlantique Nord

---

# 42. FRANCE

Pour la France :

utiliser le code INSEE comme identifiant administratif principal.

Construire :

France

→ région

→ département

→ commune.

---

# 43. GLOBAL

Pour le reste du monde :

utiliser un système d'identifiants internes.

Stocker :

country ISO 3166

admin level

provider IDs

translations

names variants

géométrie.

Ne pas baser l'identité d'une ville uniquement sur son nom.

---

# 44. CLICK ANYWHERE

La carte mondiale doit permettre de cliquer n'importe où.

Le moteur détermine :

LAND

OCEAN

COAST

Puis choisit automatiquement le panneau approprié.

---

# 45. MODE TERRE

Afficher par exemple :

Température

Tmin

Tmax

Vent

Rafale

Pression

Humidité

Pluie

Neige

Rayonnement

Nuages

Anomalie

Historique.

---

# 46. MODE OCÉAN

Afficher :

température surface

température profondeur

courant

direction courant

salinité

vagues

direction vagues

période vagues

niveau marin

glace selon zone

anomalie température.

---

# 47. PROFIL OCÉANIQUE

Créer une visualisation verticale.

Exemple :

0 m     26.1°C

10 m    25.7°C

50 m    19.2°C

100 m   15.1°C

500 m   12.8°C

etc.

Les niveaux doivent être ceux réellement fournis par la source ou correctement interpolés avec indication explicite.

---

# 48. VENT

À partir de U/V :

speed = sqrt(u² + v²)

Calculer la direction avec convention météorologique correcte.

Tester soigneusement :

* orientation ;
* radians/degrés ;
* provenance ;
* convention "vient de" vs "va vers".

Ne jamais inverser les flèches.

---

# 49. COURANTS OCÉANIQUES

Même principe U/V.

Mais afficher clairement :

direction vers laquelle l'eau se déplace.

Ne pas confondre avec convention du vent.

---

# 50. ANIMATION VENT

Créer une couche WebGL de particules.

Fonctions :

pause

vitesse animation

altitude/niveau si disponible

date/heure

historique/prévision.

---

# 51. ANIMATION COURANTS

Même principe pour l'océan.

Couche différente du vent.

---

# 52. TIMELINE MONDIALE

Créer une timeline centrale.

Exemple :

1940 ───────────────────────── aujourd'hui ───── +15j

Selon source.

Couleurs conceptuelles :

historique

observation

prévision.

Ne jamais prétendre qu'une donnée existe avant sa couverture réelle.

---

# 53. MACHINE À REMONTER LE TEMPS

Fonction signature.

Sélection :

lieu

variable

date.

Puis slider année.

Exemple :

Grenoble

15 août

1950 ━━━━━━━━━━━━━━━━━ 2026

Afficher tous les 15 août.

---

# 54. COMPARATEUR

Supporter :

ville vs ville

pays vs pays

coordonnée vs coordonnée

année vs année

mois vs mois

saison vs saison

océan vs océan

source vs source.

---

# 55. SOURCE COMPARISON

Mode avancé :

Météo-France

VS

ERA5

VS

NOAA.

Graphique :

écart quotidien.

Calculer :

bias

MAE

RMSE

correlation

coverage

mais expliquer clairement ces métriques.

---

# 56. BIAS ANALYSIS

Possibilité de calculer sur une période :

ERA5 - Station.

Exemple :

biais moyen +0.3°C.

Mais ne pas appliquer automatiquement ce biais aux données historiques sans validation méthodologique.

---

# 57. NORMALES CLIMATIQUES

Supporter :

1961-1990

1971-2000

1981-2010

1991-2020

et futures périodes officielles.

La référence principale doit être configurable.

---

# 58. ANOMALIES

Anomalie :

value - climatological_normal.

Toujours indiquer la période de référence.

Ne jamais afficher :

"+1.4°C par rapport à la normale"

sans dire quelle normale.

---

# 59. STATISTIQUES QUOTIDIENNES

Calculer :

Tmin

Tmax

Tmoy

pluie

vent

rafale

amplitude

etc.

Pour un day-of-year :

moyenne

médiane

min

max

percentile

records

ranking.

---

# 60. STATISTIQUES MENSUELLES

Calculer notamment :

Tmin moyenne

Tmax moyenne

Tmoy

pluie

jours pluie

jours >25

jours >30

jours >35

jours >40

gel

nuits tropicales

records.

---

# 61. STATISTIQUES SAISONNIÈRES

Saisons météorologiques adaptées à l'hémisphère.

Ne pas appliquer naïvement :

DJF = hiver

dans l'hémisphère sud sans explication.

Créer :

Northern meteorological seasons

Southern meteorological seasons.

---

# 62. STATISTIQUES ANNUELLES

Calculer :

température

pluie

records

anomalies

classements

jours extrêmes

tendances.

---

# 63. RECORD ENGINE

Records par :

station

ville

région

pays

coordonnée grid

océan

variable

jour

mois

année.

Chaque record doit connaître sa source.

---

# 64. SCIENTIFIC HONESTY

Afficher :

"Record observé par station"

différemment de :

"maximum ERA5 de la cellule".

Ne jamais mélanger les deux dans le même classement sans indication.

---

# 65. COUVERTURE

Créer une vue :

DATA COVERAGE.

Afficher pour chaque variable :

première date

dernière date

% couverture

source

résolution.

---

# 66. DONNÉES MANQUANTES

NULL signifie :

absence.

0 signifie :

zéro mesuré.

Ne jamais les confondre.

---

# 67. INTERPOLATION

Toute interpolation doit créer :

origin_type = INTERPOLATED.

Stocker :

method

sources

distance

uncertainty.

---

# 68. GRID DATA

Pour chaque dataset grille :

grid_id

resolution

projection

longitude convention

latitude convention

time resolution

vertical levels

variable registry

dataset version.

---

# 69. EXTRACTION POINT

Pour une coordonnée :

supporter plusieurs méthodes :

nearest cell

bilinear

area average.

Ne jamais choisir sans documenter.

Par défaut le comportement dépend du produit.

---

# 70. CARTOGRAPHIE

Carte mondiale avec couches :

temperature

temperature anomaly

wind

rain

pressure

humidity

SST

waves

currents

salinity

sea level

snow

ice.

---

# 71. TILES

Ne jamais envoyer la grille brute mondiale au navigateur.

Produire :

raster tiles

vector tiles

ou textures GPU adaptées.

Utiliser cache CDN.

---

# 72. COLOR SCALES

Utiliser des palettes scientifiquement cohérentes et accessibles.

Attention :

couleur température absolue

≠

couleur anomalie.

Anomalie :

palette divergente centrée sur zéro.

---

# 73. ACCESSIBILITÉ

Ne jamais dépendre uniquement de la couleur.

Afficher :

valeurs

légende

tooltips

contrastes.

---

# 74. PAGE LIEU

Exemple :

`/weather/france/auvergne-rhone-alpes/isere/grenoble`

Afficher :

maintenant

historique

climat

records

sources

comparaison

stations

timeline.

---

# 75. PAGE DATE

Exemple logique :

Grenoble — 12 mai 1983.

Afficher :

observations disponibles

ERA5

comparaison

qualité

records du jour.

---

# 76. PAGE OCÉAN

Exemple :

Méditerranée occidentale.

Afficher :

SST

profil profondeur

vagues

courants

salinité

anomalies

historique.

---

# 77. FEATURE "LE JOUR DE MA NAISSANCE"

Entrée :

lieu

date.

Sortie :

temps observé

température

pluie

vent

contexte climatique.

Possibilité génération carte partageable.

---

# 78. FEATURE "CE JOUR DANS L'HISTOIRE"

Exemple :

6 septembre à Grenoble.

Afficher :

toutes années

records

moyenne

percentile

courbe.

---

# 79. FEATURE "QUAND J'ÉTAIS ENFANT"

Comparer :

période A

vs

période B.

Exemple :

1980-1990

vs

2016-2026.

---

# 80. FEATURE "MA VILLE SE RÉCHAUFFE-T-ELLE ?"

Afficher :

trend

normales

jours chauds

gel

nuits tropicales.

Toujours accompagner la méthode.

---

# 81. FEATURE "100 ANS EN 30 SECONDES"

Animation annuelle.

Température

pluie

anomalies.

---

# 82. FEATURE OCEAN TIME MACHINE

Sélectionner une coordonnée marine.

Voir :

SST

courants

vagues

salinité

dans le temps.

---

# 83. FEATURE SOURCE INSPECTOR

Bouton :

"Voir les sources".

Afficher :

source principale

alternatives

écarts

station distance

altitude

résolution grille

QC

licence.

Cette transparence est un avantage produit majeur.

---

# 84. API INTERNE

Créer :

`/api/v1/location`

`/api/v1/point`

`/api/v1/history`

`/api/v1/climate`

`/api/v1/records`

`/api/v1/sources`

`/api/v1/compare`

`/api/v1/ocean`

`/api/v1/forecast`

`/api/v1/stations`

`/api/v1/tiles`

Versionner tous les endpoints.

---

# 85. FUTURE API COMMERCIALE

Créer :

API keys

plans

quotas

metering

usage logs

rate limits.

Produits possibles :

Weather History API

Climate API

Ocean API

Source Fusion API

Climate Statistics API.

---

# 86. RÉPONSE API COMMERCIALE

Exemple conceptuel :

location

timestamp

variable

preferred_value

unit

source

source_type

confidence

alternatives

quality

provenance.

La transparence devient une valeur commerciale.

---

# 87. NE PAS REVENDRE NAÏVEMENT UNE API TIERS

Notre API ne doit pas être :

proxy_request → source gratuite.

Elle doit fournir :

normalisation

agrégation

cache

indexation

statistiques

fusion

provenance

SLA

simplicité.

C'est cette valeur ajoutée qui est vendue.

---

# 88. INGESTION BULK

Préférer :

bulk download

object storage

incremental update.

Éviter :

API call par utilisateur.

---

# 89. SYNCHRONISATION

Chaque dataset possède :

update_frequency

last_checked

last_successful_import

next_expected_update

source_version.

---

# 90. IDEMPOTENCE

Tout pipeline doit pouvoir être rejoué sans créer de doublons.

---

# 91. CHECKSUM

Chaque fichier téléchargé doit avoir un checksum.

Si checksum identique :

ne pas retraiter inutilement.

---

# 92. DATA VERSIONING

Ne pas simplement remplacer silencieusement un dataset corrigé.

Enregistrer :

version

downloaded_at

supersedes

changes.

---

# 93. QUARANTINE

Créer :

`raw_quarantine`

pour un fichier :

corrompu

schema changed

unexpected values

licence changed.

---

# 94. SCHEMA DRIFT

Détecter automatiquement :

colonne ajoutée

colonne supprimée

type changé

unit changed.

Bloquer le pipeline si changement dangereux.

---

# 95. QUALITY TESTS

Exemples :

Tmin <= Tmax

RH 0-100 sauf convention spéciale

precipitation >= 0

wind speed >= 0

salinity plausible selon domaine

wave height >= 0

latitude valide

longitude valide.

Les bornes scientifiques doivent être prudentes.

Ne jamais supprimer automatiquement une valeur extrême seulement parce qu'elle semble improbable.

---

# 96. OUTLIERS

Un outlier peut être :

erreur

ou

record réel.

Flagger.

Ne jamais supprimer silencieusement.

---

# 97. ROADMAP OBLIGATOIRE

Créer :

`docs/ROADMAP.md`

Toutes les tâches avec checkbox.

Mettre à jour en permanence.

---

# 98. PHASE 0 — RESEARCH & LEGAL

Avant tout code important :

* cataloguer Météo-France ;
* cataloguer ERA5 ;
* cataloguer ERA5-Land ;
* cataloguer NOAA GHCN ;
* cataloguer NOAA ISD ;
* cataloguer Copernicus Marine ;
* cataloguer ECMWF Open Data ;
* vérifier licences ;
* vérifier droits commerciaux ;
* identifier restrictions ;
* documenter attribution ;
* identifier formats ;
* estimer volumes ;
* estimer coûts.

Livrable :

DATA_SOURCES.md

DATA_LICENSES.md

---

# 99. PHASE 1 — ARCHITECTURE

Créer :

monorepo

PostgreSQL/PostGIS

object storage

worker

CI

observabilité

schemas.

---

# 100. PHASE 2 — SOURCE REGISTRY

Implémenter :

providers

datasets

versions

licences

legal status

provenance.

Aucun pipeline ne doit exister sans source registry.

---

# 101. PHASE 3 — FRANCE MVP

Importer :

Météo-France

régions

départements

communes

stations

quotidien.

Commencer par :

Isère.

Créer :

Grenoble

Crolles

La Pierre

comme zones de validation.

---

# 102. PHASE 4 — PREMIÈRE PAGE HISTORIQUE

Fonctions :

recherche commune

date historique

station utilisée

Tmin

Tmax

pluie

source

records

courbe.

---

# 103. PHASE 5 — ERA5 FRANCE

Ajouter ERA5.

Pour chaque jour test :

afficher :

Météo-France

ERA5.

Mesurer les différences.

Ne pas fusionner.

---

# 104. PHASE 6 — SOURCE FUSION ENGINE

Ajouter :

ranking

cross-source comparison

source lineage

dependency graph.

---

# 105. PHASE 7 — CONFIDENCE ENGINE

Créer score documenté.

Tester sur plusieurs zones :

plaine

montagne

littoral

ville.

---

# 106. PHASE 8 — NOAA

Importer un sous-ensemble GHCN.

Relier stations NOAA/Météo-France lorsqu'elles représentent la même station physique.

Tester déduplication.

---

# 107. PHASE 9 — FRANCE COMPLETE

Après validation :

toute France.

Créer pages SEO.

---

# 108. PHASE 10 — WORLD STATIONS

Importer GHCN progressivement.

Créer recherche internationale.

---

# 109. PHASE 11 — ERA5 WORLD

Ne pas importer naïvement tout ERA5 horaire immédiatement.

Définir stratégie :

point time series

regional cache

on-demand extraction

precomputed daily products.

Commencer par les variables prioritaires.

---

# 110. VARIABLES ERA5 PRIORITAIRES

Phase initiale :

2m temperature

2m dewpoint

total precipitation

10m U wind

10m V wind

surface pressure

mean sea level pressure

snow

surface solar radiation.

Ajouter ensuite seulement selon besoin.

---

# 111. PHASE 12 — OCEAN MVP

Copernicus Marine.

Première zone :

Méditerranée occidentale.

Variables :

SST

temperature depth

currents

salinity

waves.

---

# 112. PHASE 13 — GLOBAL OCEAN

Extension mondiale progressive.

---

# 113. PHASE 14 — ECMWF FORECAST

Ajouter prévisions.

Séparer clairement :

past

present

future.

---

# 114. PHASE 15 — GLOBAL MAP

Créer globe/carte.

Couches :

temp

wind

rain

ocean temp

waves

currents.

---

# 115. PHASE 16 — TIME MACHINE

Historique interactif mondial.

---

# 116. PHASE 17 — PREMIUM

Comptes

favoris

comparaisons avancées

exports

plus de couches

analyse source.

---

# 117. PHASE 18 — PRO

Fonctions professionnels.

Exports :

CSV

NetCDF subset éventuel

JSON

PDF

PNG.

---

# 118. PHASE 19 — API COMMERCIALE

API keys

quotas

Stripe

usage meter.

---

# 119. PHASE 20 — SCALE

Load tests.

Object storage optimisation.

CDN.

DB partitioning.

tile cache.

query profiling.

---

# 120. MVP EXACT

Le PREMIER MVP ne doit pas être mondial.

Il doit parfaitement faire :

France

Météo-France

ERA5

historique quotidien

source comparison

commune search

records

charts.

Une fois ce moteur fiable :

extension monde.

---

# 121. POURQUOI LA FRANCE EN PREMIER

Parce qu'elle permet de valider :

source nationale haute qualité

réseau de stations

historique

altitude

géographie

comparaison ERA5

licences commerciales.

Le moteur développé ne doit cependant contenir aucune dépendance architecturale empêchant le monde.

---

# 122. UX ACCUEIL

L'accueil doit immédiatement proposer :

Search anywhere on Earth

ou

Explore the globe.

Carte interactive.

Barre recherche.

Timeline.

---

# 123. DESIGN

Direction :

Earth Observatory

Data journalism

Scientific interface

premium

immersive

mais accessible.

Éviter :

dashboard SaaS banal.

Éviter :

interface copiée de Windy.

Créer une identité propre.

---

# 124. HOME HERO

Concept :

globe dynamique

vent léger

températures

timeline.

CTA :

"Explorer un lieu"

"Remonter dans le temps".

---

# 125. PAGE MOBILE

Sur mobile :

map

bottom sheet

timeline

layer selector.

Priorité tactile.

---

# 126. SEO

Pages indexables :

pays

région

ville

historique

climat

records

mois

année.

Exemples :

historical weather Grenoble

climate Grenoble

weather Grenoble 1983

temperature Grenoble August.

Ne pas créer de pages sans contenu significatif.

---

# 127. INTERNATIONALISATION

Prévoir dès l'architecture :

fr

en.

Puis autres langues.

Unités adaptables :

°C/°F

km/h/mph/knots

mm/in.

---

# 128. PARTAGE SOCIAL

Créer cartes générées serveur.

Exemple :

"Ce 15 août était le 4e plus chaud observé à Grenoble depuis 1950."

Inclure attribution nécessaire.

---

# 129. BUSINESS MODEL

Créer quatre étages.

## FREE

historique

cartes de base

records

pages publiques

comparaison limitée.

## PREMIUM

historique avancé

source inspector

exports

comparaisons multiples

favoris

couches supplémentaires.

## PRO

journalistes

tourisme

agriculture

énergie

événementiel

maritime

assurance

immobilier

collectivités.

## API

B2B.

---

# 130. OCEAN BUSINESS

Potentiels futurs :

nautisme

plongée

surf

pêche

transport maritime

ports

offshore

tourisme.

Attention :

ne jamais présenter l'application comme système officiel de sécurité maritime sans certification appropriée.

---

# 131. WEATHER BUSINESS

Potentiels :

agriculture

événementiel

énergie

BTP

tourisme

assurance

immobilier

médias.

---

# 132. CLIMATE BUSINESS

Potentiels :

études historiques

journalisme

risques

collectivités

enseignement

consulting.

Ne jamais présenter automatiquement une statistique comme étude climatologique certifiée.

---

# 133. PRICING HYPOTHÈSES

Tester, ne pas graver définitivement.

Premium :

5-10 €/mois.

Pro :

20-100+ €/mois.

API :

usage based.

Créer des tests de marché avant optimisation tarifaire.

---

# 134. COÛT MARGINAL

Objectif :

une page vue normale ne déclenche :

aucun téléchargement source

aucun appel Météo-France

aucun appel NOAA

aucun gros calcul ERA5.

Tout doit être :

préchargé

caché

pré-calculé

ou extrait efficacement.

---

# 135. FINOPS

Créer dashboard interne :

storage cost

DB cost

egress

CDN

worker compute

tile generation

ERA data storage

API costs

cost / 1000 pageviews

cost / active user

cost / API million calls.

---

# 136. NE PAS STOCKER L'INUTILE

ERA5 complet représente un volume énorme.

Ne pas télécharger immédiatement :

137 niveaux atmosphériques × toutes variables × monde × horaire.

Importer uniquement les produits utiles.

Principe :

PRODUCT NEED → DATA NEED.

Pas l'inverse.

---

# 137. HOT/WARM/COLD DATA

HOT :

données récentes très demandées.

WARM :

historique récent.

COLD :

archives.

Adapter le stockage.

---

# 138. CACHE

L1 application

L2 CDN

L3 Redis uniquement si justifié

L4 precomputed products

L5 object storage.

---

# 139. PRECOMPUTATION

Pré-calculer :

daily aggregates

monthly

annual

records

normal

day-of-year stats

popular cities.

---

# 140. POSTGRES PARTITIONING

Partitionner lorsque réellement nécessaire :

observations par année

ou source.

Mesurer avant surarchitecture.

---

# 141. INDEXATION SPATIALE

PostGIS GiST/SP-GiST selon cas.

Requêtes :

nearest station

stations radius

point-in-polygon

country lookup.

---

# 142. NEAREST STATION

Distance géodésique.

Mais choix source ne doit pas dépendre uniquement de distance.

Ajouter :

altitude

quality

coverage

variable

time.

---

# 143. STATION MATCHING SCORE

Créer score configurable.

Exemple initial :

distance 30%

altitude 20%

coverage 20%

quality 20%

continuity 10%.

À calibrer scientifiquement.

---

# 144. SOURCE SELECTION SCORE

Différent du station matching.

Prendre :

source authority

origin type

quality

resolution

temporal fit

spatial fit.

---

# 145. LAND/OCEAN MASK

Créer une détection fiable :

land

ocean

coastal.

Prendre en compte les grands lacs.

---

# 146. LARGE LAKES

Ne pas automatiquement traiter :

Lac Léman

Grands Lacs

comme océan.

Créer water body types.

---

# 147. BATHYMETRY FUTURE

Prévoir possibilité future :

profondeur fond

bathymétrie.

N'intégrer qu'une source commercialement compatible.

---

# 148. ADMIN BACKOFFICE

Afficher :

sources

status

imports

jobs

datasets

versions

licences

errors

coverage

costs

users

subscriptions.

---

# 149. SOURCE HEALTH

Dashboard :

Météo-France OK

ERA5 OK

NOAA OK

Marine OK

ECMWF OK.

Afficher :

last import

lag

errors.

---

# 150. ALERTING

Alerter :

pipeline failed

source unavailable

license changed

schema changed

unexpected volume

cost spike

data lag.

---

# 151. LICENCE CHANGE ALERT

Très important.

Les conditions d'un fournisseur peuvent évoluer.

Créer vérification périodique manuelle/automatisée des termes.

Si changement détecté :

LEGAL_REVIEW_REQUIRED.

Ne pas supprimer automatiquement les données mais bloquer nouveaux usages si nécessaire.

---

# 152. SECURITY

Secrets serveur uniquement.

Vault/env encrypted.

Rotation clés.

Rate limiting.

WAF si nécessaire.

SQL injection protection.

CSRF.

XSS.

CSP.

Dependency scanning.

---

# 153. API SOURCE SECRETS

Ne jamais exposer :

Météo-France token

Copernicus credentials

ECMWF credentials

storage credentials.

---

# 154. AUTH

Utilisateur :

FREE

PREMIUM

PRO

ADMIN

API_CUSTOMER.

---

# 155. STRIPE

Subscriptions

webhooks

invoices

usage based billing.

Idempotence obligatoire.

---

# 156. RGPD

Minimisation.

Consent.

Delete account.

Export user data.

Privacy policy.

Cookie policy.

---

# 157. OBSERVABILITY

Logs structurés.

Metrics.

Traces.

Dataset metrics.

Query metrics.

Import metrics.

---

# 158. TESTS

Unit

Integration

Data

Statistical

GIS

E2E

Load

Security.

---

# 159. GOLDEN DATASETS

Créer des cas de référence.

Exemples :

Grenoble

Paris

Mont Aiguille / altitude

Marseille côte

Méditerranée

New York

Tokyo.

Vérifier après chaque changement.

---

# 160. SCIENTIFIC REGRESSION TESTS

Un changement de code ne doit pas modifier silencieusement :

moyennes

records

units

day boundaries

wind direction.

Stocker résultats golden.

---

# 161. UI DATA DISCLAIMER

Afficher lorsque pertinent :

Observation station

Réanalyse

Satellite

Prévision

Estimation.

Utiliser icônes distinctes.

---

# 162. PUBLIC TRUST

Créer page :

"Comment obtenons-nous les données ?"

Expliquer simplement :

stations

satellites

réanalyse

modèles.

C'est essentiel à la marque.

---

# 163. SOURCES PAGE

Créer `/sources`.

Pour chaque source :

provider

dataset

variables

coverage

resolution

licence

last update

status.

---

# 164. METHOD PAGE

Créer `/methodology`.

Décrire :

matching

statistics

confidence

aggregation.

---

# 165. PAS D'IA POUR INVENTER DES DONNÉES

Une IA générative ne doit jamais créer une valeur météo manquante.

Si donnée absente :

"non disponible".

Une estimation doit provenir d'un algorithme scientifique documenté.

---

# 166. IA FUTURE

L'IA peut servir à :

expliquer

résumer

interpréter

rechercher.

Mais les valeurs numériques viennent exclusivement du moteur data.

---

# 167. FEATURES IA FUTURES

"Explique-moi pourquoi 2003 était exceptionnel."

"Compare les étés des années 1980 avec aujourd'hui."

L'IA doit recevoir les statistiques calculées.

Elle ne calcule pas arbitrairement les données.

---

# 168. PRODUCT DIFFERENTIATION

Notre avantage :

### DATA FUSION

Plusieurs sources.

### TRANSPARENCE

Origine visible.

### HISTORY

Décennies de données.

### PLANET

Terre + océans.

### TIME MACHINE

Explorer le passé.

### CONFIDENCE

Qualité expliquée.

### COMPARISON

Lieu/date/source.

### API

Une interface unifiée.

---

# 169. ARCHITECTURE DE MARQUE

Ne pas utiliser :

"Météo-France World"

ou un nom laissant croire à un partenariat officiel.

Créer une marque propre.

Mentionner les fournisseurs comme sources.

---

# 170. PREMIÈRE ACTION DE L'AGENT

Ne commence pas par créer 50 pages UI.

Effectue :

1. ROADMAP ;
2. architecture ;
3. source registry ;
4. audit licences ;
5. étude volume ;
6. schéma DB ;
7. pipeline Météo-France Isère ;
8. vraie donnée ;
9. page Grenoble ;
10. ERA5 Grenoble ;
11. comparaison sources.

---

# 171. PREMIÈRE PREUVE DE CONCEPT

Doit afficher pour Grenoble :

une date réelle

observation Météo-France

ERA5

écart

source

station

distance

altitude

quality.

---

# 172. DEUXIÈME PREUVE

Méditerranée :

coordonnée marine

SST

temperature profondeur

courant

vague

source Copernicus Marine.

---

# 173. TROISIÈME PREUVE

Prévision :

coordonnée

ECMWF Open Data

temp

vent

pluie.

---

# 174. CRITÈRE D'EXTENSION MONDIALE

Ne passer au monde entier que lorsque :

France ingestion stable

source engine stable

confidence engine stable

licences documentées

cost model validé

maps performantes.

---

# 175. AUCUNE FAUSSE DONNÉE EN PRODUCTION

Les mocks sont permis uniquement :

tests

Storybook

développement UI.

Ils doivent être clairement identifiés.

---

# 176. ADR

Chaque décision structurante :

`docs/adr/ADR-XXXX-*.md`

Exemples :

storage ERA5

source ranking

confidence

Copernicus

tiles.

---

# 177. CHANGELOG DATA

Créer :

`DATA_CHANGELOG.md`

Documenter :

nouvelle source

nouvelle version

changement méthode

recalcul massif.

---

# 178. REPRODUCIBILITÉ

Une statistique produite aujourd'hui doit pouvoir être reconstruite.

Versionner :

code

dataset

method.

---

# 179. DATA PRODUCT VERSION

Chaque réponse avancée peut contenir :

data_version

method_version.

---

# 180. SLO

Définir :

site availability

API availability

freshness targets

latency.

Ne pas promettre SLA aux clients FREE.

---

# 181. BACKUP

Sauvegarder fortement :

users

billing

configuration

source mapping

derived proprietary data.

Les fichiers publics retéléchargeables peuvent utiliser stratégie différente.

---

# 182. DISASTER RECOVERY

Documenter restauration :

DB

object storage metadata

secrets

services.

Tester périodiquement.

---

# 183. DEFINITION OF DONE

Le projet global n'est terminé que lorsque :

la recherche mondiale fonctionne ;

les sources sont versionnées ;

la licence de chaque source est connue ;

la provenance est visible ;

la France dispose d'observations officielles ;

ERA5 fonctionne ;

NOAA fonctionne ;

Copernicus Marine fonctionne ;

les océans sont supportés ;

ECMWF forecast fonctionne ;

les unités sont normalisées ;

les cartes fonctionnent ;

la timeline fonctionne ;

les comparaisons fonctionnent ;

la confiance est documentée ;

les données manquantes sont correctement gérées ;

le SEO fonctionne ;

le mobile fonctionne ;

les coûts sont mesurés ;

les tests scientifiques passent ;

la sécurité est auditée ;

les sauvegardes sont testées ;

le commercial est légalement documenté.

---

# 184. RÈGLES ABSOLUES DE L'AGENT

NE JAMAIS :

inventer une donnée ;

inventer une API ;

inventer une licence ;

inventer un quota ;

inventer un paramètre ;

supposer qu'une donnée gratuite est commercialisable ;

présenter une réanalyse comme mesure ;

présenter une estimation comme observation ;

moyenner aveuglément plusieurs sources ;

traiter deux bases comme indépendantes sans vérification ;

ignorer altitude ;

ignorer timezone ;

ignorer quality flags ;

ignorer provenance ;

effacer les raw data ;

mettre un secret dans le client ;

télécharger toute la planète sans étude de volume ;

développer une fonctionnalité sans test.

---

# 185. PRIORITÉ PRODUIT

Toujours privilégier :

FIABILITÉ

↓

TRAÇABILITÉ

↓

SIMPLICITÉ

↓

PERFORMANCE

↓

COÛT

↓

NOUVELLES FEATURES.

---

# 186. OBJECTIF COMMERCIAL FINAL

Le produit doit être capable de répondre :

"Donne-moi la meilleure information météo/climat/océan disponible pour n'importe quel point de la planète, n'importe quelle date disponible, explique-moi d'où elle vient et à quel point elle est fiable."

C'est cette capacité qui constitue le cœur du produit commercial.

---

# 187. COMMENCE MAINTENANT

Commence par PHASE 0.

Crée immédiatement :

docs/ROADMAP.md

docs/ARCHITECTURE.md

docs/DATA_SOURCES.md

docs/DATA_LICENSES.md

docs/GLOBAL_DATA_MODEL.md

docs/BUSINESS_MODEL.md

docs/COSTS.md

skills/

Puis effectue un audit réel des sources officielles.

Ne code aucun connecteur dont la licence commerciale n'est pas validée.

Ensuite construis le vertical slice :

ISÈRE
→ MÉTÉO-FRANCE
→ GRENOBLE
→ UNE DATE
→ ERA5
→ COMPARAISON
→ PROVENANCE
→ CONFIANCE.

Une fois ce vertical slice complètement fonctionnel, testé et documenté, poursuis la ROADMAP sans sauter d'étape.
