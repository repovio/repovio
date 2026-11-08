---
title: 'Problèmes'
description: 'Parcourez les problèmes synchronisés, les filtres et les détails en lecture seule.'
---

<a id="browse-and-filter"></a>

## Parcourir et filtrer

Ouvrez **Présentation → Problèmes**. Les listes, les résumés, les choix de filtres et les détails utilisent les
adhésions au référentiel. Recherche par titre ou numéro ; filtrer par fournisseur, référentiel, cycle de vie, auteur,
responsable, jalon, étiquettes et heure de mise à jour, le cas échéant. Les limites de date mises à jour incluent UTC.
Plusieurs étiquettes sélectionnées doivent toutes correspondre. Modifiez le tri, les colonnes visibles et la pagination
avec les contrôles de table. Les cartes récapitulatives comptent les problèmes ouverts, récemment mis à jour, attribués
et obsolètes. La synchronisation initiale lit tous les problèmes ouverts et fermés mis à jour au cours des 90 jours
précédents. L'obsolescence aide à trouver un travail ouvert sans surveillance ; cela ne change pas l'état du
fournisseur.

<a id="inspect-details"></a>

## Inspecter les détails

Sélectionnez une ligne pour ouvrir sa page de détails Repovio. Examinez l’identité, le référentiel, l’auteur, les
destinataires, les étiquettes, le jalon, l’état du fournisseur, les horodatages et la description Markdown épurée. Le
contexte du flux de travail lié s'affiche lorsqu'il est disponible. Le HTML intégré et le balisage dangereux sont
supprimés. Les commentaires, réactions, pièces jointes et différences de code ne sont pas synchronisés. Utilisez le lien
du fournisseur pour commenter, attribuer, étiqueter, fermer, réviser, approuver ou fusionner. Repovio n'effectue aucune
de ces écritures.

<a id="synchronization-and-failures"></a>

## Synchronisation et échecs

Les webhooks signés mettent en file d'attente les lectures spécifiques au référentiel après une fenêtre de fusion de 15
secondes ; La réconciliation de 30 minutes couvre les événements manqués. Une actualisation du navigateur recharge les
données stockées. Si un enregistrement est absent, supprimez les filtres, vérifiez l'activation et l'appartenance au
référentiel, puis inspectez [Tâches de synchronisation](/docs/v2.0/guide-jobs). La conservation peut supprimer les
anciens enregistrements fermés. Une page de détails inaccessible peut indiquer un accès révoqué ou un enregistrement
supprimé ; revenir à la liste. Réessayez les échecs de demande après la récupération de l'API.
