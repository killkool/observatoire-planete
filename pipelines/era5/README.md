# Pipeline ERA5 — extraction point

Licence : **APPROVED_COMMERCIAL** (CC-BY-4.0 CDS, audit 2026-09-06). Origin = **REANALYSIS**.
DOI : `10.24381/cds.adbb2d47`. `source_id` : `copernicus.c3s.era5.single-levels-hourly`.

## Interdit

- Télécharger la grille mondiale horaire.
- Écrire des températures inventées.
- Afficher ERA5 comme une station.
- Compter ERA5 comme confirmation indépendante d’une station proche (assimilation).

## Autorisé (vertical slice)

Extraire **un point** (Grenoble 45.1885, 5.7245) pour des jours demandés.

Méthode : `nearest` (`method_version` `era5-point-nearest-hourly-2t-minmax-v1`).
Min/max quotidien = extrêmes des 24 heures UTC de `2m_temperature`, **pas** le Tmin/Tmax d’abri d’une station.

Accès utilisé pour le PoC : miroir public **ARCO ERA5**  
`gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3`  
(anonyme GCS). Même produit ERA5, même DOI — pas une autre réanalyse. Compte CDS non requis pour ce miroir.

## Comment extraire puis ingérer

Python 3.12 + venv local (gitignoré) :

```text
py -3.12 -m venv pipelines/era5/.venv
pipelines/era5/.venv/Scripts/python.exe -m pip install -r pipelines/era5/requirements.txt
npm run era5:extract-point
npm run import:era5
```

Schéma JSON :

```json
{
  "source_id": "copernicus.c3s.era5.single-levels-hourly",
  "dataset_version": "ERA5",
  "method": "nearest",
  "method_version": "era5-point-nearest-hourly-2t-minmax-v1",
  "latitude": 45.1885,
  "longitude": 5.7245,
  "grid_latitude": 45.25,
  "grid_longitude": 5.75,
  "points": [
    { "date": "1983-05-12", "variable_id": "air_temperature_min", "value": 280.1, "unit": "K" }
  ]
}
```

Les Kelvin de l’exemple ci-dessus sont **illustratifs**. Seul un fichier produit par `extract_point.py` (ou un JSON CDS réel) peut être importé. Sans extraction réelle, le panneau de comparaison n’affiche pas de chiffre.
