# SEO programmatique

Indexable seulement si **contenu réel** (observations ou réanalyse réellement stockées). Pas de pages coquilles.

## Routes cibles

- `/weather/{country}/{region}/{admin}/{place}`
- `/weather/.../{place}/{yyyy}` et `/{yyyy}/{mm}` et `/{yyyy}/{mm}/{dd}`
- `/climate/...`
- `/records/...`
- `/sources`, `/methodology`

France : slugs stables + INSEE en donnée, pas comme seul URL si le nom change.

## Langues

`fr` + `en` dès le routage. Hreflang. Unités selon locale.

## Contenu minimum d’une page lieu

Maintenant (si dispo), historique, climat, records, sources utilisées, stations, timeline bornée.

Cartes sociales générées **serveur** avec attribution. Exemple : « Ce 15 août était le 4e plus chaud observé à Grenoble depuis 1950 » — uniquement si le ranking est vrai.
