# Base de données

Cible production : **PostgreSQL + PostGIS**. Prototype actuel : SQLite `data/meteo.sqlite` (ne pas étendre indéfiniment).

Le schéma canonique est dans [GLOBAL_DATA_MODEL.md](./GLOBAL_DATA_MODEL.md) et les fichiers SQL de `packages/database/schema/`.

## Règles

- UTC en base.
- Observations ponctuelles et agrégats en SQL ; grilles en object storage.
- FK vers `data_sources` ; pas d’ingestion orpheline.
- `NULL` ≠ `0`.
- Partitionner seulement après mesure.
- Index spatiaux pour nearest station et point-in-polygon.
- Sauvegardes prioritaires : users, billing, config, mappings, derived propriétaires. Les raw retéléchargeables ont une stratégie différente ([DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)).

## Migration depuis le prototype

| SQLite | Cible |
|---|---|
| `stations` | `weather_stations` + `source_id` |
| `observations` (TN/TX/TM) | `observations` EAV canonique |
| `france_daily` | produit derived étiqueté, pas un officiel |
| `import_log` | jobs worker + `data_lineage` |
