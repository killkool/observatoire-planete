---
name: 15-data-engineering
description: ETL bulk ingest, resume, checksum, deduplication, schema drift, quarantine. Use when writing or fixing pipelines.
---

# Data engineering
- Idempotent replay
- SHA-256; skip identical files
- Never overwrite raw; version + supersedes
- Schema drift → stop + `raw_quarantine`
- Job metadata: last_checked, last_successful_import, source_version
- Stack: Python, Polars, PyArrow, httpx, pydantic, psycopg
