# Modèle économique

Hypothèses de marché à **tester**, non gravées. Aucun prix n’est une décision finale.

## 1. Promesse commerciale

> La meilleure information météo / climat / océan disponible pour un point et une date, avec l’origine et un niveau de confiance explicable.

Ce n’est pas une copie de Météo-France, Windy ou Weather.com. Différenciation :

- fusion multi-sources (sans moyenne aveugle)
- transparence (source inspector)
- histoire longue
- terre + océans
- time machine
- confiance documentée
- comparaison lieu / date / source
- API unifiée à valeur ajoutée (pas un proxy)

Marque propre. Interdit : « Météo-France World » ou tout nom d’agence.

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

### API (B2B, usage based)

Produits possibles : Weather History, Climate, Ocean, Source Fusion, Climate Statistics.

Réponse : `preferred_value` + alternatives + confidence + provenance.

Metering, clés, quotas, logs. Stripe : abonnements + usage, webhooks idempotents.

## 3. Ce qui est vendu

Normalisation, agrégation, cache, indexation, statistiques, fusion, provenance, simplicité, SLA Pro/API.

Interdit : `proxy_request → source gratuite`.

## 4. Océan / météo / climat — marchés

| Domaine | Exemples | Limite |
|---|---|---|
| Océan | nautisme, plongée, surf, pêche, ports, offshore, tourisme | pas d’aide à la navigation officielle sans certification |
| Météo | agriculture, BTP, énergie, event, médias | |
| Climat | journalisme, collectivités, enseignement, risques | méthode visible ; pas de certification implicite |

## 5. SEO programmatique

Pages indexables **seulement** si contenu significatif (vrai historique, vraies stats) : pays, région, ville, date, climat, records, mois, année. `fr` + `en`.

Exemples de requêtes : *historical weather Grenoble*, *climate Grenoble*, *weather Grenoble 1983*.

## 6. Conformité

- Licences : [DATA_LICENSES.md](./DATA_LICENSES.md)
- RGPD : minimisation, consentement, export, suppression, politiques
- Disclaimer UI : type d’origine visible (icônes + texte)
- Pages `/sources`, `/methodology`, « Comment obtenons-nous les données ? »

## 7. Go-to-market du MVP

Le premier marché n’est pas le monde : **France**, preuve Grenoble, puis SEO communes, puis Premium source inspector.

L’API commerciale arrive **après** un moteur fiable, pas avant.
