# ADR-0001 — Démarrer par la France et le bulk Météo-France

- Status: accepted
- Date: 2026-09-06

## Contexte

Le produit vise le monde, mais un ERA5 mondial horaire et un océan global dès le jour 1 sont trop chers et trop risqués (licences, volumes, qualité).

## Décision

1. Valider le moteur sur **Isère / Grenoble** avec observations Météo-France **bulk** (Licence Ouverte 2.0).
2. Ajouter ERA5 en **complément point**, jamais comme station.
3. Ne pas utiliser E-OBS.
4. Ne pas poser l’architecture sur une seule source.
5. Ne pas télécharger la grille mondiale ERA5 horaire.

## Conséquences

Le code et le schéma restent **agnostiques pays**. Les connecteurs nationaux sont des plugins. Le MVP n’est pas mondial.
