# Données locales

La base SQLite `meteo.sqlite` est **gitignorée** (volume, pas un dump à versionner).

Recréer le slice Isère :

```bash
npm run import:meteo -- --department=38 --from=1980 --to=2026
```

ERA5 : aucun JSON inventé. Voir `pipelines/era5/README.md`.
