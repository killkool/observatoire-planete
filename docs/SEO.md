# SEO programmatique

Indexable seulement si **contenu réel** (observations ou réanalyse réellement stockées). Pas de pages coquilles.

## Routes cibles V1

Préférer des URLs utiles et pas excessivement profondes :

- `/meteo/{region}/{departement}/{commune}` (ex. `/meteo/auvergne-rhone-alpes/isere/grenoble`)
- alias possibles plus tard : `/meteo/grenoble` si homonyme résolu
- `/meteo/.../historique`, `/records` **seulement** si contenu distinctif
- `/sources`, `/methodology`

Redirect depuis l’ancien slice `/weather/france/...` tant qu’il existe.

France : slugs stables + INSEE en donnée, pas comme seul URL si le nom change. Page indexable seulement si `seo_content_score` (données + historique + contenu distinctif) ≥ 50.

## Livré V1 Isère (2026-09-06)

- Titre / description / canonical par commune réelle (`generateMetadata`). Pas de température inventée dans la balise.
- `sitemap.xml` : accueil, comparer, naissance, sources, méthode + 512 communes du référentiel Isère (identité officielle + page date). Pas de millions de coquilles.
- `robots.txt` : `/dashboard` et `/api/` non indexés.
- Origine des URL : `NEXT_PUBLIC_SITE_URL` si défini, sinon `http://localhost:3000`.
- Pas encore : hreflang en, `seo_content_score` riche par volume de texte.
- Cartes de partage : `/og/{slug}/{date}` (PNG serveur). Températures seulement si une observation existe. Pas d’ERA5 sur la carte.

## Langues

`fr` + `en` dès le routage. Hreflang. Unités selon locale.

## Contenu minimum d’une page lieu

Maintenant (si dispo), historique, climat, records, sources utilisées, stations, timeline bornée.

Cartes sociales générées **serveur** avec attribution. Exemple : « Ce 15 août était le 4e plus chaud observé à Grenoble depuis 1950 » — uniquement si le ranking est vrai.
