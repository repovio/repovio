---
title: 'Tâches de synchronisation du référentiel'
description: 'Surveillez et démarrez manuellement les tâches de synchronisation du référentiel Repovio.'
---

Ouvrez **Tâches** dans la section**Opérations** pour inspecter le travail de synchronisation pour chaque référentiel
activé auquel vous pouvez accéder. Le résumé affiche les tâches en cours d'exécution, en attente, en échec et inactives.
Le tableau identifie le référentiel, le fournisseur, les domaines synchronisés, la phase en cours, la progression de
l'élément, la tentative et le message d'erreur sécurisé le plus récent.

<a id="read-job-state"></a>

## Lire l'état du travail

- **Idle** signifie qu'aucune synchronisation n'est en file d'attente ou en cours d'exécution pour le référentiel.
- **En attente** signifie que la demande durable attend l'heure prévue ou un travailleur disponible.
- **En cours** affiche la phase active et la progression de l'élément lorsque le fournisseur rapporte un total
  mesurable.
- **Échec** conserve un résumé des erreurs sécurisé et le nombre de tentatives jusqu'à ce que le référentiel soit à
  nouveau mis en file d'attente.
- **Avertissement** signifie que d'autres étendues ont été complétées alors qu'un ou plusieurs types d'alertes de
  sécurité n'étaient pas disponibles.

La colonne Étendues indique si la tâche lit des flux de travail, des problèmes, des demandes d'extraction, des alertes
de sécurité ou une combinaison. Un temps d'attente peut refléter la fusion d'un webhook, une nouvelle tentative
d'interruption ou des instructions de limite de débit du fournisseur ; L'actualisation répétée de la page ne fait pas
avancer l'heure programmée.

<a id="start-or-retry-synchronization"></a>

## Démarrer ou réessayer la synchronisation

Un administrateur système peut démarrer chaque tâche actuellement inactive, en échec ou avec avertissement avec **Tout
exécuter**, ou utiliser**Exécuter** ou**Réessayer** sur une ligne du référentiel. Les tâches déjà en attente ou en cours
d'exécution ne sont pas à nouveau mises en file d'attente. Le bouton de lancement reste dans son état de chargement
jusqu'à ce que la demande soit terminée ; puis suivez la ligne à mesure qu'elle se déplace en attente, en cours
d'exécution et inactive ou en échec.

Les tâches manuelles utilisent la même file d'attente de synchronisation de fournisseur durable et en lecture seule que
la réconciliation planifiée et les webhooks vérifiés. Ils récupèrent les données du fournisseur mais ne peuvent pas
modifier les référentiels, les flux de travail, les problèmes ou les demandes d'extraction.

Les tâches réussies reviennent à **Idle** et ne sont pas conservées dans l'historique d'exécution. Les tâches ayant
échoué restent visibles jusqu'à ce qu'un webhook ultérieur, un cycle de réconciliation ou une nouvelle tentative
manuelle les mette à nouveau en file d'attente. Si une nouvelle tentative échoue, vérifiez le compte du fournisseur, les
étendues de lecture, l'URL de base et l'état de limite de débit dans
[Administration et paramètres](/docs/next/provider-accounts) avant de réessayer.

<a id="refresh-and-table-controls"></a>

## Actualisation et contrôles de table

Les tâches sont actualisées automatiquement toutes les cinq secondes. Le tableau contient par défaut dix lignes par page
et mémorise la taille de la page. Exécuter toutes les tâches, y compris les tâches inactives, en échec et
d'avertissement ; les lignes en attente/en cours d'exécution ne peuvent pas être à nouveau mises en file d'attente. Les
échecs de chargement initial et en arrière-plan sont affichés séparément des échecs de tâche. Le tri et la pagination
aident à inspecter les installations plus grandes.
