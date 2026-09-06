# DATA CHANGELOG

Journal des sources, versions et recalculs. Pas de remplacement silencieux d’un dataset.

## 2026-09-06 (soir)

- Skill `skills/00-track-development` : obligatoire à chaque prompt (règle Cursor `alwaysApply` + `AGENTS.md`). Met à jour STATUS / ROADMAP dans le même lot que le code.
- Accueil visuel (héros Terre) + pages lieu avec carte IGN Géoplateforme (orthophoto / plan) et heatmap annuelle.
- Les visuels d’ambiance (`public/images/hero-earth.png`, `origin-*.png`) sont des illustrations de marque, **pas** des photos du lieu.
- Extraits UI IGN WMS dans `public/images/places/{grenoble,crolles,la-pierre}.jpg` (affichage, pas extract massif). Attribution : © IGN — Géoplateforme.

- Phase 0 : création du registre licences / sources.
- Import réel Isère (38), Météo-France quotidien bulk, 1980-01-01 → 2026-09-04 : **1 208 439** observations, 4 fichiers, checksum SHA-256, `origin_type=OBSERVED`.
- Preuve Grenoble 1983-05-12 : station `38126001` CORENC LA REVIREE, Tmin 6.6 °C, Tmax 21.6 °C, RR 0.1 mm (unité telle que publiée). ERA5 non ingéré (aucune valeur inventée).
