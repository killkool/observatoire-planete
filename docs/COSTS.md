# Coûts et volumes — Phase 0

**Date :** 2026-09-06  
Les chiffres ci-dessous sont des **ordres de grandeur**. Ceux marqués *estimé interne* ne sont pas des tailles officielles de fournisseur. Aucun tarif cloud n’est un devis.

Objectif produit : une page vue normale = 0 téléchargement source, 0 appel MF/NOAA/CDS, 0 gros job ERA5.

## 1. Volumes data

### 1.1 Météo-France quotidien bulk

- Jeu data.gouv `6569b51ae64326786e4e8e1a` : **624 fichiers principaux** (consulté 2026-09-06).
- Exemples de tailles de ressources sur la fiche : de quelques Ko à ~9 Mo gzip par fichier département/période.
- **Estimé interne** France entière quotidien (tous départements, profondeur d’archive, gzip) : **quelques Go à quelques dizaines de Go**.
- Isère seul (MVP) : **centaines de Mo** gzip selon périodes, à mesurer au premier import (`du` + log checksum).

Stratégie : CSV.GZ → object storage `raw/` → observations station en PostgreSQL (ponctuel, adapté).

### 1.2 ERA5 hourly single levels

| Chiffre | Source | Nature |
|---|---|---|
| ~405.8 TB | Earth Data Hub (DestinE), subset single levels 0.25° | tierce, **pas** un chiffre CDS officiel |
| ~30 TB | Earthmover, 18 variables surface 1975–2024 Zarr | tierce, sous-ensemble |
| ~3 TB / variable / 1940–2026 | calcul interne ci-dessous | estimé non compressé |

Calcul interne (float32, grille 0.25°) :

- cellules : 721 × 1440 = 1 038 240  
- heures 1940-01-01 → 2026-09 ≈ 86,7 × 365,25 × 24 ≈ 7,6×10⁵  
- 1 038 240 × 7,6×10⁵ × 4 octets ≈ **3,2 To / variable** non compressé monde horaire

9 variables prioritaires monde horaire ≈ **29 To** non compressé.

**Bbox France** (~41–51°N, 5°W–10°E) ≈ 0,23 % des cellules → **~7 Go / variable** horaire non compressé → **~60 Go** pour 9 variables. Compressé GRIB/Zarr : souvent plusieurs fois moins — **à mesurer**.

**Décision Phase 0 :** ne pas stocker le mondial horaire. MVP = extraits **point** (Grenoble) + éventuellement **quotidiens** bbox France.

1 variable quotidien France 1940–2026 : ~24× moins que l’horaire si on ne garde que min/max/mean → **centaines de Mo à quelques Go**.

ERA5-Land 0.1° : ~6,25× plus de cellules que 0.25° **sur terre** ; ne pas importer mondial d’emblée.

### 1.3 NOAA

- GHCN Daily mondial : historiquement de l’ordre du **Go** (tar `ghcnd_all`) — à re-mesurer à l’import.
- ISD / GHCNh : **plus gros** (horaire) ; sous-ensemble géographique d’abord.
- OISST 0.25° quotidien : modestes (SST 2D).

### 1.4 CMEMS

Dépend du produit (Méditerranée vs global, NRT vs multiyear, niveaux verticaux). MVP Méditerranée occidentale : viser **dizaines de Go** max en se limitant aux variables du PoC 2. Figer après choix des `product_id` / DOI.

### 1.5 ECMWF Open Data

Rolling 12 runs : volume faible si on ne persiste pas. Si on archive 4 runs/jour IFS 0.25° surface+vagues : **croissance linéaire** — budgéter avant de promettre un historique de prévision.

## 2. Coûts d’accès fournisseur (licence)

| Source | Coût data (audit 2026-09-06) |
|---|---|
| Météo-France Open Data bulk | 0 (LO 2.0) |
| API MF | 0 redevance data ; quotas / ToU API |
| ERA5 CDS | 0 licence ; compute/egress = nous |
| CMEMS | 0 licence jusqu’au terme de service documenté (voir licences) |
| ECMWF Open Data subset | 0 data ; catalogue HR / livraison dédiée = **service charges possibles** |
| NOAA NODD | 0 |

## 3. Coûts d’infrastructure (hypothèses, à tarifer)

Postes de coût à suivre (dashboard interne, Phase 20, amorçable plus tôt) :

- object storage (raw + derived + tiles)
- PostgreSQL
- egress CDN / API
- workers (ingestion, tuiles, agrégats)
- compute extraction ERA5
- app hosting
- Stripe fees
- cost / 1000 pageviews, / user actif, / million d’appels API

**Hypothèse de travail MVP local :** un poste dev + disque ; Postgres/MinIO Docker quand Phase 1.

**Hypothèse de travail France daily + ERA5 points + pages SEO :** viser **≪ 100 € / mois** cloud en petit trafic si on refuse le mondial horaire. **Non garanti** — à remplacer par des mesures.

Le mondial ERA5 horaire multi-variables ferait exploser storage + egress. C’est la principale mine FinOps.

## 4. Stratégie anti-coût

1. PRODUCT NEED → DATA NEED  
2. Hot / warm / cold  
3. Précalcul villes fréquentes  
4. Tuiles CDN, jamais grille brute navigateur  
5. Checksum : ne pas retraiter un fichier identique  
6. ERA5 : point + daily régional avant Zarr mondial  
7. Mesurer avant partitionnement et Redis

## 5. Prochaine mesure réelle

Au premier pipeline Isère : journaliser `bytes_downloaded`, `bytes_raw`, `rows`, `checksum`, `duration`. Alimenter ce fichier et `DATA_CHANGELOG.md`.
