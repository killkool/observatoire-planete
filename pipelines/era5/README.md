# Pipeline ERA5 — extraction point

Licence : **APPROVED_COMMERCIAL** (CC-BY-4.0 CDS, audit 2026-09-06). Origin = **REANALYSIS**.

## Interdit

- Télécharger la grille mondiale horaire.
- Écrire des températures inventées.
- Afficher ERA5 comme une station.

## Autorisé (vertical slice)

Extraire **un point** (Grenoble 45.1885, 5.7245) pour des jours demandés, variables 2t min/max quotidiennes documentées.

Méthode d’extraction par défaut : `nearest` (ADR à confirmer).

## Comment ingérer

1. Compte CDS + acceptation de licence du jeu `reanalysis-era5-single-levels`.
2. Produire un JSON d’extractions **réelles** (Kelvin, horaire ou quotidien selon `method_version`).
3. `npx tsx scripts/import-era5-point.ts --file=chemin.json`

Schéma JSON :

```json
{
  "source_id": "copernicus.c3s.era5.single-levels-hourly",
  "dataset_version": "ERA5 ou ERA5T",
  "method": "nearest",
  "latitude": 45.1885,
  "longitude": 5.7245,
  "points": [
    { "date": "1983-05-12", "variable_id": "air_temperature_min", "value": 280.1, "unit": "K" }
  ]
}
```

Sans fichier réel, le panneau ERA5 de Grenoble affiche « non ingérée ».
