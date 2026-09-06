---
name: 07-ecmwf-open-data
description: ECMWF Open Data IFS/AIFS GRIB forecasts, runs, lead times, CC-BY plus Terms of Use. Use when adding forecast layers or archiving forecast runs.
---

# ECMWF Open Data
## Allowed now

Public **subset** IFS/AIFS, ~0.25°, GRIB2, CC-BY-4.0 + ECMWF ToU, commercial with attribution.

Rolling archive ~12 runs. Higher-res / full catalogue **delivery** may need a service agreement → `REQUIRES_REVIEW`.

## UI

`origin_type = FORECAST`. Separate past / present / future. Do not backfill history with forecasts.

If we promise forecast history, we must persist runs ourselves.
