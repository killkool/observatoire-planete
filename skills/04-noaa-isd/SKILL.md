---
name: 04-noaa-isd
description: NOAA ISD / GHCNh hourly synoptic observations and station metadata. Use when ingesting hourly international station data.
---

# NOAA ISD / GHCNh
## Rules

- ISD and GHCNh are **distinct** catalog entries
- Confirm the actual download channel licence before enabling
- Hourly elements vary by station; missing = NULL
- Same physical station may exist in MF/GHCN — dedupe
- Not in the Isère vertical slice
