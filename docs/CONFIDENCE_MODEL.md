# Modèle de confiance

Le score n’est pas un marketing. Il est **documenté, reproductible, versionné** (`method_version`).

Ce document décrit la **v1 proposée**. Les poids seront calibrés sur des cas réels (Grenoble, montagne, littoral) ; jusqu’à calibration, l’UI peut afficher le détail sans prétendre à une science certifiée.

## Entrées

- `origin_type`
- quality flags / classe de poste
- couverture temporelle de la variable
- distance géodésique station–point
- Δ altitude
- cohérence inter-sources (écart, pas une moyenne)
- `source_dependency_group` (indépendance)
- présence d’une mesure vs interpolation
- ancienneté / fraîcheur (ERA5T vs final, lag)
- résolution spatiale et temporelle du produit

## Principes

- Une observation nationale proche et expertisée > réanalyse, pour une variable observée, **en général** — pas toujours (trou de série, classe 5, Δz énorme).
- ERA5 n’augmente pas le score comme une « seconde mesure indépendante » si elle assimile le même réseau.
- Interpolation : plafond de score plus bas, `origin_type = INTERPOLATED`.
- Donnée absente : pas de score inventé ; « non disponible ».

## Esquisse v1 (0–100)

Base selon `origin_type` (plafonds, pas des bonus empilables infinis) :

| Origin | Base |
|---|---|
| OBSERVED (source nationale, QC OK) | 70 |
| OBSERVED (réseau international) | 60 |
| HOMOGENIZED | 65 (méthode visible) |
| REANALYSIS | 45 |
| SATELLITE / BLENDED | 40 |
| MODEL / FORECAST | 35 (et étiquette future) |
| INTERPOLATED / DERIVED | 25 |

Ajustements (exemples, à calibrer) :

- distance < 5 km : +10 ; 5–20 km : +5 ; > 50 km : −10
- |Δz| < 50 m : +5 ; > 300 m : −10 (montagne)
- couverture de la série au jour demandé : +5 / −15 si trou
- flag QC suspect : −20
- écart |station − ERA5| faible : +5 de **cohérence**, sans fusion
- même `source_dependency_group` : ne pas additionner des bonus « multi-sources »

Clamp 0–100. Afficher le détail, pas seulement le nombre.

## Ce que le score n’est pas

- une incertitude en °C
- une garantie légale
- un substitut au type d’origine

Tests golden : plaine, montagne, littoral, ville (Phase 7).
