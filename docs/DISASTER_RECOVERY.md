# Disaster recovery

## Priorité de restauration

1. Secrets / accès comptes fournisseurs
2. PostgreSQL (users, billing, registry, mappings, derived)
3. Métadonnées object storage (inventaire raw)
4. Services app
5. Raw retéléchargeables (rejeu pipelines) — RTO plus long acceptable

## Règles

- Documenter RPO/RTO quand l’infra existe.
- Tester une restauration périodiquement (pas seulement un backup qui « tourne »).
- Quarantine et lineage doivent survivre : ils expliquent l’état des données.
- Changement de licence : ne pas effacer raw ; bloquer nouveaux usages.

Procédures concrètes (dump, bucket, runbooks) : Phase 1 infrastructure.
