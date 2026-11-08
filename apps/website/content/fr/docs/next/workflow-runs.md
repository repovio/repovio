---
title: 'Toutes les exécutions'
description: 'Recherchez, filtrez et inspectez l’historique des flux de travail conservé sans modifier les ressources du
  fournisseur.'
---

<a id="browse-retained-runs"></a>

## Parcourir les exécutions conservées

Ouvrez **Présentation → Exécutions du workflow → Toutes les exécutions**. Les résultats sont étendus aux référentiels
accessibles et à l'historique conservé. Utilisez des filtres de référentiel, de fournisseur, de statut et de durée (la
durée est saisie en secondes). Toutes les exécutions n'ont pas de champ de recherche de texte ; Nécessite une attention
particulière, ajoute une recherche et des colonnes détaillées créées/démarrées. Triez les colonnes, modifiez les
colonnes visibles et paginez les résultats. Effacez les filtres si une exécution attendue est manquante.

Les lignes identifient le flux de travail et le référentiel, le fournisseur, le statut normalisé, les horodatages du
fournisseur et la durée lorsqu'ils sont fournis. Les exécutions en file d’attente ou inachevées peuvent manquer de temps
d’achèvement ou de durée finale. Les états normalisés sont `queued`, `running`, `success`, `failed`, `cancelled`,
`skipped` et `unknown`. Un état inconnu doit être vérifié auprès du fournisseur.

<a id="open-a-run"></a>

## Ouvrir une course

Utilisez l’action de ligne externe pour ouvrir l’exécution du fournisseur et ses journaux. Repovio ne fournit pas
d'écran d'exécution modifiable distinct, ne télécharge pas les artefacts du fournisseur et ne synchronise pas les
journaux complets. Approuvez, réexécutez, annulez ou expédiez uniquement auprès du fournisseur avec votre compte
fournisseur. Pour les pannes actuelles, utilisez [A besoin d'attention](/docs/next/needs-attention) ; pour les portails,
utilisez [En attente d'approbation](/docs/next/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Historique manquant ou périmé

Un tableau vide signifie qu'aucun enregistrement conservé ne correspond aux filtres et à vos autorisations. La rétention
peut supprimer les exécutions plus anciennes. Vérifiez l'activation du référentiel, les adhésions, les modèles
d'autorisation/refus de flux de travail et [Tâches de synchronisation](/docs/next/guide-jobs). Une actualisation de page
recharge les données stockées ; il ne contourne pas la file d'attente de synchronisation durable. Réessayez de charger
les erreurs après la récupération de l'API.
