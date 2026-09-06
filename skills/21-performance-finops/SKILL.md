---
name: 21-performance-finops
description: Cache layers, storage, CDN, egress, cost monitoring. Use when choosing what to download, store, or precompute.
---

# Performance and FinOps
A normal pageview must not hit CDS/MF/NOAA. L1–L5 caches. Hot/warm/cold. PRODUCT NEED → DATA NEED.

Never fetch 137 ERA5 levels × all variables × globe hourly.

Measure bytes on every pipeline. See [docs/COSTS.md](../../docs/COSTS.md).
