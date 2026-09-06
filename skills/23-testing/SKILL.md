---
name: 23-testing
description: Unit, integration, scientific regression, GIS, E2E, golden datasets. Use when adding features or changing statistics, units, or wind direction.
---

# Testing
Golden places: Grenoble, Paris, mountain altitude, Marseille coast, Mediterranean, later NY/Tokyo.

A code change must not silently alter means, records, units, day boundaries, or wind arrows.

Mocks only in tests/Storybook and labelled as mocks. No fake production data.
