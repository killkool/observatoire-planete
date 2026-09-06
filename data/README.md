# Données locales

La base SQLite `meteo.sqlite` est **gitignorée** (volume, pas un dump à versionner).
C’est la source de vérité **locale** : recherche, pages commune, stats. Une visite ne frappe ni Météo-France, ni geo.api.gouv.fr, ni data.gouv.

Fichiers bruts (jamais écrasés) :

```text
raw/meteo-france/quotidiennes/     CSV.GZ + catalogues versionnés
raw/geo-api-gouv/                  snapshot communes Isère
data/tiles/ign/                    cache des tuiles IGN déjà affichées (pas d’extract massif)
```

Premier remplissage (réseau **une fois**, ensuite cache) :

```bash
npm run import:meteo -- --department=38 --from=1980 --to=2026
npm run import:communes
npm run stats:compute
```

Réimport sans réseau : les mêmes commandes relisent `raw/`.  
`--refresh` : redemande le catalogue / le référentiel, **sans effacer** les fichiers déjà stockés ; seuls les nouveaux noms sont téléchargés.

Cartes : le navigateur demande `/api/tiles/ign/...`. Si la tuile est en cache, IGN n’est pas contacté. Pas de téléchargement préventif du département entier (interdit : extract massif).

ERA5 : aucun JSON inventé. Voir `pipelines/era5/README.md`.
