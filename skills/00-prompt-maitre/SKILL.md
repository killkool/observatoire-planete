---
name: 00-prompt-maitre
description: >-
  Observatoire Planète master constitution (PROMPT MAÎTRE V2), stored verbatim
  in docs/PROMPT_MAITRE_V2.md. Use on every prompt in this repository. Never
  paraphrase, shorten, or replace that file. Never drop a numbered requirement
  because the current slice is smaller. Read with 00-track-development.
---

# Prompt maître V2 — constitution

**À chaque prompt.** Le texte intégral, mot pour mot, est :

[docs/PROMPT_MAITRE_V2.md](../../docs/PROMPT_MAITRE_V2.md)

Ne pas le réécrire. Ne pas en faire une « version simplifiée » qui remplacerait l’original. Ne pas oublier une section parce que le slice Isère n’y est pas encore.

Index anti-oubli (cases, pas le texte) : [docs/PROMPT_INDEX.md](../../docs/PROMPT_INDEX.md)

## Avant de coder

1. **Constitution définitive** : [docs/PROMPT_MAITRE_V2.md](../../docs/PROMPT_MAITRE_V2.md) mot pour mot (0–187). Ne pas paraphraser.
2. **Exécuter** la V1 France : [docs/V1_FRANCE_REFOCUS.md](../../docs/V1_FRANCE_REFOCUS.md) et [docs/ROADMAP.md](../../docs/ROADMAP.md) (R0–R14), plus ERA5 **point** Grenoble pour fermer le PoC 1.
3. Ne pas exécuter maintenant le monde, l’océan, l’API commerciale ([BACKLOG_V2_GLOBAL.md](../../docs/BACKLOG_V2_GLOBAL.md)).
4. Ne pas sauter les phases R. Aucune valeur ERA5 inventée. Pas d’ERA5 mondial.

## Interdit

- Inventer donnée, API, licence, quota, paramètre.
- FREE ACCESS ≠ COMMERCIAL REUSE. E-OBS interdit en commercial.
- Réanalyse / interpolation / prévision présentées comme observation.
- Moyenne aveugle multi-sources.
- IA générative qui invente une valeur météo.
- Télécharger la planète entière sans étude de volume.

## Après chaque changement

Mettre à jour STATUS, ROADMAP, PROMPT_INDEX et (si ingestion) DATA_CHANGELOG. Voir [00-track-development](../00-track-development/SKILL.md).
