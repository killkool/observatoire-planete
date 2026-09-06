---
name: 00-track-development
description: >-
  Maintains Observatoire Planète progress docs in the same change as the code.
  Use on every prompt that implements, fixes, refactors, documents, or ships
  anything in this repo. Mandatory before ending a turn that touched code or
  product docs. Updates docs/STATUS.md, docs/ROADMAP.md, DATA_CHANGELOG.md.
  Never mark a phase done without proof (import, test, or page).
---

# Mettre à jour le développement

**Obligatoire à chaque prompt** qui change le dépôt. Pas à la fin de la semaine. Pas « si tu as le temps ».

Un fichier de code sans cases à jour = travail incomplet.

## Fichiers de vérité

| Fichier | Rôle |
|---|---|
| [docs/STATUS.md](../../docs/STATUS.md) | Avancement réel, preuves, prochaine action |
| [docs/ROADMAP.md](../../docs/ROADMAP.md) | Ordre des phases, cases `[x]` / `[ ]` |
| [DATA_CHANGELOG.md](../../DATA_CHANGELOG.md) | Ingestion, version de dataset, extraits UI de données |
| [docs/adr/](../../docs/adr/) | Décision structurante |

## Avant de coder

1. Lire `docs/STATUS.md` (prochaine action + limites).
2. Lire la phase visée dans `docs/ROADMAP.md`. Ne pas sauter de phase.
3. Déclarer ce qui sera réellement livré vs ce qui restera `[ ]`.

## Pendant / avant de terminer

Dans **le même lot** que le code :

1. Mettre à jour `docs/STATUS.md` : phrase d’état, file d’exécution, preuves, prochaine action.
2. Cocher ou décocher les cases de `docs/ROADMAP.md`. Date de mise à jour.
3. Si ingestion / checksum / nouvelle source / extrait IGN : une ligne dans `DATA_CHANGELOG.md`.
4. Si choix d’architecture : ADR. Ne pas inventer une décision dans le STATUS.

## Règle des cases

- `[x]` = livré **et** vérifié (preuve : import SQL, `npm run test:science`, page navigateur).
- `[ ]` = non fait, même si le fichier existe.
- Partiel = case non cochée + phrase **État :** dans la phase.
- Ne jamais cocher ERA5, NOAA, CMEMS, E-OBS, ou une API commerciale sans donnée réelle.
- Ne jamais présenter une illustration comme une observation.

## Interdit

- Annoncer une phase « terminée » parce que le pipeline est prêt mais `COUNT(*) = 0`.
- Inventer un chiffre d’avancement, un quota, une licence, une date de preuve.
- Oublier le suivi « pour aller plus vite ».
