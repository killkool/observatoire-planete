# Architecture de production — Plateforme météo historique France

> **Statut : document directeur de production**
>
> Ce document définit les choix techniques à considérer comme **référence principale** pour la V1 France.
>
> Objectif : construire une plateforme météo historique **grand public**, rapide, fiable, SEO-friendly, économiquement viable et évolutive sans devoir réécrire l'ensemble de l'architecture plus tard.
>
> **Runtime local actuel :** Next.js 15 + SQLite + Recharts. Vercel / Supabase / R2 / worker Docker / ECharts = cible, pas encore branchés. Décision : [ADR-0002](./adr/ADR-0002-production-stack-v1.md).

---

# 1. Vision produit

Le produit n'est pas un outil scientifique destiné aux ingénieurs ou aux météorologues.

La V1 doit être pensée pour le **grand public français**.

L'utilisateur doit pouvoir comprendre rapidement :

- quel temps il faisait à une date donnée ;
- comment la météo de sa ville a évolué ;
- quels sont les records locaux ;
- comment comparer deux villes ;
- comment comparer deux années ;
- comment les étés ou les hivers ont évolué ;
- si une journée était particulièrement chaude, froide ou pluvieuse ;
- quel temps il faisait le jour de sa naissance.

Toute la complexité scientifique doit rester dans le backend.

L'interface doit rester simple.

---

# 2. Principe d'architecture

L'architecture doit respecter cette séparation :

```text
DONNÉES SOURCES
      │
      ▼
PIPELINE DATA
      │
      ▼
DONNÉES NORMALISÉES
      │
      ▼
STATISTIQUES PRÉCALCULÉES
      │
      ▼
API / SITE
      │
      ▼
UTILISATEUR
```

Le visiteur du site ne doit **jamais déclencher directement** :

- un téléchargement Météo-France ;
- un traitement massif de CSV ;
- un calcul sur plusieurs décennies ;
- une requête lourde ERA5 ;
- une agrégation de millions de lignes.

Les traitements lourds doivent être réalisés **en amont**.

---

# 3. Stack de production retenue

| Besoin | Outil retenu | Statut |
|---|---|---|
| Frontend / site | Next.js 16 LTS ou LTS stable supérieure | ✅ Retenu |
| Langage | TypeScript strict | ✅ Retenu |
| Hébergement web | Vercel | ✅ Retenu |
| UI | Tailwind CSS + composants maison | ✅ Retenu |
| Graphiques | Apache ECharts | ✅ Retenu |
| Cartographie | MapLibre GL JS | ✅ Retenu |
| Tuiles cartographiques | PMTiles | ✅ Retenu |
| Base principale | PostgreSQL + PostGIS | ✅ Retenu |
| Fournisseur DB | Supabase | ✅ Retenu |
| ORM applicatif | Drizzle ORM | ✅ Retenu |
| SQL analytique | SQL natif PostgreSQL | ✅ Retenu |
| Stockage fichiers météo | Cloudflare R2 | ✅ Retenu |
| ETL / imports météo | Python | ✅ Retenu |
| Traitement datasets | Polars + PyArrow + DuckDB | ✅ Retenu |
| Worker d'import | Docker séparé du site | ✅ Retenu |
| Validation API | Zod | ✅ Retenu |
| Tests unitaires | Vitest | ✅ Retenu |
| Tests navigateur | Playwright | ✅ Retenu |
| CI/CD | GitHub Actions | ✅ Retenu |
| Monitoring erreurs | Sentry | ✅ Retenu |
| Analytics produit | Plausible ou PostHog EU | ✅ Retenu |
| Paiement futur | Stripe | ⏳ Plus tard |
| Redis | Non au lancement | ❌ À éviter |
| ClickHouse | Non au lancement | ❌ À éviter |
| Elasticsearch | Non au lancement | ❌ À éviter |
| Kubernetes | Non au lancement | ❌ À éviter |
| Microservices multiples | Non au lancement | ❌ À éviter |

---

# 4. Architecture générale cible

```text
                         INTERNET
                            │
                            ▼
                     VERCEL / CDN
                            │
                            ▼
                       NEXT.JS
                  ┌─────────┴─────────┐
                  │                   │
                  ▼                   ▼
               CACHE              API ROUTES
                                      │
                                      ▼
                              CONNECTION POOLER
                                      │
                                      ▼
                         POSTGRESQL + POSTGIS
                              SUPABASE
                         ┌────────────┼────────────┐
                         │            │            │
                         ▼            ▼            ▼
                    DONNÉES       STATISTIQUES   UTILISATEURS
                    JOURNALIÈRES   PRÉCALCULÉES


                         PIPELINE DATA

                     MÉTÉO-FRANCE
                            │
                            ▼
                      PYTHON WORKER
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
           CLOUDFLARE R2             POLARS
            RAW ARCHIVE                │
                                      ▼
                                   PARQUET
                                      │
                                      ▼
                                   DUCKDB
                                      │
                                      ▼
                                    COPY
                                      │
                                      ▼
                                 POSTGRESQL
```

---

# 5. Rôle de chaque composant

## Next.js

Responsabilités :

- pages publiques ;
- SEO ;
- rendu serveur ;
- navigation ;
- API légères ;
- authentification côté application ;
- interface utilisateur ;
- appels aux données précalculées.

Next.js ne doit pas réaliser les gros traitements météo.

---

## Vercel

Responsabilités :

- hébergement du site ;
- CDN ;
- cache ;
- ISR ;
- déploiement ;
- previews ;
- scaling du frontend.

Les gros imports météo ne doivent pas tourner dans des fonctions Vercel.

---

## PostgreSQL / PostGIS

Responsabilités :

- régions ;
- départements ;
- communes ;
- stations ;
- observations quotidiennes ;
- statistiques ;
- records ;
- mapping commune/station ;
- utilisateurs ;
- favoris ;
- sources ;
- imports ;
- qualité ;
- index géographiques.

PostgreSQL constitue la **source de données rapide du site**.

---

## Supabase

Supabase reste le fournisseur PostgreSQL managé.

Utiliser :

- PostgreSQL ;
- PostGIS ;
- connection pooling ;
- sauvegardes ;
- authentification si souhaité ;
- RLS lorsque nécessaire.

Éviter de dépendre de fonctionnalités propriétaires si PostgreSQL standard suffit.

---

## Cloudflare R2

R2 contient les fichiers lourds.

Exemples :

```text
raw/
processed/
parquet/
exports/
maps/
tiles/
```

Ne jamais utiliser PostgreSQL comme archive de fichiers sources.

---

## Python Worker

Le worker réalise :

- téléchargement ;
- validation ;
- extraction ZIP ;
- parsing ;
- normalisation ;
- conversion ;
- calculs statistiques ;
- détection des mises à jour ;
- imports PostgreSQL ;
- génération d'exports ;
- génération éventuelle de tuiles.

Le worker doit être empaqueté en Docker.

---

# 6. Pipeline de données

Pipeline cible :

```text
Météo-France
     │
     ▼
Téléchargement
     │
     ▼
R2 / RAW
     │
     ▼
Validation checksum
     │
     ▼
Polars
     │
     ▼
Nettoyage / normalisation
     │
     ▼
Parquet
     │
     ▼
DuckDB / contrôles
     │
     ▼
PostgreSQL staging
     │
     ▼
COPY
     │
     ▼
Tables production
     │
     ▼
Statistiques précalculées
```

---

# 7. Règle critique : conserver les données RAW

Tous les fichiers sources doivent être conservés.

Exemple :

```text
raw/meteo-france/2026/09/...
```

Objectifs :

- pouvoir reconstruire la base ;
- vérifier une erreur ;
- comparer deux versions ;
- reproduire un calcul ;
- changer le schéma sans retélécharger tout l'historique.

Ne jamais écraser silencieusement une source originale.

---

# 8. Modèle de données quotidiennes

Pour la V1 grand public, les observations quotidiennes sont prioritaires.

## Mauvais modèle

Ne pas créer :

```text
station
date
variable
value
```

Exemple :

```text
Grenoble | 1985-07-15 | TMIN | 16.2
Grenoble | 1985-07-15 | TMAX | 31.4
Grenoble | 1985-07-15 | RR   | 0.0
Grenoble | 1985-07-15 | WIND | 14.2
```

Cela multiplie énormément le nombre de lignes.

---

## Modèle recommandé

Une ligne par :

> station + journée

Exemple :

```text
daily_observations

id
station_id
date

temperature_min
temperature_max
temperature_mean

precipitation

wind_mean
wind_gust
wind_direction

relative_humidity

sunshine_duration

snow_depth

quality_flags

source_id

created_at
updated_at
```

Principe :

```text
1 station × 1 jour = 1 ligne
```

---

# 9. Tables principales

## Géographie

```text
regions
departments
communes
```

Chaque commune doit utiliser son **code INSEE** comme identifiant administratif principal.

---

## Stations

```text
weather_stations
station_history
station_variables
```

---

## Observations

```text
daily_observations
```

Créer `hourly_observations` uniquement si la stratégie V1 démontre un besoin réel.

---

## Mapping

```text
commune_station_mapping
```

Exemple de champs :

```text
commune_id
station_id
distance_km
altitude_difference
coverage_score
quality_score
final_score
valid_from
valid_to
```

---

## Statistiques

```text
monthly_statistics
seasonal_statistics
annual_statistics
day_of_year_statistics
climate_normals
weather_records
```

---

## Sources

```text
data_sources
data_source_licenses
import_jobs
import_errors
data_quality_events
```

---

# 10. Partitionnement PostgreSQL

La table `daily_observations` doit être conçue pour supporter plusieurs décennies.

Ne pas commencer immédiatement par des dizaines de partitions sans mesure.

Prévoir cependant une stratégie native PostgreSQL.

Option recommandée à valider par benchmark :

```text
daily_observations
│
├── observations_1900_1909
├── observations_1910_1919
├── observations_1920_1929
├── observations_1930_1939
├── ...
├── observations_2010_2019
└── observations_2020_2029
```

Alternative :

partitionnement annuel si les benchmarks le justifient.

---

# 11. Index essentiels

Minimum :

```text
(station_id, date)
```

Évaluer ensuite :

```text
(date)
(station_id)
```

PostGIS :

```text
GIST(station_location)
GIST(commune_geometry)
```

Recherche texte :

```text
pg_trgm
unaccent
GIN
```

---

# 12. Recherche des communes

Ne pas utiliser Elasticsearch au lancement.

PostgreSQL doit gérer :

- noms ;
- variantes ;
- accents ;
- fautes légères ;
- code postal ;
- département.

Exemple :

```text
grenobl
```

doit pouvoir retrouver :

```text
Grenoble
```

---

# 13. Mapping commune ↔ station

Une commune ne possède pas nécessairement une station.

Le système doit sélectionner la station la plus pertinente.

Le score peut prendre en compte :

| Critère | Exemple de poids initial |
|---|---:|
| Distance | 30 % |
| Différence d'altitude | 20 % |
| Couverture historique | 20 % |
| Qualité | 20 % |
| Continuité | 10 % |

Ces pondérations doivent rester configurables.

Ne jamais présenter une mesure comme provenant directement de la commune si la station est ailleurs.

Interface grand public :

> Les mesures utilisées proviennent de la station météo la plus adaptée, située à environ 7 km.

Détails techniques accessibles uniquement au clic.

---

# 14. Données horaires

La V1 est principalement basée sur les données quotidiennes.

Stratégie :

```text
QUOTIDIEN
→ PostgreSQL

HORAIRE COMPLET
→ R2 / Parquet

HORAIRE FRÉQUEMMENT UTILISÉ
→ cache ou table spécialisée si besoin
```

Ne pas importer immédiatement l'intégralité des horaires dans PostgreSQL sans besoin produit.

---

# 15. ERA5

ERA5 reste une source secondaire.

Utilisations V1 possibles :

- contrôle de cohérence ;
- complément pour zones sans station pertinente ;
- préparation de certaines tendances ;
- future évolution mondiale.

Ne pas télécharger ERA5 mondial.

Pour la V1 :

```text
France
+
petit buffer frontalier si nécessaire
+
variables limitées
+
résolution adaptée
```

ERA5 doit rester dans R2 / Parquet / Zarr selon le besoin.

---

# 16. Pré-calcul des statistiques

Règle fondamentale :

> les gros calculs ne doivent pas être effectués pendant la consultation.

Exemple incorrect :

```text
Visiteur ouvre Grenoble
       │
       ▼
SELECT 100 ans
       │
       ▼
calcul moyenne
       │
       ▼
calcul records
       │
       ▼
calcul jours >30°C
       │
       ▼
calcul percentiles
```

À éviter.

---

## Architecture correcte

```text
daily_observations
        │
        ▼
     WORKER
        │
        ├── monthly_statistics
        ├── seasonal_statistics
        ├── annual_statistics
        ├── weather_records
        ├── day_of_year_statistics
        └── climate_normals
```

Puis :

```text
Utilisateur
    │
    ▼
SELECT petite table précalculée
    │
    ▼
réponse rapide
```

---

# 17. Statistiques à précalculer

## Mensuelles

- température minimale moyenne ;
- température maximale moyenne ;
- température moyenne ;
- précipitations ;
- jours de pluie ;
- jours >25 °C ;
- jours >30 °C ;
- jours >35 °C ;
- jours >40 °C ;
- jours de gel ;
- nuits tropicales ;
- records.

---

## Saisonnières

- température ;
- pluie ;
- jours chauds ;
- gel ;
- records ;
- anomalies.

---

## Annuelles

- température moyenne ;
- précipitations ;
- jours >30 °C ;
- jours >35 °C ;
- jours de gel ;
- nuits tropicales ;
- classement historique.

---

## Jour de l'année

Exemple :

15 août.

Pré-calculer :

- moyenne ;
- minimum ;
- maximum ;
- médiane ;
- classement ;
- historique disponible.

---

# 18. Cache web

Ordre de priorité :

```text
Next.js cache
       ↓
Vercel CDN
       ↓
PostgreSQL précalculé
```

Ne pas ajouter Redis tant qu'un problème mesuré ne le nécessite pas.

---

# 19. SEO / ISR

Les pages communes changent peu.

Utiliser :

- SSR ;
- ISR ;
- cache CDN.

Exemple :

```text
/meteo/grenoble
/meteo/annecy
/meteo/crolles
```

Une fois la page générée :

```text
Premier utilisateur
      │
      ▼
Next.js
      │
      ▼
Cache CDN
      │
 ┌────┴────┐
 ▼         ▼
user      user
```

Les visites suivantes ne doivent quasiment plus solliciter la DB.

---

# 20. Graphiques

Outil :

> Apache ECharts

Règle :

le navigateur ne doit jamais recevoir plus de données que nécessaire.

Exemple :

Pour afficher 100 ans de température annuelle :

```text
1927 → valeur
1928 → valeur
...
2026 → valeur
```

≈ 100 points.

Ne pas envoyer 36 500 observations quotidiennes pour produire ce graphique.

Les détails sont chargés à la demande.

---

# 21. Carte

Outil :

> MapLibre GL JS

Ne pas envoyer toutes les géométries de France sous forme d'un énorme GeoJSON.

Pipeline :

```text
Contours administratifs
       │
       ▼
PMTiles
       │
       ▼
Cloudflare R2
       │
       ▼
MapLibre
```

---

# 22. UX grand public

Le backend peut manipuler :

```text
TMIN
TMAX
ERA5
QC
percentile
anomaly
homogenized
```

Mais l'utilisateur doit voir :

```text
Température minimale

Température maximale

Mesure officielle

Plus chaud que 94 % des journées similaires

2,4°C plus chaud que la moyenne habituelle
```

---

# 23. Niveaux d'information

Toute page doit suivre trois niveaux.

## Niveau 1 — Réponse immédiate

Exemple :

```text
31,4°C

Une journée particulièrement chaude

4e 15 août le plus chaud disponible
```

---

## Niveau 2 — Contexte

```text
Moyenne habituelle : 27,1°C

Écart : +4,3°C

Record : 34,8°C
```

---

## Niveau 3 — Technique

Accessible via :

```text
Voir les détails
```

Informations :

- station ;
- distance ;
- qualité ;
- provenance ;
- méthode ;
- source ;
- couverture.

---

# 24. Fonctionnalités grand public prioritaires

## Quel temps faisait-il ?

```text
Ville + date
```

---

## Le jour de ma naissance

```text
Ville + date de naissance
```

---

## Ce jour dans l'histoire

Exemple :

```text
Tous les 15 août depuis le début de la série
```

---

## Quand j'étais enfant

Comparer deux périodes.

---

## Ma ville se réchauffe-t-elle ?

Expliquer simplement :

- températures ;
- jours chauds ;
- gel ;
- évolution.

---

## Comparer deux villes

Exemple :

```text
Grenoble VS Annecy
```

---

## Comparer deux années

Exemple :

```text
Été 2003 VS été 2026
```

---

# 25. CI/CD

GitHub Actions doit lancer :

```text
lint
TypeScript
tests unitaires
tests DB
tests API
tests Playwright principaux
build
```

Aucune mise en production si le build ou les tests critiques échouent.

---

# 26. Tests

## Vitest

Pour :

- fonctions ;
- statistiques ;
- conversions ;
- mapping ;
- calculs.

---

## Playwright

Pour :

- recherche ;
- page commune ;
- sélection date ;
- comparaison ;
- navigation mobile ;
- formulaires.

---

# 27. Tests scientifiques

Créer des tests spécifiques.

Exemples :

```text
Tmin <= Tmax
```

```text
precipitation >= 0
```

```text
date dans période station
```

```text
NULL != 0
```

```text
une année incomplète ne doit pas être présentée comme complète
```

---

# 28. Imports PostgreSQL

Ne jamais importer plusieurs millions de lignes avec :

```text
INSERT
INSERT
INSERT
INSERT
```

Utiliser :

```text
source
  │
  ▼
staging table
  │
  ▼
COPY
  │
  ▼
validation
  │
  ▼
MERGE / INSERT SELECT
```

---

# 29. Drizzle ORM

Drizzle est utilisé pour :

- CRUD ;
- utilisateurs ;
- configuration ;
- pages applicatives ;
- petites requêtes.

SQL natif utilisé pour :

- statistiques ;
- PostGIS ;
- imports ;
- partitions ;
- vues matérialisées ;
- grosses requêtes.

Ne pas forcer l'utilisation de l'ORM partout.

---

# 30. DuckDB

DuckDB doit être considéré comme un outil data, pas comme la base du site.

Utilisations :

- analyser Parquet ;
- vérifier datasets ;
- statistiques temporaires ;
- conversions ;
- contrôles ;
- traitements hors PostgreSQL.

---

# 31. Objectif de volume

La V1 France ne doit pas être architecturée pour plusieurs pétaoctets.

Cible raisonnable :

| Composant | Ordre de grandeur cible |
|---|---:|
| PostgreSQL lancement | dizaines à centaines de Go |
| PostgreSQL long terme France | < 1 To idéalement |
| R2 initial | quelques centaines de Go |
| R2 mature | quelques To |
| Architecture extensible | dizaines de To |
| ERA5 mondial local | NON |
| Copernicus mondial local | NON |

---

# 32. Outils à ne pas utiliser au lancement

## Kubernetes

Inutile.

---

## Elasticsearch

Inutile pour ~35 000 communes.

---

## Redis systématique

Inutile tant que le cache existant suffit.

---

## ClickHouse

Inutile tant que PostgreSQL tient correctement la charge France.

---

## Microservices

Éviter une architecture avec :

```text
service-temperature
service-records
service-search
service-city
service-station
...
```

La V1 doit rester simple.

---

# 33. Quand ajouter Redis ?

Seulement si les métriques montrent :

- cache serveur insuffisant ;
- répétition importante de requêtes ;
- latence DB évitable ;
- fonctionnalités temps réel nécessitant un cache partagé.

---

# 34. Quand ajouter ClickHouse ?

Seulement si le projet atteint par exemple :

- données mondiales ;
- très gros volume horaire ;
- milliards de mesures ;
- requêtes analytiques lourdes ;
- API analytique B2B.

À ce moment :

```text
PostgreSQL
→ transactionnel / metadata

ClickHouse
→ analytique massif
```

---

# 35. Quand étendre au monde ?

La V1 France doit être stable avant.

Conditions :

- imports Météo-France fiables ;
- mapping communes/stations fiable ;
- statistiques fiables ;
- performance maîtrisée ;
- SEO opérationnel ;
- coûts connus ;
- UX validée ;
- architecture data stable.

Puis :

```text
France
  ↓
Europe
  ↓
Monde
```

---

# 36. Observabilité

Mettre en place :

- logs structurés ;
- erreurs Sentry ;
- temps requêtes ;
- temps API ;
- taille DB ;
- taux de cache ;
- imports ;
- échecs ;
- coûts.

Dashboard interne minimum :

```text
last import
import duration
rows imported
rows rejected
database size
R2 size
API latency
page latency
error rate
```

---

# 37. Monitoring des coûts

Suivre :

```text
Vercel
Supabase
R2
worker
bandwidth
logs
emails
analytics
```

Mesures utiles :

```text
coût / 1000 pages vues
coût / utilisateur actif
coût stockage / mois
coût worker / import
```

---

# 38. Sauvegardes

## PostgreSQL

Sauvegarder fortement :

- utilisateurs ;
- mapping ;
- configurations ;
- statistiques propriétaires ;
- données business.

---

## RAW météo

La donnée publique peut être retéléchargée.

Mais conserver une archive R2 permet :

- reproductibilité ;
- sécurité ;
- audit.

---

# 39. Sécurité

Obligatoire :

- secrets uniquement serveur ;
- `.env.example` sans valeur ;
- aucune clé dans le frontend ;
- validation Zod ;
- requêtes paramétrées ;
- rate limiting des endpoints sensibles ;
- CSP ;
- protections XSS/CSRF ;
- mises à jour dépendances.

---

# 40. Variables d'environnement

Exemples :

```text
DATABASE_URL
DIRECT_DATABASE_URL

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_RAW
R2_BUCKET_PROCESSED

METEO_FRANCE_CLIENT_ID
METEO_FRANCE_CLIENT_SECRET

SENTRY_DSN
```

Les secrets sensibles ne doivent jamais être exposés au client.

---

# 41. Organisation du repository

Structure recommandée :

```text
/
├── apps/
│   ├── web/
│   └── worker/
│
├── packages/
│   ├── database/
│   ├── weather-core/
│   ├── climate-statistics/
│   ├── geo/
│   ├── ui/
│   └── shared/
│
├── pipelines/
│   ├── meteo-france/
│   └── era5/
│
├── docs/
│
├── scripts/
│
├── tests/
│
└── infrastructure/
```

---

# 42. Roadmap technique

## Phase 1 — Fondations

- Next.js ;
- Supabase ;
- PostGIS ;
- Drizzle ;
- R2 ;
- Docker worker ;
- GitHub Actions.

---

## Phase 2 — Géographie France

- régions ;
- départements ;
- communes ;
- INSEE ;
- géométries ;
- recherche.

---

## Phase 3 — Météo-France

- catalogue ;
- stations ;
- métadonnées ;
- fichiers quotidiens ;
- quality flags ;
- historique.

---

## Phase 4 — Pipeline pilote

Commencer par l'Isère.

```text
source
↓
R2
↓
Polars
↓
Parquet
↓
PostgreSQL
```

---

## Phase 5 — Mapping communes/stations

Tester :

- Grenoble ;
- Crolles ;
- La Pierre ;
- zones montagneuses ;
- zones rurales.

---

## Phase 6 — Statistiques

Créer :

- mois ;
- saisons ;
- années ;
- records ;
- day-of-year ;
- normales.

---

## Phase 7 — Interface grand public

Créer :

- recherche ;
- page commune ;
- date historique ;
- records ;
- graphiques.

---

## Phase 8 — Fonctions différenciantes

- jour de naissance ;
- ce jour dans l'histoire ;
- quand j'étais enfant ;
- comparer deux villes ;
- comparer deux années.

---

## Phase 9 — France entière

Importer la totalité du pays.

---

## Phase 10 — SEO

- pages communes ;
- sitemaps ;
- ISR ;
- metadata ;
- structured data.

---

## Phase 11 — Optimisation

- profiler SQL ;
- optimiser indexes ;
- cache ;
- Core Web Vitals ;
- compression.

---

## Phase 12 — ERA5 France

Ajouter uniquement si nécessaire.

---

# 43. Règles de décision

Avant d'ajouter un nouvel outil, répondre à :

1. Quel problème concret résout-il ?
2. Ce problème existe-t-il réellement aujourd'hui ?
3. PostgreSQL / Next.js / R2 peuvent-ils déjà le résoudre ?
4. Quel coût ajoute cet outil ?
5. Quelle maintenance ajoute-t-il ?
6. Peut-on l'ajouter plus tard sans casser l'architecture ?

Si l'outil n'est pas nécessaire aujourd'hui :

> ne pas l'ajouter.

---

# 44. Principes à ne jamais casser

## Principe 1

Une mesure météo n'est stockée qu'une fois.

Ne jamais copier les mêmes observations pour chaque commune.

---

## Principe 2

La commune pointe vers une station.

```text
station
  │
  ├── commune A
  ├── commune B
  └── commune C
```

---

## Principe 3

Les statistiques lourdes sont précalculées.

---

## Principe 4

Les archives vivent en object storage.

---

## Principe 5

PostgreSQL sert les données chaudes et structurées.

---

## Principe 6

Le frontend reçoit uniquement les données nécessaires.

---

## Principe 7

La complexité scientifique reste derrière l'interface.

---

## Principe 8

Une évolution mondiale ne doit pas imposer de surarchitecture à la France aujourd'hui.

---

# 45. Architecture d'évolution future

La V1 doit permettre plus tard :

```text
FRANCE
  │
  ▼
EUROPE
  │
  ▼
MONDE
```

Sans changer les concepts principaux :

```text
WeatherProvider
WeatherStation
DailyObservation
WeatherStatistics
Place
Source
```

Ajouter plus tard :

```text
MeteoFranceProvider
DWDProvider
NOAAProvider
etc.
```

Mais ne pas construire maintenant tous ces providers.

---

# 46. Définition de réussite technique

L'architecture est considérée correcte si :

- une page commune est rapide ;
- une visite ne déclenche aucun import externe ;
- une page populaire est servie majoritairement par cache ;
- les gros fichiers restent hors PostgreSQL ;
- les imports peuvent être rejoués ;
- une erreur de pipeline ne détruit pas les RAW ;
- la provenance est conservée ;
- les statistiques sont reproductibles ;
- la base peut grandir sans refonte immédiate ;
- le site reste performant sur mobile ;
- les coûts restent mesurables ;
- l'infrastructure peut évoluer par étapes.

---

# 47. Décisions figées

Les décisions suivantes doivent être considérées comme **la base technique officielle du projet V1 France** :

1. **Next.js + Vercel** pour le web.
2. **TypeScript strict**.
3. **PostgreSQL + PostGIS** comme base principale.
4. **Supabase** comme fournisseur PostgreSQL.
5. **Cloudflare R2** pour les fichiers et archives.
6. **Python + Polars + PyArrow + DuckDB** pour le pipeline data.
7. **Docker** pour le worker.
8. **Drizzle** pour le CRUD, SQL natif pour le lourd.
9. **Une ligne par station et par jour** pour les observations quotidiennes.
10. **Statistiques précalculées**.
11. **ECharts** pour les graphiques.
12. **MapLibre + PMTiles** pour les cartes.
13. **GitHub Actions + Vitest + Playwright** pour la qualité.
14. **Pas de Redis au lancement**.
15. **Pas de ClickHouse au lancement**.
16. **Pas d'Elasticsearch au lancement**.
17. **Pas de Kubernetes au lancement**.
18. **Pas de microservices prématurés**.
19. **Pas d'ERA5 mondial en stockage local**.
20. **France et grand public avant extension mondiale**.

---

# 48. Résumé de l'architecture

```text
                  ┌──────────────────────┐
                  │      UTILISATEUR      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   VERCEL / NEXT.JS   │
                  │    CDN + ISR + SSR   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ CONNECTION POOLER    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ POSTGRESQL / POSTGIS │
                  │      SUPABASE        │
                  └──────────┬───────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
      OBSERVATIONS       STATISTIQUES      GÉOGRAPHIE
      JOURNALIÈRES       PRÉCALCULÉES      UTILISATEURS


                  PIPELINE INDÉPENDANT

                  ┌──────────────────────┐
                  │     MÉTÉO-FRANCE     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    PYTHON WORKER     │
                  │       DOCKER         │
                  └──────────┬───────────┘
                             │
             ┌───────────────┴───────────────┐
             │                               │
             ▼                               ▼
      ┌───────────────┐              ┌───────────────┐
      │ CLOUDFLARE R2 │              │ POLARS        │
      │ RAW / PARQUET │              │ PYARROW       │
      │ EXPORTS       │              │ DUCKDB        │
      └───────────────┘              └───────┬───────┘
                                             │
                                             ▼
                                      POSTGRESQL COPY
```

---

# 49. Directive finale

Toute nouvelle décision technique doit préserver les objectifs suivants :

> **Rapide pour l'utilisateur.**

> **Simple à maintenir.**

> **Peu coûteux à exploiter.**

> **Fiable scientifiquement.**

> **Compréhensible par le grand public.**

> **Évolutif sans surarchitecture.**

Le projet doit être capable de grandir par ajout progressif de composants, et non par réécriture complète de ses fondations.
