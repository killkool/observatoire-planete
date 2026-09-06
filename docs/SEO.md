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
- `sitemap.xml` : accueil, comparer, naissance, sources, méthode + communes **indexables** (`seo_content_score` ≥ 50, `seo-content-v1`). Identité officielle + années climatiques réelles ou au moins une mesure **OBSERVED**. Pas d’ERA5, pas de millions de coquilles, pas de `hasDistinctiveHistory: true` inventé.
- `robots.txt` : `/dashboard` et `/api/` non indexés.
- Origine des URL : `NEXT_PUBLIC_SITE_URL` si défini, sinon `http://localhost:3000`.
- Hreflang V1 : `fr` + `x-default` vers la même URL française. **Pas** de lien `en` tant qu’il n’existe pas de page anglaise (routage `en` = [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md)).
- JSON-LD : `WebSite` (accueil), `WebPage` + `City` (INSEE, geo) + `BreadcrumbList` sur la commune. `WeatherObservation` seulement si une mesure **OBSERVED** existe pour la date ; Tmin/Tmax/pluie omises si NULL, jamais inventées. Pas d’ERA5 dans le graphe.
- `seo_content_score` (`seo-content-v1`) : 40 identité officielle + 20/40 années climatiques (1 / ≥ 10) + 20 historique distinctif (série annuelle ou jours observés). Seuil 50. Page sous le seuil : visitable, `noindex`. Ce n’est **pas** un scorer de volume de texte.
- Pas encore : pages `en`, SearchAction (la recherche est un GET `/api/` non indexé).
- Cartes de partage : `/og/{slug}/{date}` (PNG serveur). Températures seulement si une observation existe. Pas d’ERA5 sur la carte.

## Langues

`fr` dès le HTML (`lang="fr"`) et les balises hreflang. `en` dès qu’il y aura un vrai routage bilingue — pas avant. Unités selon locale quand `en` existera.

## Contenu minimum d’une page lieu

Maintenant (si dispo), historique, climat, records, sources utilisées, stations, timeline bornée.

Cartes sociales générées **serveur** avec attribution. Exemple : « Ce 15 août était le 4e plus chaud observé à Grenoble depuis 1950 » — uniquement si le ranking est vrai.
