# Pipeline Météo-France

Source activée : `meteo-france.climatologie.quotidienne.bulk` (Licence Ouverte 2.0).

Point d’entrée : `scripts/import-meteo-france.ts` → `src/lib/ingestMeteoFrance.ts`.

Règles : bulk CSV.GZ, idempotence, checksum, lineage, `origin_type=OBSERVED`. L’API DPClimatologie n’est pas le chemin d’ingestion.
