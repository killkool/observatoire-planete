---
name: 05-era5
description: ERA5 and ERA5-Land reanalysis: variables, units, GRIB/NetCDF/Zarr, ERA5T vs final. Use when extracting points, aggregating daily reanalysis, or comparing to stations.
---

# ERA5 / ERA5-Land
## Honesty

UI label: **Réanalyse ERA5**. Never “observation” or “station”.

- ERA5: global, 1940–, ~0.25°, hourly, DOI 10.24381/cds.adbb2d47
- ERA5-Land: land, 1950–, 0.1°, does not replace a station
- ERA5T (~5 day latency) may differ from final (2–3 months)

## Storage

Never dump global hourly grids into SQL. Use point timeseries, regional daily cache, or on-demand Zarr/GRIB.

## Extraction

Document method (`nearest` default unless an ADR says otherwise). Store model altitude vs user altitude. Optional lapse-rate correction = `DERIVED`.

## Priority variables

2m T, 2m dewpoint, TP, 10u, 10v, SP, MSL, snow, SSRD.

Assimilated observations → not an independent confirmation of a nearby station.

On the ARCO `ar/full` mirror, `total_precipitation` is hourly accumulation in metres (not a CDS forecast-step cumulative). Daily total = sum of 24 UTC steps. Model hourly 0 is a zero, not NULL. Display mm = × 1000.
