# Data lineage

Chaque valeur affichée doit pouvoir répondre : **comment a-t-elle été obtenue ?**

## Chaîne type (observation MF)

1. Valeur UI (unité d’affichage, précision)
2. Valeur canonique (`observations.value`)
3. `original_value` / `original_unit`
4. Station `provider_station_id`
5. Fichier CSV.GZ `raw/meteo-france/...`
6. Checksum SHA-256
7. `ingested_at`, `dataset_version`, `source_id`
8. Licence + attribution

## Chaîne type (ERA5 point)

1. Valeur UI « Réanalyse ERA5 »
2. Extraction (`nearest` | autre, documentée)
3. Variable / niveau / heure UTC
4. Objet GRIB/Zarr + version (ERA5 vs ERA5T)
5. DOI + CC-BY
6. Méthode d’agrégation quotidienne si applicable (`method_version`)

## Règles

- Conserver le raw.
- Versionner code + dataset + method.
- `data_version` + `method_version` sur les réponses avancées.
- Journaliser les recalculs massifs dans `DATA_CHANGELOG.md`.
- Une IA n’insère aucune étape « générée ».
