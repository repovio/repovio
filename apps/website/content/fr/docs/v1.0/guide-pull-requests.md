---
title: 'Demandes de fusion'
description: "Parcourez les demandes d'extraction synchronisées, les filtres et les détails en lecture seule."
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="browse-and-filter"></a>

## Parcourir et filtrer

Ouvrez **Présentation → Demandes d'extraction**. Les listes, les résumés, les choix de filtres et les détails utilisent
les adhésions au référentiel. Recherche par titre ou numéro ; filtrer par fournisseur, référentiel, cycle de vie,
auteur, destinataire, état de brouillon, état du flux de travail, exigence d'approbation, étiquettes et heure de mise à
jour. Les limites de date mises à jour incluent UTC. Plusieurs étiquettes sélectionnées doivent toutes correspondre.
Modifiez le tri, les colonnes visibles et la pagination avec les contrôles de table. Les cartes récapitulatives comptent
les modifications ouvertes, les brouillons, les flux de travail ayant échoué et les approbations de flux de travail.
GitLab utilise le terme demande de fusion. Les détails affichent les branches source/cible, l'état du brouillon, le
cycle de vie et l'état global du flux de travail. L'agrégat utilise l'exécution la plus récente pour chaque flux de
travail lié ; les résultats ayant échoué ont priorité sur les résultats en cours d'exécution, en attente, annulés,
réussis et inconnus. Une exigence d’approbation de flux de travail n’est pas une approbation de révision de code, une
approbation de fusion ou un indicateur de conflit de fusion.

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
référentiel, puis inspectez [Tâches de synchronisation](/docs/v1.0/guide-jobs). La conservation peut supprimer les
anciens enregistrements fermés. Une page de détails inaccessible peut indiquer un accès révoqué ou un enregistrement
supprimé ; revenir à la liste. Réessayez les échecs de demande après la récupération de l'API.
