# Modèle économique

Hypothèses de marché à **tester**, non gravées. Aucun prix n’est une décision finale.

**V1 :** croissance par le **trafic grand public** (histoire météo de la France). API, océan, monde : [BACKLOG_V2_GLOBAL.md](./BACKLOG_V2_GLOBAL.md).

## 1. Promesse commerciale (V1)

> La mémoire météo de la France : chercher une commune, une date, des records, des comparaisons, sans jargon scientifique.

Ce n’est pas une copie de Météo-France, Windy ou Weather.com. Différenciation V1 :

- historique long, lisible
- commune → station en arrière-plan
- provenance simple (« mesure officielle », station à X km)
- records et « ce jour dans l’histoire »
- comparaisons villes / années
- SEO de pages **vraiment** utiles

Marque propre. Interdit : « Météo-France World » ou tout nom d’agence.

Vision V2 (terre + océans + fusion mondiale + API) : conservée, pas vendue maintenant.

## 2. Quatre étages

### FREE

- historique de base, cartes de base, records publics, pages SEO
- comparaison limitée
- pas de SLA

### PREMIUM (hypothèse 5–10 € / mois)

- historique avancé, source inspector, exports, comparaisons multiples
- favoris, couches supplémentaires

### PRO (hypothèse 20–100+ € / mois)

Verticales : journalistes, tourisme, agriculture, énergie, événementiel, maritime, assurance, immobilier, collectivités.

Exports CSV / JSON / PDF / PNG ; NetCDF subset éventuel.

**Pas** un système officiel de sécurité maritime. **Pas** une étude climatologique certifiée automatique.

### API (B2B, usage based) — PARK V2

Ne pas construire en V1 : clés, billing API, quotas complexes, portail développeurs.

Plus tard : Weather History, Climate, éventuellement Ocean / Source Fusion. Réponse : `preferred_value` + alternatives + confidence + provenance. Stripe usage **seulement** si le moteur est déjà fiable.

## 3. Ce qui est vendu

Normalisation, agrégation, cache, indexation, statistiques, fusion, provenance, simplicité, SLA Pro/API.

Interdit : `proxy_request → source gratuite`.

## 4. Marchés

| Priorité | Public | Limite |
|---|---|---|
| V1 | Grand public (dates perso, souvenirs, climat local) | pas un terminal scientifique |
| V1 secondaire | Enseignants, journalistes, passionnés | méthode visible ; pas de certification climatologique automatique |
| V2 | Pro / maritime / API | pas d’aide à la navigation officielle sans certification |

## 5. SEO programmatique

Pages indexables **seulement** si contenu significatif (vrai historique, vraies stats) : commune, date, climat, records, mois, année. Score `seo_content_score`. Pas de millions de pages faibles. V1 : `fr`. `en` en V2.

Exemples : *météo historique Grenoble*, *climat Grenoble*, *météo Grenoble 1983*, *été 2003 Grenoble*.

## 6. Conformité

- Licences : [DATA_LICENSES.md](./DATA_LICENSES.md)
- RGPD : minimisation, consentement, export, suppression, politiques
- Disclaimer UI : type d’origine visible (icônes + texte)
- Pages `/sources`, `/methodology`, « Comment obtenons-nous les données ? »

## 7. Go-to-market du MVP

1. Trafic grand public France (recherche + pages communes).
2. FREE très complet (ne pas cacher l’intérêt principal derrière un paywall).
3. PREMIUM seulement après validation d’intérêt (comparaisons avancées, exports, favoris, éventuellement sans pub).
4. Publicité possible techniquement, sans casser Core Web Vitals ni la crédibilité.
5. API commerciale : V2.

L’API n’arrive **pas** avant un moteur fiable. Stripe : R13 si validé.
