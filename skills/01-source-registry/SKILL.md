---
name: 01-source-registry
description: Catalogue providers, datasets, versions, licences, and commercial legal_status. Use when adding a source, enabling a connector, auditing licenses, or changing data_sources.yaml.
---

# Source registry
## Rules

- No pipeline without a `data_sources` row.
- Commercial production requires `legal_status: APPROVED_COMMERCIAL` and `enabled: true`.
- `REQUIRES_REVIEW`, `RESTRICTED`, `DISABLED` never serve users in commercial mode.
- FREE ACCESS ≠ COMMERCIAL REUSE. Do not invent a licence.
- Each NOAA/CMEMS/ECMWF product is its own `source_id`.
- E-OBS stays `DISABLED`.

## Workflow

1. Read [docs/DATA_LICENSES.md](../../docs/DATA_LICENSES.md) and [docs/DATA_SOURCES.md](../../docs/DATA_SOURCES.md).
2. Fetch the official licence URL (do not rely on memory).
3. Fill `packages/licensing/registry/data-sources.yaml`.
4. Record `reviewed_at`, `reviewed_by`, attribution text, logo rights (default: no logo).
5. Add ranking only as **configurable** country×variable×period entries.

## Outputs

Registry YAML + licence notes. Block the connector if the text is ambiguous.
