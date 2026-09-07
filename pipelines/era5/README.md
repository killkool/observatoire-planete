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

Méthode point : `nearest` (`method_version` `era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1`).

- Min/max quotidien 2t et point de rosée = extrêmes des 24 heures UTC, **pas** Tmin/Tmax/Td d’abri.
- Pluie = **somme** des 24 pas horaires de `total_precipitation` en **mètres**. Sur le miroir ARCO `ar/full`, la série n’est pas un cumul de step CDS (non monotone ; last−first = 0). Un 0 horaire est un zéro du modèle, pas un NULL.
- Affichage mm = × 1000, 1 décimale. Pas fusionné avec la pluie de station.
- Vent 10 m : `10m_u_component_of_wind` / `10m_v_component_of_wind` (m s⁻¹). Vitesse quotidienne = **moyenne** des hypot(u,v) horaires. Direction = d’où vient le vent, **moyenne vectorielle** de u et v (pas la moyenne des angles). Pas une rafale, pas un anémomètre. Affichage km/h = × 3,6.
- Pression mer : `mean_sea_level_pressure` moyenne 24 h UTC en **Pa**, affichage hPa. Pression surface : `surface_pressure` moyenne 24 h, avec orographie `geopotential_at_surface / 9,80665` (altitude de la **maille**, pas de la commune).
- Neige : `snow_depth` ARCO = mètres d’**équivalent en eau**, moyenne 24 h. Affichage mm d’eau = × 1000. Pas une hauteur de manteau (`×100` en cm interdit).
- SSRD : `surface_solar_radiation_downwards` en J m⁻², **somme** des 24 pas (comme TP, pas last−first). Affichage MJ/m² = / 1e6. Un bruit nocturne ARCO < 1 J m⁻² peut être ramené à 0 avant la somme ; les heures brutes restent dans le JSON.
- Rafale : `instantaneous_10m_wind_gust`, **max** des 24 pas, m s⁻¹, affichage km/h. Pas une rafale officielle.

Quotidien bbox France (`method_version` `era5-france-daily-2t-minmax-v1`) : **3 jours** (11–13 mai 1983), 2t min/max seulement, 2709 mailles ~0,25° dans la bbox. Index `france-2t-daily-index.json`. Les longitudes ARCO sont 0–360° (5,5°W = 354,5°). Fichiers JSON, **pas** importés en SQLite. Un run `--france-only --dates=` accepte au plus **7** jours — pas l’archive 1940–2026. La preuve `france-1983-05-12-2t-daily.json` n’est pas réécrite.

Chunks ARCO `(1, 721, 1440)` = 1 h × globe. Un jour 2t quotidien France télécharge donc 24 tranches horaires mondiales de 2t ; seules les mailles France sont **stockées**.

Accès : miroir public **ARCO ERA5**  
`gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3`  
(anonyme GCS). Même produit ERA5, même DOI — pas une autre réanalyse. Compte CDS non requis pour ce miroir.

Pas d’ERA5-Land. Le point Grenoble est importé pour **5 jours** (12 mai 1982 et 1986, 11–13 mai 1983) : 2t, rosée, TP, vent 10 m, MSL, SP, neige SWE, SSRD et rafale. Les preuves `grenoble-1983-05-1{1,2,3}.json` ne sont pas réécrites. Pas l’archive 1940–2026.

## Comment extraire puis ingérer

Python 3.12 + venv local (gitignoré) :

```text
py -3.12 -m venv pipelines/era5/.venv
pipelines/era5/.venv/Scripts/python.exe -m pip install -r pipelines/era5/requirements.txt
npm run era5:extract-point
npm run import:era5
npm run era5:extract-points-window
npm run import:era5:window
npm run era5:extract-points-records
npm run import:era5:records
pipelines/era5/.venv/Scripts/python.exe pipelines/era5/extract_point.py --france-only --dates=1983-05-11,1983-05-13
```

`era5:extract-point` n’écrase plus le quotidien 1983-05-12. `era5:extract-points-window` écrit les 11 et 13 mai 1983. `era5:extract-points-records` écrit les 12 mai 1982 et 1986. Seuls les JSON **point** sont importés.

Schéma JSON point (valeurs illustratives sauf consigne) :

```json
{
  "source_id": "copernicus.c3s.era5.single-levels-hourly",
  "dataset_version": "ERA5",
  "method": "nearest",
  "method_version": "era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1",
  "latitude": 45.1885,
  "longitude": 5.7245,
  "grid_latitude": 45.25,
  "grid_longitude": 5.75,
  "points": [
    { "date": "1983-05-12", "variable_id": "air_temperature_min", "value": 280.1, "unit": "K" },
    { "date": "1983-05-12", "variable_id": "precipitation", "value": 0.0003, "unit": "m" },
    { "date": "1983-05-12", "variable_id": "wind_speed", "value": 2.0, "unit": "m s-1" },
    { "date": "1983-05-12", "variable_id": "sea_level_pressure", "value": 101325, "unit": "Pa" },
    { "date": "1983-05-12", "variable_id": "pressure", "value": 90000, "unit": "Pa" },
    { "date": "1983-05-12", "variable_id": "snow_depth", "value": 0.02, "unit": "m" },
    { "date": "1983-05-12", "variable_id": "solar_radiation", "value": 2e7, "unit": "J m-2" },
    { "date": "1983-05-12", "variable_id": "wind_gust", "value": 15, "unit": "m s-1" }
  ]
}
```

Les Kelvin / mètres de l’exemple ci-dessus sont **illustratifs**. Seul un fichier produit par `extract_point.py` (ou un JSON CDS réel) peut être importé. Sans extraction réelle, le panneau de comparaison n’affiche pas de chiffre.
