# Backlog V2 / V3 — vision mondiale

Ces items **étaient** dans la roadmap active. Ils restent des objectifs longs terme. Ils ne s’exécutent **pas** tant que la V1 France grand public n’est pas un produit utilisable.

Constitution verbatim : [PROMPT_MAITRE_V2.md](./PROMPT_MAITRE_V2.md). Archive de l’ancienne roadmap : [roadmap-archive/GLOBAL_VISION.md](./roadmap-archive/GLOBAL_VISION.md).

Ne pas supprimer ces idées. Ne pas les mélanger aux phases R0–R14.

---

## Monde

- Recherche mondiale, identités de lieux ≠ homonymes de noms
- Traduction pays, moteur mondial de lieux
- GHCN progressif hors France
- Stations internationales
- Globe 3D / click-anywhere mondial
- ERA5 / ERA5-Land **mondial** (interdit en V1 ; stratégie point / régional / on-demand)
- Land / ocean / coast mask

## NOAA

- GHCN Daily mondial
- ISD / GHCNh
- OISST et autres produits océan NOAA
- Déduplication d’entités physiques France ↔ GHCN

## Océans

- Copernicus Marine (CMEMS), Méditerranée puis global
- SST, T(z), salinité, courants, vagues, niveau de mer
- NOAA océan
- Skills `06-copernicus-marine`, `09-ocean-statistics`

## Prévisions

- ECMWF Open Data IFS / AIFS
- Archive de runs si on promet un historique de prévisions
- Séparer past / present / future dans l’UI
- Application de prévision classique (hors différenciation V1)

## Plateforme data

- ClickHouse à grande échelle (absent aujourd’hui — ne pas l’introduire « au cas où »)
- Data lake mondial, Zarr ERA5 horaire planète
- Workers / tile-server / monorepo `apps/` complet
- Redis (seulement si un besoin V1 l’a déjà démontré, sinon rester ici)

## API & business V2

- API commerciale versionnée, clés, quotas, billing usage
- Portail développeurs
- Offres Ocean / Climate / Source Fusion
- i18n `en` dès le routage mondial
- Verticales Pro (hors certification maritime)

## PoC reportés

- PoC 2 Méditerranée (CMEMS)
- PoC 3 prévision ECMWF

---

## Ce qui reste vrai en V2 comme en V1

- Ne jamais inventer une donnée.
- Réanalyse ≠ observation.
- Pas de moyenne aveugle multi-sources.
- E-OBS `DISABLED`.
- Gratuit ≠ commercialisable.
- Page vue = 0 appel fournisseur.
