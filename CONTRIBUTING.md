# Contribuer

## Avant une feature

1. Lire [skills/00-track-development/SKILL.md](skills/00-track-development/SKILL.md).
2. Vérifier la phase sur [docs/STATUS.md](docs/STATUS.md) et [docs/ROADMAP.md](docs/ROADMAP.md).
3. Vérifier `legal_status` dans [docs/DATA_LICENSES.md](docs/DATA_LICENSES.md) et `packages/licensing/registry/data-sources.yaml`.
4. Lire le skill métier `skills/` concerné.
5. Prévoir un test (unité, data, ou golden).
6. Avant de fusionner : STATUS + ROADMAP à jour dans le même changement.

## Données

- Pipelines idempotents, checksum, pas d’écrasement `raw/`.
- Schema drift → quarantine, pas un import « au mieux ».
- Documenter dans `DATA_CHANGELOG.md` toute nouvelle source, version, ou recalcul massif.
- ADR dans `docs/adr/` pour les choix structurants.

## Code

TypeScript strict côté web ; Python (Polars/Xarray/pydantic) côté data. Pas de framework de plus sans besoin. Mocks uniquement tests/Storybook, clairement marqués.

## Commits

Messages en français ou anglais, **pourquoi** plutôt que quoi. Ne pas committer `.env`, jetons, dumps.

## Revue

Un changement qui mute silencieusement moyennes, records, unités, bornes de jour ou direction du vent doit casser un test golden.
