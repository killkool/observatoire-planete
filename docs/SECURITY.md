# Sécurité

- Secrets uniquement serveur, rotation, jamais dans le client ni le git.
- Interdits côté navigateur : jetons Météo-France, CDS, CMEMS, ECMWF, S3.
- Auth : FREE / PREMIUM / PRO / ADMIN / API_CUSTOMER.
- Protection injection SQL (requêtes paramétrées), XSS, CSRF, CSP.
- Rate limiting API ; WAF si exposé public.
- Scan dépendances.
- RGPD : minimisation, consentement cookies, export, suppression compte.
- Stripe : vérifier signatures, idempotence webhooks.
- L’IA ne produit pas de données météo.

Détail OWASP et headers : à enrichir en Phase 1 avec la stack réelle.
