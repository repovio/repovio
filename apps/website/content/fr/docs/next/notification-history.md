---
title: 'Historique de livraison'
description: 'Inspectez les résultats des notifications et les détails de livraison sécurisés par tentative.'
---

<a id="review-deliveries"></a>

## Vérifier les livraisons

Seuls les administrateurs système peuvent ouvrir **Notifications → Historique de livraison**. Le tableau distingue les
livraisons d'événements des tests et affiche le type d'événement, le référentiel, le lien sujet/fournisseur, le canal,
l'état, le nombre de tentatives, la tentative suivante et l'erreur finale nettoyée. Filtrez par type/statut et utilisez
le tri, les contrôles de colonnes et la pagination.

Ouvrez une diffusion pour son sujet, le demandeur s'il est présent, le canal, le statut et l'horodatage par tentative,
l'étiquette de l'appareil et l'erreur. Les secrets, les destinations de transport brutes et les informations
d'identification du fournisseur ne sont jamais renvoyés. Les diffusions push du navigateur peuvent contenir des
tentatives pour des appareils abonnés distincts.

<a id="interpret-outcomes"></a>

## Interpréter les résultats

Le timing d’attente/nouvelle tentative décrit un travail de livraison durable, et non une file d’attente de flux de
travail du fournisseur. Une tentative réussie confirme que le transport a accepté la livraison ; une panne nécessite une
enquête sur la configuration du canal et le service de destination. Il n’y a aucune action de réexécution, d’annulation
ou de nouvelle tentative manuelle dans cette vue historique. Corrigez le [canal](/docs/next/notifications) et utilisez
son action de test pour vérifier la configuration.

Un tableau vide peut refléter des filtres ou aucune livraison retenue. Une demande de liste/détail ayant échoué est
affichée séparément ; réessayez après la récupération. La synchronisation initiale peut intentionnellement ne produire
aucune livraison de cycle de vie. Le lien externe du sujet ouvre le contexte du fournisseur sans accorder d'accès en
écriture à Repovio.
