# Catalogue des sources de données

**Audit :** 2026-09-06  
**Complément juridique :** [DATA_LICENSES.md](./DATA_LICENSES.md) · [LEGAL.md](./LEGAL.md)

**V1 :** Météo-France est la source **principale**. ERA5 est un **complément** (France seulement). NOAA, CMEMS, ECMWF forecast : catalogués ci-dessous, **PARK** ([BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md)).

**Principe (inchangé) :** plusieurs sources, jamais une seule. Le moteur classe, compare et n’assimile pas une réanalyse à une observation. Aucune source n’est activée en production commerciale sans `legal_status` compatible.

---

## 1. Moteur de sources (concept)

Entrée :

- latitude, longitude
- altitude éventuelle
- date/heure (UTC)
- variable canonique
- résolution souhaitée

Recherche, dans l’ordre **configurable** (jamais figé pour toutes les variables) :

**V1 France :**

1. observation officielle Météo-France appropriée
2. autre station Météo-France pertinente
3. longue série homogénéisée lorsque le dataset est identifié et adapté
4. ERA5 / ERA5-Land en complément

**V2 (extensible, non exécuté) :** réseau international, satellite, océan, prévision — toujours sans moyenne aveugle.

Sortie : toutes les sources utiles + valeur préférée éventuelle + alternatives + confiance + provenance.

---

## 2. Types d’origine (`DataOriginType`)

`OBSERVED` · `REANALYSIS` · `SATELLITE` · `FORECAST` · `DERIVED` · `HOMOGENIZED` · `INTERPOLATED` · `BLENDED` · `MODEL` · `CLIMATOLOGY`

Interdits UI :

- réanalyse présentée comme observation
- interpolation présentée comme mesure
- prévision présentée comme réel
- moyenne aveugle de types hétérogènes

---

## 3. France — Météo-France (premier pays)

**Rôle :** source nationale prioritaire pour les observations climatologiques françaises, après audit licence (APPROVED_COMMERCIAL, Licence Ouverte 2.0).

### Accès

| Canal | Usage produit | Priorité MVP |
|---|---|---|
| Bulk `meteo.data.gouv.fr` / data.gouv.fr | Ingestion historique | **1** |
| API DPClimatologie (`portail-api.meteofrance.fr`) | Complément ciblé, jamais millions d’appels | non-MVP |
| Ancienne Publithèque | fermée 2024-09-30 | n/a |

Documentation opérationnelle : [Confluence Open Data Météo-France — Données climatologiques](https://confluence-meteofrance.atlassian.net/wiki/spaces/OpenDataMeteoFrance/pages/621510657).

### Jeux

| Produit | Grain | Format | Couverture | Origin | Notes |
|---|---|---|---|---|---|
| Climatologie de base quotidienne | jour / station | CSV.GZ par département et période | métropole + outre-mer, depuis ouverture du poste | OBSERVED | Contrôle climatologique. Jeu `6569b51ae64326786e4e8e1a`. ~624 fichiers principaux. |
| Climatologie de base horaire | heure / station | CSV.GZ | idem | OBSERVED | Jeu `6569b4473bedf2e7abad3b72`. |
| 6 minutes | 6 min, précipitations | CSV.GZ | depuis ~2005 au plus tôt | OBSERVED | Non-MVP. |
| Décadaires / mensuelles | 10 j / mois | CSV.GZ | depuis ouverture | OBSERVED / DERIVED selon paramètre | |
| LSH | mois, séries homogénéisées | CSV | stations sélectionnées | HOMOGENIZED | TN, TX, IN, RR. Mise à jour annuelle. |
| SQR | quotidien de référence | CSV | stations sélectionnées | HOMOGENIZED / DERIVED | Sélection méthodologique, pas le brut. |
| SIM SAFRAN-ISBA | grille ~8 km (0.072°) | CSV.GZ | métropole | MODEL | Ne pas étiqueter « station ». |
| Métadonnées postes | JSON mensuel | JSON | tous départements | — | NUM_POSTE 8 chiffres, LAT/LON, ALTI, DATOUVR/DATFERM, TYPE_POSTE_ACTUEL 0–5. |
| Fiches climatologiques | PDF | PDF | sous-ensemble | CLIMATOLOGY | Records/normales officiels ; ne pas cloner l’identité visuelle. |

### Paramètres quotidiens utiles au MVP Isère

Fichiers souvent nommés `RR-T-Vent` (précipitations, températures, vent). Colonnes déjà utilisées par le prototype local : `NUM_POSTE`, `NOM_USUEL`, `LAT`, `LON`, `ALTI`, `AAAAMMJJ`, `TN`, `TX`, `TM`.

Le descriptif officiel des paramètres est le PDF Confluence `CLIMATOLOGIE_Donnees_quotidiennes_descriptif.pdf` — à verser dans `raw/meteo-france/docs/` au premier import, **sans inventer** la liste complète des colonnes.

### Types de postes (Confluence)

| Code | Sens |
|---|---|
| 0 | synoptique, temps réel, expertise J+1 |
| 1 | automatique Radome-Resome, TR, expertise J+1 |
| 2 | automatique non Radome-Resome, TR, expertise J+1 |
| 3 | automatique TR, expertise différée (≤ M+21 j) |
| 4 | manuel ou auto, acquisition différée, expertise différée |
| 5 | expertise non garantie |

Ces codes alimentent `station_quality`, pas un score magique.

### Hiérarchie **exemple** France, variable température quotidienne

Configurable dans `source_rankings` :

1. Observation Météo-France (poste proche, altitude, couverture, qualité)
2. GHCN si la même entité physique n’est pas déjà comptée
3. ERA5-Land (terre) en complément
4. ERA5

Ce n’est **pas** une règle universelle toutes variables / tous pays.

### Stations de validation (Phase 3)

- Grenoble
- Crolles
- La Pierre  

Département 38 (Isère). Identifiants de postes : ceux du fichier MF, jamais un nom seul.

---

## 4. ERA5 — colonne vertébrale historique mondiale

| | |
|---|---|
| Quoi | 5e réanalyse ECMWF, assimilation d’observations + modèle |
| Période | 1940 → présent |
| Résolution CDS (single levels) | 0.25° atmosphère, 0.5° vagues |
| Temps | horaire ; moyennes mensuelles précalculées |
| Incertitude | ensemble 10 membres, 3 h, 0.5° |
| Fichier | GRIB (CDS) ; Zarr/ARCO chez certains miroirs |
| Fraîcheur | ERA5T ~5 jours ; final 2–3 mois |
| V1 | Point Grenoble **5 jours** (12 mai 1982 et 1986, 11–13 mai 1983) ingéré (2t + rosée + TP + vent 10 m + MSL + SP + neige SWE + SSRD + rafale). Quotidien 2t bbox France **3 jours** en JSON (2709 mailles / jour), pas importé en SQL. Pas de grille mondiale, pas 1940–2026. |
| UI | Grand public : « Estimation climatique ». Technique (« En savoir plus ») : réanalyse ERA5 — jamais « Observation ERA5 » |

### Variables prioritaires (Phase 11, sous-ensemble France d’abord)

| Canonique | ERA5 (noms CDS / CF typiques) |
|---|---|
| `air_temperature` | 2 m temperature |
| `dew_point` | 2 m dewpoint |
| `precipitation` | total precipitation |
| `wind_u` / `wind_v` | 10 m U / V |
| `pressure` | surface pressure |
| `sea_level_pressure` | mean sea level pressure |
| `snow_depth` | snow (ARCO = équivalent en eau) |
| `solar_radiation` | surface solar radiation downwards |
| `wind_gust` | instantaneous 10 m wind gust |

Ne **pas** télécharger 137 niveaux × toutes variables × monde × horaire.

### Stratégie de stockage (anti-anti-pattern)

Interdit : grille mondiale horaire ligne-à-ligne dans PostgreSQL.

Autorisé dès le vertical slice :

1. série temporelle **au point** (Grenoble, communes Isère)
2. cache régional France (bbox) des **quotidiens** dérivés
3. extraction à la demande + cache objet (Zarr/GRIB)
4. produits précalculés populaires

Extraction point : méthode documentée (`nearest` par défaut ERA5 sauf ADR contraire), jamais silencieuse.

---

## 5. ERA5-Land

- Terre uniquement, 0.1°, 1950 → présent, horaire.
- Forçage atmosphérique ERA5 + correction d’altitude de forçage (lapse rate côté producteur).
- Utile : T 2 m terrestre, précipitations, humidité/température du sol, rayonnement.
- Ne remplace pas une station locale.

---

## 6. NOAA

Chaque dataset NOAA = une source distincte.

| Dataset | Rôle | Grain | Origin |
|---|---|---|---|
| GHCN Daily | réseau mondial stations historiques | jour | OBSERVED |
| ISD / GHCNh | synoptique / horaire mondial | heure | OBSERVED |
| OISST v2.1 | SST analyse 0.25° | jour | BLENDED / SATELLITE |

GHCN : Tmin, Tmax, précipitation, neige, selon station et flags QC. Conserver les flags. Ne jamais dropper un outlier silencieux.

---

## 7. Copernicus Marine

Source marine majeure. Un produit = un `source_id`.

Domaines catalogue (SLA CMEMS) : Global, Arctic, Baltic, Atlantic NW Shelf, Iberia–Biscay–Ireland, **Mediterranean**, Black Sea.

Paramètres d’intérêt progressif : SST, T(z), salinité, courants U/V, vagues (Hs, direction, période), niveau de mer, glace, chloro / O2 si produit validé.

Profondeurs : uniquement les niveaux **réellement fournis** (ou interpolation explicite `INTERPOLATED`).

**MVP océan :** Méditerranée occidentale — SST, profil, courants, salinité, vagues. Produits et DOI à figer en Phase 12 (pas d’ID inventé ici).

Convention courants : direction **vers laquelle l’eau va**. Distincte du vent météorologique (« vient de »).

---

## 8. ECMWF Open Data

Prévision, pas le passé.

- IFS open : 2t, 10u/10v, tp, msl, vagues (`swh`, `mwd`, …), etc. (tables officielles de la page Open Data, cycle IFS 50r1 au 13 mai 2026).
- AIFS : même régime CC-BY + ToU.
- Steps 00/12z jusqu’à 360 h ; 06/18z plus courts.
- Archive glissante courte : **l’historique de prévision n’est pas ERA5**. Pour garder des runs, les stocker nous-mêmes (object storage) dès l’activation.

UI : bandeau « prévision » distinct de « observation » et « réanalyse ».

---

## 9. E-OBS

Catalogué uniquement pour **interdiction**. `DISABLED`. Voir [DATA_LICENSES.md](./DATA_LICENSES.md).

---

## 10. Lieux et masques

| Couche | Source candidate | Statut licence |
|---|---|---|
| Communes / dép. / régions FR | IGN ADMIN EXPRESS COG (cible) ; **V1 Isère** : API Découpage administratif geo.api.gouv.fr (centres uniquement) | APPROVED_COMMERCIAL |
| Identifiant FR | code INSEE | — |
| Pays ISO 3166 | registre interne + source géographique audité | — |
| Land/ocean/coast | à choisir (ERA5 LSM, GSHHG, etc.) | audit au moment du choix |
| Grands lacs | type `water_body` ≠ océan | — |

---

## 11. Volumes (ordres de grandeur)

Détail et hypothèses : [COSTS.md](./COSTS.md).

| Dataset | Ordre | Commentaire |
|---|---|---|
| MF quotidien France | Go | CSV.GZ départementaux ; 624 ressources sur le jeu quotidien |
| ERA5 hourly single levels **complet** | ~10² TB | estimation tierce ~406 TB (Earth Data Hub) ; **ne pas télécharger** |
| ERA5 9 variables, bbox France, horaire, 1940–2026 | ~10¹–10² Go non compressé | estimation interne, voir COSTS |
| ERA5 9 variables **quotidien** France | Go | stratégie MVP |
| GHCN daily mondial | Go | |
| CMEMS Méditerranée sous-ensemble | dizaines de Go selon produits | figer en Phase 12 |
| ECMWF Open Data | faible si rolling ; croît si on archive les runs | |

Principe : **besoin produit → besoin data**, jamais l’inverse.

---

## 12. Formats et lac

```
raw/{provider}/{dataset}/{version}/{yyyy}/{mm}/
standardized/{variable}/...
derived/{product}/...
public/{tiles,exports}/
```

| Format | Usage |
|---|---|
| CSV / CSV.GZ | MF, GHCN |
| GRIB / GRIB2 | ERA5, ECMWF |
| NetCDF | scientifique source / CMEMS |
| Zarr | multidim cloud |
| Parquet | tables analytiques |
| COG / PMTiles | cartes |
| PostgreSQL/PostGIS | métadonnées, stations, agrégats, records — **pas** la grille mondiale horaire |

Ne jamais écraser `raw/`. Checksum + quarantine + schema drift.

---

## 13. Dépendances entre sources

| Groupe | Exemple |
|---|---|
| `direct_station` | poste Météo-France |
| `international_station_aggregation` | GHCN, ISD (peuvent inclure le même poste) |
| `reanalysis_assimilated` | ERA5 |
| `land_surface_forced` | ERA5-Land |
| `satellite` | certains SST |
| `model` | SIM, IFS/AIFS forecast |

3 sources ≠ 3 confirmations indépendantes.

---

## 14. Connecteurs nationaux futurs

`CountryWeatherProvider` configurable. Activation seulement après audit licence.

| Pays | Candidat | Statut |
|---|---|---|
| FR | Météo-France | audité |
| DE | DWD | REQUIRES_REVIEW |
| US | NOAA/NWS | partiellement (GHCN/ISD/OISST) ; NWS réel-temps REQUIRES_REVIEW |
| GB | Met Office | REQUIRES_REVIEW |
| CA | ECCC | REQUIRES_REVIEW |

---

## 15. État du prototype existant (dépôt)

Le dépôt contient aujourd’hui **ClimaFrance** : import CSV Météo-France quotidien vers SQLite, moyenne « France » arithmétique des stations importées, dashboard local.

Ce n’est **pas** :

- un observatoire mondial ;
- un source engine ;
- un indice climatique officiel.

La moyenne France actuelle doit rester étiquetée **indice du réseau importé**, jamais indicateur national MF.
