---
name: 02-meteo-france
description: Météo-France Open Data bulk climatology: stations, daily/hourly/6-min files, quality classes, data.gouv resources. Use when ingesting French station data or matching NUM_POSTE.
---

# Météo-France
## Access

Prefer **bulk** on meteo.data.gouv.fr / data.gouv.fr. Do not design millions of API calls.

- Daily dataset id: `6569b51ae64326786e4e8e1a`
- Hourly dataset id: `6569b4473bedf2e7abad3b72`
- Confluence: Open Data Météo-France climatologie
- Licence: Licence Ouverte 2.0 — credit `Source : Météo-France`

## Ingest

- CSV.GZ by department and period; delimiter `;`
- Idempotent upsert; checksum; never overwrite `raw/`
- Keep original columns; map to canonical variables
- Times: UTC in metropolitan France (dataset notice); overseas FU — do not naive-convert climatological days
- `TYPE_POSTE_ACTUEL` 0–5 → `station_quality`
- LSH = `HOMOGENIZED`; SIM = `MODEL`; daily station = `OBSERVED`

## MVP

Department 38. Validation places: Grenoble, Crolles, La Pierre.

Official parameter PDF must be stored in raw docs — do not invent column lists.
