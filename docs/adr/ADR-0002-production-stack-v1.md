# ADR-0002 — Architecture de production V1 France

- Status: accepted
- Date: 2026-09-06
- Document directeur : [ARCHITECTURE_PRODUCTION.md](../ARCHITECTURE_PRODUCTION.md)

## Contexte

Le slice Isère tourne encore en **Next.js 15 + SQLite + Recharts**. Un document de production (stack Vercel / Supabase / R2 / worker Python) a été adopté comme référence technique V1.

## Décision

1. [ARCHITECTURE_PRODUCTION.md](../ARCHITECTURE_PRODUCTION.md) est la **référence technique officielle** de la V1 France (décisions §47).
2. Le runtime actuel est un **prototype local**. Il ne contredit pas la cible : on n’ajoute pas Redis, ClickHouse, Elasticsearch, Kubernetes ni des microservices.
3. Le schéma d’observations reste **une ligne par station et par jour**.
4. Les statistiques lourdes sont **précalculées** (d’abord en SQLite, mêmes tables que PostgreSQL).
5. ERA5 mondial, océan, API commerciale : hors V1.
6. Migration Postgres/Supabase/R2/worker Docker : dès qu’un `DATABASE_URL` réel existe, **par migrations**, sans jeter le slice SQLite tant qu’il sert de preuve.

## Conséquences

- Toute nouvelle brique doit répondre aux 6 questions du §43 du document de production.
- ECharts, Tailwind, Vitest, Playwright, Drizzle : cibles, pas un big-bang immédiat.
- Une page vue ne déclenche ni import MF, ni job ERA5, ni agrégation brute de millions de lignes.
