# Registre des licences — audit Phase 0

**Date d’audit :** 2026-09-06  
**Auditeur :** revue technique d’ingénierie (pas un avis d’avocat)  
**Règle :** `FREE ACCESS ≠ COMMERCIAL REUSE`. Aucune source `REQUIRES_REVIEW` / `RESTRICTED` / `DISABLED` ne doit entrer en production commerciale.

Ce document est la source de vérité juridique **provisoire** du produit. Le registre machine est `packages/licensing/registry/data-sources.yaml`. Toute activation d’un connecteur exige un `legal_status` compatible.

## Statuts

| `legal_status` | Signification | Usage production commerciale |
|---|---|---|
| `APPROVED_COMMERCIAL` | Licence lue, usage commercial autorisé sous conditions documentées | Oui, si conditions respectées |
| `APPROVED_NON_COMMERCIAL` | Usage non commercial seulement | Non |
| `REQUIRES_REVIEW` | Texte non lu, ambigu, ou conditions hors périmètre actuel | Non |
| `RESTRICTED` | Restrictions incompatibles avec l’offre prévue | Non |
| `DISABLED` | Interdit dans le produit (politique ou licence) | Non |

Une source `APPROVED_COMMERCIAL` n’autorise **pas** à :
- se présenter comme partenaire officiel du fournisseur ;
- omettre l’attribution ;
- exposer des secrets d’accès (jetons CDS, CMEMS, Météo-France API) ;
- revendre un proxy brut vers l’API du fournisseur.

---

## 1. Météo-France — Open Data bulk (`meteo.data.gouv.fr`)

| Champ | Valeur constatée |
|---|---|
| `source_id` | `meteo-france.climatologie.quotidienne.bulk` |
| `provider` | Météo-France |
| `dataset` | Données climatologiques de base — quotidiennes |
| `product_id` | data.gouv `6569b51ae64326786e4e8e1a` |
| `license_name` | Licence Ouverte / Open Licence |
| `license_version` | 2.0 |
| `legal_status` | **APPROVED_COMMERCIAL** |
| `commercial_use_allowed` | oui |
| `redistribution_allowed` | oui |
| `derivative_work_allowed` | oui |
| `attribution_required` | oui |
| `share_alike` | non |
| `storage_allowed` | oui |
| `cache_allowed` | oui |
| `api_resale_allowed` | dérivés / valeur ajoutée : oui ; proxy API fournisseur : non (règle produit) |
| `logo_usage_allowed` | **non établi** — n’utiliser aucun logo Météo-France sans accord séparé |
| `terms_url` | https://meteo.data.gouv.fr/ |
| `license_url` | https://www.etalab.gouv.fr/licence-ouverte-open-licence/ |
| `source_page` | https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes |
| `confluence` | https://confluence-meteofrance.atlassian.net/wiki/spaces/OpenDataMeteoFrance/pages/621510657 |

**Preuves :**
- Fiche data.gouv du jeu quotidien : producteur Météo-France, licence **Licence Ouverte / Open Licence version 2.0** (consultée 2026-09-06).
- Confluence officielle Open Data Météo-France, section « Conditions d’accès » : *« Sans redevance sous Licence Ouverte d’Etalab. La source à indiquer est "Météo-France". »* Suggestions : « Source : Météo-France » ou « Informations créées à partir de données de Météo-France ».
- Texte Licence Ouverte 2.0 (Etalab) : droit gratuit, non exclusif, mondial, illimité, **y compris commercial** ; reproduction, adaptation, redistribution ; **mention de paternité** (source + date de mise à jour) ; pas de suggestion d’endossement officiel.

**Attribution minimale (bulk) :**
> Source : Météo-France — Données climatologiques de base (quotidiennes), Licence Ouverte 2.0, mises à jour le [date de la ressource réutilisée].

**Jeux connexes, même licence constatée sur data.gouv / Confluence :**

| Jeu | ID data.gouv | Statut |
|---|---|---|
| Quotidiennes | `6569b51ae64326786e4e8e1a` | APPROVED_COMMERCIAL |
| Horaires | `6569b4473bedf2e7abad3b72` | APPROVED_COMMERCIAL |
| 6 minutes | (catalogue Confluence / topic climatologie de base) | APPROVED_COMMERCIAL *sous réserve de la fiche licence du jeu* |
| Décadaires / mensuelles | catalogue Confluence | APPROVED_COMMERCIAL *sous réserve fiche* |
| LSH (longues séries homogénéisées) | https://www.data.gouv.fr/datasets/donnees-changement-climatique-lsh-longues-series-homogeneisees | APPROVED_COMMERCIAL — `origin_type = HOMOGENIZED` |
| SQR | Confluence | APPROVED_COMMERCIAL — série sélectionnée, pas une observation brute |
| SIM (SAFRAN-ISBA) | Confluence / meteo.data.gouv | APPROVED_COMMERCIAL — `origin_type = MODEL` |
| Fiches climatologiques | Confluence | APPROVED_COMMERCIAL pour les données ; ne pas copier la mise en page officielle comme si c’était un document MF |

**Timezone (quotidien MF) :** la fiche data.gouv indique *« Les heures sont exprimées en UTC pour la métropole et en FU pour l’outre-mer »*. Un « jour climatologique » n’est pas reconstruit naïvement à partir d’horaires sans méthodologie source.

**Mise à jour (quotidien MF) :** annuelle avant 1950 ; mensuelle de 1950 à N-2 ; quotidienne pour les deux dernières années.

### API Météo-France (DPClimatologie)

| Champ | Valeur |
|---|---|
| `source_id` | `meteo-france.climatologie.api` |
| `license_name` | Licence d’utilisation API + Licence Ouverte 2.0 |
| `legal_status` | **APPROVED_COMMERCIAL** pour la *réutilisation des données* ; l’*accès API* est soumis à inscription et conditions du portail |
| `terms_url` | https://portail-api.meteofrance.fr/web/DonneesPubliquesClimatologie/license |
| `notes` | La licence API dit que les données exposées sont soumises à la LO 2.0, **complétée** par la licence d’utilisation API et les CPU/CGV du portail. L’architecture produit **privilégie le bulk** (`meteo.data.gouv.fr`) pour l’historique. L’API n’est pas le chemin d’ingestion du MVP. Secrets d’API : serveur uniquement. |

**Décision produit :** connecteur bulk quotidien **autorisé**. Connecteur API **non prioritaire**, à n’activer qu’avec compte, quotas et secrets hors client.

---

## 2. ERA5 (C3S / CDS)

| Champ | Valeur constatée |
|---|---|
| `source_id` | `copernicus.c3s.era5.single-levels-hourly` |
| `provider` | Copernicus Climate Change Service (C3S) / ECMWF |
| `dataset` | ERA5 hourly data on single levels from 1940 to present |
| `product_id` | CDS `reanalysis-era5-single-levels` |
| `doi` | 10.24381/cds.adbb2d47 |
| `coverage` | mondial, 1940 → présent, horaire, grille ~0.25° (atmosphère), ~0.5° (vagues) |
| `origin_type` | **REANALYSIS** — jamais « observation » ni « station » |
| `legal_status` | **APPROVED_COMMERCIAL** |
| `license_name` | Creative Commons Attribution 4.0 (catalogue CDS actuel) |
| `license_url` | https://creativecommons.org/licenses/by/4.0/ |
| `cds_page` | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels |
| `attribution_guide` | https://confluence.ecmwf.int/display/CKB/How+to+acknowledge+and+cite+a+Climate+Data+Store+%28CDS%29+catalogue+entry |

**Preuves :**
- Page CDS ERA5 single levels : réanalyse mondiale horaire depuis 1940 ; GRIB ; mise à jour quotidienne ; ERA5T (latence ~5 jours) peut différer de la version finale (2–3 mois).
- Forum ECMWF (2025-07-02) : la *Licence to use Copernicus Products* du CDS/ADS/EWDS est **remplacée par CC-BY**. L’usage après cette date vaut acceptation CC-BY 4.0.
- Guide ECMWF d’attribution (mis à jour 2026-06-18) : ECMWF publie des données ouvertes sous **CC-BY-4.0**, y compris usage commercial, sous réserve d’attribution.
- Cas d’usage CKB ERA5 : pour ce jeu, « CC-BY Licence only » ; citation du DOI ; mention Copernicus ; disclaimer Commission / ECMWF.

**Ancienne licence Copernicus Products (rev. 12)** — toujours utile pour comprendre les obligations historiques et les formulations d’attribution C3S :
- https://cds.climate.copernicus.eu/licences/licence-to-use-copernicus-products
- Usage « any purpose in so far as it is lawful » ; attribution visible au programme Copernicus ; disclaimer Commission/ECMWF.

**Attribution UI (données adaptées / agrégées) :**
> Contient des informations Copernicus Climate Change Service modifiées [année]. Ni la Commission européenne ni l’ECMWF ne sont responsables de l’usage qui pourrait être fait des informations ou données Copernicus qu’elles contiennent.  
> ERA5 hourly data on single levels from 1940 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). DOI: 10.24381/cds.adbb2d47 (accès le [date]). Licensed under CC-BY-4.0.

**Compte CDS :** l’accès programmatique CDS exige un compte et l’acceptation de la licence du jeu. Les identifiants restent côté serveur. Le PoC point Grenoble 1983-05-12 a été lu via le miroir public ARCO ERA5 (`gs://gcp-public-data-arco-era5/...zarr-v3`), **même DOI / même jeu**, pas une autre réanalyse.

**Dépendance :** ERA5 assimile des observations (dont des réseaux nationaux). Un accord ERA5 / station **n’est pas** une confirmation indépendante.

---

## 3. ERA5-Land

| Champ | Valeur constatée |
|---|---|
| `source_id` | `copernicus.c3s.era5-land.hourly` |
| `dataset` | ERA5-Land hourly data from 1950 to present |
| `product_id` | CDS `reanalysis-era5-land` |
| `resolution` | 0.1° (natif ~9 km) |
| `coverage` | terrestre, 1950 → présent, horaire |
| `origin_type` | **REANALYSIS** (composante surface forcée par ERA5 ; observations non assimilées directement) |
| `legal_status` | **APPROVED_COMMERCIAL** (même régime CDS / CC-BY-4.0 que les produits C3S du store) |
| `cds_page` | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land |

**Règle produit :** ERA5-Land **ne remplace pas** une station. Complément terrestre uniquement. La page CDS rappelle une correction de gradient (« lapse rate correction ») entre la grille ERA5 et la grille plus fine : toute correction d’altitude affichée chez nous doit rester `DERIVED` / optionnelle.

---

## 4. NOAA GHCN Daily

| Champ | Valeur constatée |
|---|---|
| `source_id` | `noaa.ncei.ghcn-daily` |
| `provider` | NOAA / NCEI |
| `dataset` | Global Historical Climatology Network Daily |
| `origin_type` | **OBSERVED** (réseau agrégé international) |
| `source_dependency_group` | `international_station_aggregation` |
| `legal_status` | **APPROVED_COMMERCIAL** |
| `license_name` | CC0 1.0 (diffusion NODD / AWS Open Data) ; œuvres du gouvernement US généralement du domaine public |
| `license_url` | https://creativecommons.org/publicdomain/zero/1.0/ |
| `nodd_page` | https://registry.opendata.aws/noaa-ghcn/ |

**Preuves :** le registre AWS Open Data NOAA GHCN-D indique que les données NOAA diffusées via NODD sont sous **CC0-1.0**, sans restriction d’usage. NOAA **demande** une attribution pour les données non altérées, **interdit** de suggérer un endossement NOAA, et **interdit** de présenter des données modifiées comme NOAA originales.

**Attribution (bonne pratique, demandée par NOAA même si CC0 n’oblige pas) :**
> NOAA Global Historical Climatology Network Daily (GHCN-D), accessed [date] from [URL]. Not affiliated with or endorsed by NOAA.

**Attention scientifique :** une station GHCN peut être la même entité physique qu’une station Météo-France. Relier via `physical_station_entities` ; ne pas compter deux observations indépendantes.

---

## 5. NOAA ISD / GHCNh

| Champ | Valeur constatée |
|---|---|
| `source_id` | `noaa.ncei.isd` / `noaa.ncei.ghcnh` |
| `dataset` | Integrated Surface Database / GHCN Hourly |
| `origin_type` | **OBSERVED** |
| `source_dependency_group` | `international_station_aggregation` |
| `legal_status` | **APPROVED_COMMERCIAL** pour la diffusion NODD CC0-1.0 documentée (GHCNh YAML Open Data Registry) |
| `notes` | Vérifier la fiche NCEI du canal d’accès réellement utilisé avant ingestion. ISD historique et GHCNh ne sont pas un seul dataset dans notre catalogue. |

---

## 6. NOAA OISST

| Champ | Valeur constatée |
|---|---|
| `source_id` | `noaa.ncei.oisst-v2.1-avhrr` |
| `dataset` | NOAA OISST v2.1 AVHRR daily 0.25° |
| `origin_type` | **SATELLITE** / **BLENDED** (analyse SST) — pas une mesure in situ |
| `legal_status` | **APPROVED_COMMERCIAL** |
| `notes` | ERDDAP NCEI : *« The data may be used and redistributed for free »* ; disclaimer d’inexactitude possible ; pas d’usage « legal » au sens preuve juridique. Ne pas présenter OISST comme observation de bouée. |

---

## 7. Copernicus Marine Service (CMEMS)

| Champ | Valeur constatée |
|---|---|
| `source_id` | `copernicus.marine.*` (un `source_id` **par produit** du catalogue) |
| `provider` | E.U. Copernicus Marine Service / Mercator Ocean International |
| `license_name` | Licence to use the Copernicus Marine Service Products |
| `legal_status` | **APPROVED_COMMERCIAL** pour les produits du catalogue CMEMS proprement dit |
| `commercial_use_allowed` | oui (« for any purpose » y compris Value Added / Derivative Work) |
| `redistribution_allowed` | oui (forme originale ou dérivée, avec crédit) |
| `attribution_required` | oui, **visible** (home ou page d’accès produits) + DOI |
| `storage_allowed` | oui (copies raisonnables / backup) |
| `terms_url` | https://marine.copernicus.eu/user-corner/service-commitments-and-licence |
| `citation_help` | https://help.marine.copernicus.eu/en/articles/4444611-how-to-cite-copernicus-marine-products-and-services |

**Permissions lues dans la licence (annexe, 2026-09-06) :**
- 2.1 : licence gratuite.
- 2.2 : mondiale, non exclusive, royalty-free, perpétuelle : copies internes, **modification / produits à valeur ajoutée / œuvres dérivées pour tout usage**, redistribution de l’original.
- 2.4 : crédits selon le cas :
  - dérivé : `Generated using E.U. Copernicus Marine Service Information; [DOIs]`
  - redistribution : `E.U. Copernicus Marine Service Information; [DOIs]`
  - publication : `This study has been conducted using E.U. Copernicus Marine Service Information; [DOIs]`
- 3.1 : DPI des produits CMEMS = Union européenne.
- 3.2 : DPI créés par modification = licencié.
- 4 : aucune garantie de qualité / adéquation.
- 8.1 : la licence **peut être révisée à tout moment** → alerte `LICENCE_CHANGE`.
- SLA §3 : service gratuit jusqu’à la fin prévue du service (texte lu : 30 juin 2028). La FAQ CMEMS affirme que l’usage avec attribution restera gratuit ; **suivre les mises à jour de ToU**.

**Produits d’autres fournisseurs redistribués par CMEMS** (SeaDataNet, EUMETSAT/OSI SAF, GHRSST, EMODnet, C3S, ESA-CCI) : crédits dans la doc produit — **ne pas activer** sans audit produit par produit (`REQUIRES_REVIEW` par défaut).

**Compte CMEMS :** login personnel, non transférable. Secrets serveur uniquement. Ne jamais présenter l’app comme système officiel de sécurité maritime.

**MVP océan (Phase 12) :** Méditerranée occidentale, produits CMEMS **identifiés et DOI cités** avant ingestion. Pas de mélange automatique SST / courant / vague dans un seul `source_id`.

---

## 8. ECMWF Open Data (prévisions IFS / AIFS)

| Champ | Valeur constatée |
|---|---|
| `source_id` | `ecmwf.open-data.ifs` / `ecmwf.open-data.aifs` |
| `license_name` | CC-BY-4.0 **et** ECMWF Terms of Use |
| `legal_status` | **APPROVED_COMMERCIAL** pour le **sous-ensemble Open Data publié** |
| `terms_url` | https://www.ecmwf.int/en/forecasts/datasets/open-data |
| `origin_type` | **FORECAST** — jamais affiché comme mesure |

**Preuves (page Open Data, 2026-09-06) :**
- Sous-ensemble des prévisions temps réel IFS et AIFS, gratuit, CC-BY-4.0 + Terms of Use, redistribution et usage commercial **sous attribution**.
- Résolution Open Data : 0.25°, GRIB2.
- Archive glissante : **12 runs** (~2–3 jours), cycles 00/06/12/18 UTC.
- Portail limité à **500 connexions simultanées**.
- Réplication cloud : AWS, Azure, GCP ; client `ecmwf-opendata`.
- Produits **haute résolution / catalogue complet** : licence CC-BY-4.0 d’après les annonces 2025, mais **livraison** pouvant impliquer *Service Charges* et *Service Agreement*.

| Accès | Licence d’usage des données | Livraison | Statut produit |
|---|---|---|---|
| Open Data subset public (0.25°, rolling) | CC-BY-4.0 + ToU | gratuite via portail/cloud | APPROVED_COMMERCIAL |
| Catalogue temps réel complet / HR / archive historique | CC-BY-4.0 (annoncé) | peut être payant (distribution) | **REQUIRES_REVIEW** avant tout contrat de livraison |

**Ne pas supposer** que tout le catalogue ECMWF est téléchargeable gratuitement. Distinguer dans le registre : `OPEN` / `RESTRICTED` / `COMMERCIAL-LICENSE-REQUIRED` / `UNKNOWN`.

---

## 9. E-OBS — interdit par défaut

| Champ | Valeur |
|---|---|
| `source_id` | `ecad.e-obs` |
| `legal_status` | **DISABLED** |
| `license_url` | https://cds.climate.copernicus.eu/licences/licence-to-use-E-OBS-products |
| `policy_url` | https://www.ecad.eu / Data Policy ECA&D |

**Preuve :** licence E-OBS (CDS) et politique ECA&D : données **strictement réservées** aux projets de **recherche et d’éducation non commerciales**. Accès gratuit ≠ réutilisation commerciale.

Aucune tuile, aucune moyenne, aucun « fond de carte » E-OBS dans l’offre commerciale.

---

## 10. Référentiels géographiques

| Source | Licence constatée | Statut | Usage prévu |
|---|---|---|---|
| IGN Géoplateforme WMTS / WMS (ORTHO + Plan IGN) | Licence Ouverte 2.0 (Géoplateforme, 2026-09-06) | **APPROVED_COMMERCIAL** | Affichage carte et extraits ponctuels d’UI (`public/images/places/`) ; pas d’extract massif ; attribution « © IGN — Géoplateforme » |
| IGN ADMIN EXPRESS / COG | Licence Ouverte 2.0 (fiche data.gouv IGN, à reconfirmer à l’import) | **APPROVED_COMMERCIAL** *sous réserve fiche* | France : communes, départements, régions ; identifiant INSEE |
| API Découpage administratif (geo.api.gouv.fr) | Open Data / Licence Ouverte 2.0 (dataservice data.gouv, 2026-09-06) | **APPROVED_COMMERCIAL** | Import V1 **centres** de communes (Isère). **Pas** de contours. OSM est partenaire de l’API : ne pas importer de polygones via ce canal. |
| Natural Earth | domaine public (à reconfirmer sur naturalearthdata.com au moment de l’import) | **REQUIRES_REVIEW** jusqu’à capture de la page licence | pays / lieux mondiaux |
| OpenStreetMap | ODbL 1.0 (share-alike base) | **REQUIRES_REVIEW** | ne pas extraire une base OSM substantielle sans stratégie ODbL |
| GeoNames | CC-BY (à reconfirmer) | **REQUIRES_REVIEW** | toponymes |

---

## 11. Non audités — interdits jusqu’à revue

`legal_status = REQUIRES_REVIEW` (liste non exhaustive) :

- NASA (POWER, GPM, GHRSST selon canal)
- EUMETSAT
- JMA
- DWD Open Data (souvent ouverte mais conditions propres)
- Met Office
- Environment and Climate Change Canada
- Bureau of Meteorology (Australie)
- services nationaux européens hors Météo-France
- bathymétrie GEBCO / EMODnet
- tuiles Mapbox / Google (propriétaires)

---

## 12. Obligations transverses d’attribution

Infrastructure : chaque valeur porte `source_id`, `dataset`, `version`, `license_name`, `ingested_at`. L’UI n’affiche **que** les sources réellement utilisées.

Ne jamais :
- afficher un logo fournisseur sans droit logo ;
- laisser croire à un partenariat officiel ;
- omettre le disclaimer Copernicus / CMEMS / ECMWF quand ces données sont montrées.

---

## 13. Surveillance des changements de licence

Les licences CMEMS (art. 8.1), CDS et portails nationaux peuvent changer.

Processus :
1. Revue périodique manuelle des URL `license_url` / `terms_url`.
2. Si divergence détectée → `legal_status = REQUIRES_REVIEW` et `LEGAL_REVIEW_REQUIRED`.
3. Ne pas supprimer les archives raw.
4. Bloquer **nouveaux** usages / redistributions si le nouveau texte l’exige.

---

## 14. Décisions d’activation des connecteurs

| Connecteur | Coder maintenant ? |
|---|---|
| Météo-France quotidien bulk | **Oui** |
| Météo-France horaire bulk | Oui, après quotidien Isère |
| ERA5 point / sous-région (variables prioritaires) | **Oui** (licence commerciale OK) |
| ERA5-Land | Plus tard (Phase 5+), licence OK |
| NOAA GHCN | Phase 8, licence OK |
| NOAA ISD/GHCNh | Phase 8+, licence OK si canal NODD |
| CMEMS Méditerranée | Phase 12, licence OK, DOI par produit |
| ECMWF Open Data subset | Phase 14, licence OK |
| E-OBS | **Non** |
| API Météo-France comme chemin principal | **Non** |
| ECMWF catalogue HR payant | **Non** tant que `REQUIRES_REVIEW` |

Ce document ne constitue pas un conseil juridique. Un juriste doit relire le registre avant ouverture d’une offre payante (Premium / Pro / API).
