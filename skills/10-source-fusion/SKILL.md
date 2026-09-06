---
name: 10-source-fusion
description: Source ranking, cross-validation, dependency groups, best-source selection. Use when comparing Météo-France, NOAA, and ERA5 or choosing a preferred value.
---

# Source fusion
## Forbidden

`mean(MF, NOAA, ERA5)` as truth. Three sources ≠ three independent confirmations.

## Required

- Configurable ranking (country × variable × period)
- Report gaps, bias, MAE, RMSE, correlation, coverage — with definitions
- `source_dependency_group` for independence
- Preferred value + alternatives, never a silent blend
- Do not auto-apply ERA5–station bias to history without a methodology ADR
