# Volumes de données — V1 France

**Date :** 2026-09-06  
Les chiffres **mesurés** viennent de l’import Isère. Les chiffres France entière sont des **ordres de grandeur** déjà documentés dans [COSTS.md](./COSTS.md) ; ce ne sont pas des tailles officielles de fournisseur.

Objectif V1 : quelques dizaines à quelques centaines de Go au départ. Prévoir une évolution vers plusieurs To. **Ne pas** optimiser pour 100 To ou des Po. **Ne pas** télécharger ERA5 mondial.

Une page vue normale = 0 téléchargement source, 0 appel Météo-France / CDS.

---

## 1. Mesuré — Isère (département 38)

| Élément | Valeur | Nature |
|---|---|---|
| Observations quotidiennes | **1 208 439** lignes | SQL, 2026-09-06 |
| Postes | 156 | métadonnées du bulk |
| Période | 1980-01-01 → 2026-09-04 | couverture réelle importée |
| Fichiers source | 4 CSV.GZ, SHA-256 + lineage | `import_files` / `data_lineage` |
| Lieux seed | 3 communes | Grenoble, Crolles, La Pierre |
| Extractions ERA5 | **42** points Grenoble 11–13 mai 1983 (SQL, 14 × 3) + quotidien 2t France **3 jours** (JSON ~95 Ko / jour, 2709 mailles, pas SQL) | ARCO réel, aucune valeur inventée |
| Fichier SQLite | gitignoré (`data/meteo.sqlite`) | taille locale, à relire avec `Get-Item` sur la machine d’import |

Le fichier SQLite n’est pas dans Git : sa taille exacte en octets n’est pas une preuve versionnée. L’ordre de grandeur attendu pour ~1,2 M lignes quotidiennes compactes est **centaines de Mo**, pas des To.

---

## 2. Estimé — Météo-France quotidien France

Source : fiche data.gouv `6569b51ae64326786e4e8e1a`, 624 fichiers principaux (consulté 2026-09-06, voir COSTS.md).

- Ressources gzip : de quelques Ko à ~9 Mo par fichier département / période (exemples de fiche).
- **Estimé interne** France entière quotidien (tous départements, profondeur d’archive, gzip) : **quelques Go à quelques dizaines de Go**.
- Après parse SQL/Postgres : plus gros que le gzip (index, NULL, colonnes qualité). Ordre de grandeur V1 plausible : **dizaines de Go** pour le quotidien national, **à mesurer** au premier import national — ne pas figer un To.

Horaires : n’importer que si un besoin produit le justifie (vent, « quel temps à 15 h »). Sinon rester quotidien. Un import horaire national multiplierait fortement volume et coût ; **hors dimensionnement par défaut V1**.

---

## 3. Estimé — ERA5 subset France

Calcul interne déjà dans COSTS.md (float32, grille 0,25°, **pas** un chiffre CDS officiel) :

- Monde horaire ~3 To / variable non compressé → **interdit**.
- Bbox France (~41–51°N, 5°W–10°E) ≈ 0,23 % des cellules → ~7 Go / variable horaire non compressé → ~60 Go pour 9 variables. Compressé : souvent moins — **à mesurer**.
- V1 R9 : extraits **point** et/ou **quotidien** bbox France. 1 variable quotidien France 1940–2026 : **centaines de Mo à quelques Go** (ordre de grandeur interne).

ERA5-Land 0,1° : plus dense sur terre ; ne pas importer mondial.

---

## 4. Statistiques, index, raw

| Couche | V1 | Commentaire |
|---|---|---|
| `raw/` CSV.GZ MF | Go à dizaines de Go | immuable, checksum |
| Observations SQL | voir §2 | index date + station |
| Stats précalculées (mois, année, day-of-year, records, normales) | très inférieur aux quotidiennes | à précalculer (R7) |
| Communes / stations / mapping | faible (Mo) | ADMIN EXPRESS + postes |
| Exports / Parquet | selon usage | object storage |
| Tuiles météo mondiales | **0** en V1 | carte France plus tard, IGN déjà en WMTS distant |

---

## 5. Ce qu’on ne dimensionne pas en V1

- NOAA GHCN/ISD mondial
- CMEMS / océan
- ECMWF archive de runs
- ClickHouse
- Grille ERA5 horaire planète (~30 To d’ordre de grandeur interne pour 9 variables)

---

## 6. Décision

Le slice Isère tient dans SQLite. La France quotidienne **peut** rester sur PostgreSQL sans ClickHouse, sous réserve de mesures à l’import national (R10). Si un goulot est mesuré (p95 page commune, agrégats), alors seulement on étudie vues matérialisées, puis éventuellement un OLAP — pas avant.
