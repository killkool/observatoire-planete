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
| [docs/V1_FRANCE_REFOCUS.md](../../docs/V1_FRANCE_REFOCUS.md) | Stratégie **active** V1 |
| [docs/ROADMAP.md](../../docs/ROADMAP.md) | Phases R0–R14, cases `[x]` / `[ ]` |
| [docs/STATUS.md](../../docs/STATUS.md) | Avancement réel, preuves, prochaine action |
| [docs/BACKLOG_V2_GLOBAL.md](../../docs/BACKLOG_V2_GLOBAL.md) | Monde / océan / API — PARK |
| [docs/PROMPT_MAITRE_V2.md](../../docs/PROMPT_MAITRE_V2.md) | Constitution long terme, **mot pour mot**. Ne pas paraphraser. |
| [docs/PROMPT_INDEX.md](../../docs/PROMPT_INDEX.md) | Cases 0–187 (ne rien oublier, y compris PARK) |
| [DATA_CHANGELOG.md](../../DATA_CHANGELOG.md) | Ingestion, version de dataset, extraits UI |
| [docs/adr/](../../docs/adr/) | Décision structurante |

## Avant de coder

1. L’objectif **immédiat** = V1 France (roadmap R0–R14) **et** fermer le vertical slice du prompt maître (Grenoble date réelle + ERA5 **point**, pas mondial).
2. L’objectif **définitif** = prompt maître V2 mot pour mot ; s’il n’est plus dans ROADMAP, il est dans BACKLOG_V2 — jamais effacé.
3. Lire `docs/STATUS.md` (prochaine action + limites).
4. Ne pas sauter de phase R. Ne pas supprimer du code PARK « pour faire propre ».

## Pendant / avant de terminer

Dans **le même lot** que le code :

1. Mettre à jour `docs/STATUS.md` : phrase d’état, file d’exécution, preuves, prochaine action.
2. Cocher ou décocher les cases de `docs/ROADMAP.md`. Date de mise à jour.
3. Aligner `docs/PROMPT_INDEX.md` (une section du prompt maître ne disparaît jamais).
4. Si ingestion / checksum / nouvelle source / extrait IGN : une ligne dans `DATA_CHANGELOG.md`.
5. Si choix d’architecture : ADR.

## Règle des cases

- `[x]` = livré **et** vérifié (preuve : import SQL, `npm run test:science`, page navigateur).
- `[ ]` = non fait, même si le fichier existe.
- Partiel = case non cochée + phrase **État :** dans la phase.
- Ne jamais cocher ERA5, NOAA, CMEMS, E-OBS, ou une API commerciale sans donnée réelle.
- Ne jamais présenter une illustration comme une observation.

## Interdit

- Annoncer une phase « terminée » parce que le pipeline est prêt mais `COUNT(*) = 0`.
- Inventer un chiffre d’avancement, un quota, une licence, une date de preuve.
- Réduire l’objectif V2 en **effaçant** une section du prompt maître ; la PARK.
