# Pipeline ERA5 — extraction point et quotidien France

Licence : **APPROVED_COMMERCIAL** (CC-BY-4.0 CDS, audit 2026-09-06). Origin = **REANALYSIS**.
DOI : `10.24381/cds.adbb2d47`. `source_id` : `copernicus.c3s.era5.single-levels-hourly`.

## Interdit

- Télécharger la grille mondiale horaire pour l’écrire en SQL.
- Écrire des températures ou une pluie inventées.
- Afficher ERA5 comme une station.
- Compter ERA5 comme confirmation indépendante d’une station proche (assimilation).
- Fusionner une estimation ERA5 avec une mesure Météo-France.

## Autorisé (vertical slice)

Extraire **un point en France** (bbox V1 ~41–51,5°N, 5,5°W–10°E) pour des jours demandés. Un point hors bbox est refusé (pas d’extraction mondiale).

Méthode point : `nearest` (`method_version` `era5-point-nearest-hourly-2t-d2m-tp-v1`).

- Min/max quotidien 2t et point de rosée = extrêmes des 24 heures UTC, **pas** Tmin/Tmax/Td d’abri.
- Pluie = **somme** des 24 pas horaires de `total_precipitation` en **mètres**. Sur le miroir ARCO `ar/full`, la série n’est pas un cumul de step CDS (non monotone ; last−first = 0). Un 0 horaire est un zéro du modèle, pas un NULL.
- Affichage mm = × 1000, 1 décimale. Pas fusionné avec la pluie de station.

Quotidien bbox France (`method_version` `era5-france-daily-2t-minmax-v1`) : **un jour**, 2t min/max seulement, mailles ~0,25° dans la bbox. Les longitudes ARCO sont 0–360° (5,5°W = 354,5°). Fichier JSON, **pas** importé en SQLite.

Chunks ARCO `(1, 721, 1440)` = 1 h × globe. Un jour 2t quotidien France télécharge donc 24 tranches horaires mondiales de 2t ; seules les mailles France sont **stockées**. Ce n’est pas l’archive 1940–2026.

Accès : miroir public **ARCO ERA5**  
`gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3`  
(anonyme GCS). Même produit ERA5, même DOI — pas une autre réanalyse. Compte CDS non requis pour ce miroir.

Pas d’ERA5-Land. Pas de vent / pression tant qu’ils ne sont pas extraits réellement.

## Comment extraire puis ingérer

Python 3.12 + venv local (gitignoré) :

```text
py -3.12 -m venv pipelines/era5/.venv
pipelines/era5/.venv/Scripts/python.exe -m pip install -r pipelines/era5/requirements.txt
npm run era5:extract-point
npm run import:era5
```

`era5:extract-point` écrit aussi `pipelines/era5/extracts/france-1983-05-12-2t-daily.json`. Seul le JSON **point** est importé (`import:era5`).

Schéma JSON point (valeurs illustratives sauf consigne) :

```json
{
  "source_id": "copernicus.c3s.era5.single-levels-hourly",
  "dataset_version": "ERA5",
  "method": "nearest",
  "method_version": "era5-point-nearest-hourly-2t-d2m-tp-v1",
  "latitude": 45.1885,
  "longitude": 5.7245,
  "grid_latitude": 45.25,
  "grid_longitude": 5.75,
  "points": [
    { "date": "1983-05-12", "variable_id": "air_temperature_min", "value": 280.1, "unit": "K" },
    { "date": "1983-05-12", "variable_id": "precipitation", "value": 0.0003, "unit": "m" }
  ]
}
```

Les Kelvin / mètres de l’exemple ci-dessus sont **illustratifs**. Seul un fichier produit par `extract_point.py` (ou un JSON CDS réel) peut être importé. Sans extraction réelle, le panneau de comparaison n’affiche pas de chiffre.
