# Observatoire Planète — instructions agents

Nom de travail. Les fournisseurs (Météo-France, Copernicus, NOAA, ECMWF) sont des **sources**, jamais des partenaires implicites.

## Lire avant de coder

1. [skills/00-track-development/SKILL.md](skills/00-track-development/SKILL.md) — **chaque prompt** : mettre à jour le suivi
2. [docs/STATUS.md](docs/STATUS.md) — avancement réel vs preuves
3. [docs/ROADMAP.md](docs/ROADMAP.md) — ordre des phases, ne pas sauter
4. [docs/DATA_LICENSES.md](docs/DATA_LICENSES.md) — pas de connecteur si licence non `APPROVED_COMMERCIAL`
5. [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)
6. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
7. [docs/GLOBAL_DATA_MODEL.md](docs/GLOBAL_DATA_MODEL.md)
8. Le skill métier pertinent dans `skills/` (MF, ERA5, licences, etc.)

## Règles absolues

- Ne jamais inventer une donnée, une API, une licence, un quota, un paramètre.
- Gratuit ≠ commercialisable.
- Réanalyse ≠ observation. Estimation ≠ mesure. Prévision ≠ réel.
- Pas de moyenne aveugle multi-sources. Pas d’indépendance supposée.
- NULL ≠ 0. Ne pas inventer de précision. UTC en base.
- Ne pas effacer `raw/`. Pas de secret client.
- Pas de téléchargement planète entière sans étude de volume.
- E-OBS : `DISABLED`.
- Feature sans test : non.
- IA : n’invente jamais une valeur météo manquante.

Priorité : fiabilité → traçabilité → simplicité → performance → coût → features.

## Vertical slice actuel

Isère → Météo-France bulk → Grenoble (date réelle) → provenance → confiance v1-draft → carte IGN.

**Manque pour fermer le slice :** ERA5 point réel → comparaison sans fusion.

Le dashboard SQLite `src/` (`/dashboard`) est un prototype ClimaFrance. Ne pas l’étendre comme architecture cible.

## Skills

- **Toujours** : [skills/00-track-development/SKILL.md](skills/00-track-development/SKILL.md) — mettre à jour STATUS / ROADMAP avant de terminer.
- Métier : `skills/*/SKILL.md` selon le domaine (licences, MF, ERA5, océan, stats, GIS, sécurité, etc.).
