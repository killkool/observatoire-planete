---
name: 03-noaa-ghcn
description: NOAA GHCN Daily stations, elements, flags, and formats. Use when importing GHCN or linking French stations to GHCN IDs.
---

# NOAA GHCN Daily
## Role

Global historical daily stations (Tmin, Tmax, precip, snow where present).

## Licence

NODD/AWS: CC0-1.0. Still credit NOAA; never imply endorsement.

## Rules

- Keep QC flags; never silently drop outliers
- `source_dependency_group = international_station_aggregation`
- Link to `physical_station_entities` before treating as independent from Météo-France
- Phase 8: France/Alps subset first, not the whole planet
