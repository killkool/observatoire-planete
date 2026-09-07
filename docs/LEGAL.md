# Cadre légal — V1 France

**Date :** 2026-09-07  
**Ceci n’est pas un avis d’avocat.** Aucune offre payante avant revue juridique.

Le registre exécutable et les textes d’attribution détaillés restent dans [DATA_LICENSES.md](./DATA_LICENSES.md) et `packages/licensing/registry/data-sources.yaml`.

---

## 1. Sources activables en V1 (après audit 2026-09-06)

| Source | `legal_status` | Usage V1 |
|---|---|---|
| Météo-France climatologie quotidienne bulk (data.gouv, Licence Ouverte 2.0) | `APPROVED_COMMERCIAL` | **Source principale.** Attribution visible. Pas d’endossement MF. |
| ERA5 / ERA5-Land via CDS (CC-BY-4.0) | `APPROVED_COMMERCIAL` | **Complément** (réanalyse). Jamais présentée comme une station. Subset France seulement. |
| IGN Géoplateforme (Licence Ouverte) | `APPROVED_COMMERCIAL` (affichage + extraits UI ponctuels) | Cartes / photos lieu. Attribution « © IGN — Géoplateforme ». Pas d’extract massif. |
| API Découpage administratif (geo.api.gouv.fr) | `APPROVED_COMMERCIAL` (LO 2.0, dataservice 2026-09-06) | Centres de communes Isère. Pas de contours OSM. |

E-OBS : **`DISABLED`**. Ne pas activer.

---

## 2. Sources cataloguées mais PARK V1

NOAA GHCN (NODD/CC0), NOAA ISD, CMEMS, ECMWF Open Data : licences auditées, **pas ingérées**, **pas exposées** dans le produit V1. Voir [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md).

ECMWF High Resolution catalogue : `REQUIRES_REVIEW` — hors V1.

---

## 3. Règles produit qui ont force juridique pratique

- Ne pas laisser croire à un partenariat avec Météo-France, Copernicus, NOAA, ECMWF ou l’IGN.
- Ne pas revendre un proxy d’API gratuite comme produit.
- Attribution sur chaque page qui affiche une donnée.
- Réanalyse ≠ observation dans l’UI.
- Secrets d’accès (CDS, etc.) : serveur uniquement.
- RGPD : minimisation, pas de compte utilisateur en V1 tant que Premium n’est pas validé.

---

## 4. Revue juriste

Obligatoire avant : offre payante, publicité, API commerciale, redistribution massive de fichiers source.

Jusqu’à cette revue : pas d’offre payante, pas de publicité, pas d’API commerciale. Le dépôt GitHub est **public** depuis 2026-09-07 (code + extraits ERA5 JSON CC-BY-4.0 + extraits UI IGN). Ce n’est pas une redistribution massive des fichiers bulk Météo-France (`raw/` et `data/meteo.sqlite` restent hors git). Attributions déjà affichées sur le slice Grenoble.
