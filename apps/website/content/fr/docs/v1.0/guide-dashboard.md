---
title: 'Tableau de bord'
description: 'Lisez l’état actuel du flux de travail, les résumés de travail et les graphiques historiques.'
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="scope-and-date-range"></a>

## Portée et plage de dates

Chaque carte et chaque graphique utilise uniquement des référentiels que l'utilisateur connecté peut lire. Sélectionnez
**7 derniers jours**,**30 derniers jours** ou**90 derniers jours** pour les statistiques historiques. La plage de temps
modifie les totaux d’exécutions terminées, les tendances de réussite/erreur, la durée et la distribution des statuts. Le
nombre actuel de files d’attente et d’éléments de travail reste des résumés de l’état actuel. Sélectionnez**Actualiser**
pour recharger le tableau de bord ; le contrôle reste occupé jusqu'à ce que ses demandes soient réglées.

<a id="summary-and-navigation"></a>

## Résumé et navigation

Le résumé du flux de travail contient le taux de réussite/le nombre d'exécutions, le nombre d'actifs en file
d'attente/en cours d'exécution, la durée médiane terminée, les échecs actuels, le nombre d'approbations en attente et
les totaux d'exécution. Suivez les échecs actuels jusqu’au [A besoin d'attention](/docs/v1.0/needs-attention) ou les
approbations en attente jusqu’au [En attente d'approbation](/docs/v1.0/awaiting-approval). Les résumés des problèmes et
des demandes d’extraction sont liés à leurs propres listes filtrées. Les gestionnaires et les administrateurs voient
également des résumés d'alertes de sécurité pour les référentiels qu'ils gèrent.

La carte d'exécution active ouvre un filtre `preset=active` amovible ; les cartes d'éléments de travail actuelles
ouvrent également des préréglages amovibles. Les changements de filtre manuels libèrent le préréglage.

Le graphique de tendance compare les exécutions réussies et échouées au fil du temps. Les groupes de distribution de
statuts regroupent les états normalisés. **Dernières exécutions** affiche l'activité récente du flux de travail avec des
liens vers le fournisseur. Il ne s'agit pas d'une visionneuse de journaux de fournisseur intégrée. Repovio ne peut pas
approuver ou réexécuter les flux de travail à partir d'un widget de tableau de bord.

<a id="empty-and-partial-results"></a>

## Résultats vides et partiels

Aucune exécution terminée au cours de la période sélectionnée ne produit des graphiques vides. Aucune panne de courant
n'est différente d'une connexion de fournisseur manquante. Si une requête échoue, une bannière d'erreur identifie le
chargement partiel tandis que les sections disponibles restent visibles. Actualisez après la récupération ou inspectez
[Tâches de synchronisation](/docs/v1.0/guide-jobs) et la dernière synchronisation du référentiel.
