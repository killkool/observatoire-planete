# Observatoire Planète — instructions agents

Nom de travail. Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF, IGN) sont des **sources**, jamais des partenaires implicites.

## Lire avant de coder

1. [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md) — **constitution définitive**, mot pour mot (sections 0–187)
2. [docs/V1_FRANCE_REFOCUS.md](docs/V1_FRANCE_REFOCUS.md) — **stratégie d’exécution V1** (France, grand public, historique)
3. [docs/V1_FRANCE_REFOCUS_AUDIT.md](docs/V1_FRANCE_REFOCUS_AUDIT.md) — KEEP / ADAPT / PARK / REMOVE
4. [docs/ROADMAP.md](docs/ROADMAP.md) — phases **R0–R14**, plus fermeture PoC 1 ERA5 point
5. [docs/STATUS.md](docs/STATUS.md)
6. [skills/00-track-development/SKILL.md](skills/00-track-development/SKILL.md) — mettre à jour le suivi
7. [docs/DATA_LICENSES.md](docs/DATA_LICENSES.md) — pas de connecteur si licence non `APPROVED_COMMERCIAL`
8. [docs/LEGAL.md](docs/LEGAL.md)
9. [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)
10. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
11. [docs/ARCHITECTURE_PRODUCTION.md](docs/ARCHITECTURE_PRODUCTION.md) — stack cible V1 (ADR-0002)
12. [docs/SKILLS.md](docs/SKILLS.md) — ACTIVE vs DORMANT
13. Le skill métier **ACTIVE** pertinent (`02-meteo-france`, stats, SEO, etc.)

Vision mondiale **mot pour mot** (ne pas l’exécuter en entier maintenant) : [docs/PROMPT_MAITRE_V2.md](docs/PROMPT_MAITRE_V2.md). Archive : [docs/roadmap-archive/GLOBAL_VISION.md](docs/roadmap-archive/GLOBAL_VISION.md). Backlog : [docs/BACKLOG_V2_GLOBAL.md](docs/BACKLOG_V2_GLOBAL.md).

## Règles absolues

- Ne jamais inventer une donnée, une API, une licence, un quota, un paramètre.
- Gratuit ≠ commercialisable.
- Réanalyse ≠ observation. Estimation ≠ mesure. Prévision ≠ réel.
- Pas de moyenne aveugle multi-sources. Pas d’indépendance supposée.
- NULL ≠ 0. Ne pas inventer de précision. UTC en base.
- Ne pas effacer `raw/`. Pas de secret client.
- Pas de téléchargement planète entière / ERA5 mondial.
- E-OBS : `DISABLED`.
- Feature sans test : non.
- IA : n’invente jamais une valeur météo manquante.
- UI grand public : pas de jargon ERA5/GRIB en premier. Détail technique derrière « En savoir plus ».
- Ne pas supprimer du code mondial déjà propre : PARK + feature flags.

Priorité V1 : utilité → simplicité → fiabilité → rapidité → beauté → complexité technique.

## Vertical slice actuel

France / Isère → Météo-France bulk → commune (Grenoble…) → date réelle → provenance.  
ERA5 = phase **R9**, secondaire. Océan / NOAA / globe = V2.

Le dashboard SQLite `src/` (`/dashboard`) est un prototype ClimaFrance. Ne pas l’étendre comme architecture cible. La cible production est [docs/ARCHITECTURE_PRODUCTION.md](docs/ARCHITECTURE_PRODUCTION.md) — ne pas feindre Vercel/Supabase tant que `DATABASE_URL` est vide.

## Skills

- Suivi : `00-track-development`.
- Long terme : `00-prompt-maitre` (ne pas paraphraser PROMPT_MAITRE_V2).
- V1 : voir [docs/SKILLS.md](docs/SKILLS.md) groupe ACTIVE. Ne pas charger les DORMANT par défaut.
