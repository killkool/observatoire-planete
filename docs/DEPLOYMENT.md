# Déploiement

Cible : conteneurs (`apps/web`, `api`, `worker`, `tile-server`) + PostgreSQL/PostGIS + object storage + CDN tuiles.

Local Phase 1 : Docker Compose (PostGIS, MinIO). Le prototype Next+SQLite reste un fallback de démo jusqu’à bascule.

CI : lint, unit, tests data sur golden Grenoble dès qu’ils existent. Pas de secret dans les logs.

SLO (à chiffrer plus tard) : dispo site / API, fraîcheur sources, latence. Pas de SLA pour FREE.

Versions Active LTS (Node, Next, Python) : prendre les correctifs de sécurité du moment, ne pas figer une version morte dans ce doc.
