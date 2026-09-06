# Appariement de stations

La même station physique peut exister chez Météo-France, GHCN, ISD, WMO. Deux IDs ≠ deux mesures indépendantes.

## Entités

`physical_station_entities` ← `provider_station_links` → `weather_stations`.

## Score initial (à calibrer)

| Facteur | Poids |
|---|---|
| Distance géodésique | 30 % |
| Δ altitude | 20 % |
| Couverture temporelle | 20 % |
| Qualité / type de poste | 20 % |
| Continuité (même ID, peu de relocalisations) | 10 % |

Un lien n’est créé que si le score dépasse un seuil **et** qu’un humain ou un test golden peut le réfuter (Grenoble).

## Choix de station pour un lieu

Ce n’est pas « la plus proche ». Ajouter : variable demandée, date, qualité, altitude commune vs utilisateur.

WMO ID / NUM_POSTE / GHCN ID : stocker dans `provider_ids` / aliases, ne pas coller des identifiants hétérogènes dans une seule colonne.
