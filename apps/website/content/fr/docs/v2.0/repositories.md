---
title: 'Dépôts'
description: "Suivez les référentiels, inspectez l'activité et configurez la synchronisation et l'accès locaux."
---

<a id="browse-and-open-details"></a>

## Parcourir et ouvrir les détails

Tous les utilisateurs connectés peuvent répertorier les référentiels qu'ils peuvent lire. Le tableau affiche le
propriétaire/nom, l'état activé, les membres, le nombre d'exécutions conservées, la rétention et la dernière
synchronisation. Utilisez le filtrage, le tri, les contrôles de colonnes et la pagination activés. Ouvrez le lien du
fournisseur pour le référentiel externe, la page de détails pour l'activité synchronisée ou la boîte de dialogue des
paramètres pour la configuration. Une adhésion manquante ou un référentiel supprimé peut produire un état détaillé
inaccessible.

La page de détails combine les informations générales, la conservation, la dernière synchronisation/l'âge des données,
l'intervalle configuré, la tâche en cours et les flux de travail, problèmes et demandes d'extraction récents. Les
responsables disposant d'un accès à la gestion du référentiel et les administrateurs voient également l'activité des
alertes de sécurité. Les tâches en attente/en cours d'exécution affichent la progression ; les avertissements et les
échecs incluent des erreurs de sécurité catégorisées.

<a id="add-and-maintain-tracking"></a>

## Ajouter et maintenir le suivi

Seuls les administrateurs système ajoutent des référentiels. Sélectionnez un compte fournisseur activé, attendez la
découverte et sélectionnez un ou plusieurs référentiels non suivis. Les référentiels déjà suivis sont exclus. Si une
partie d'un ajout multiple échoue, les sélections réussies restent ajoutées et seules les sélections échouées restent
pour une nouvelle tentative. Une liste de fournisseurs vide nécessite d'abord de connecter un
[compte fournisseur](/docs/v2.0/provider-accounts) activé.

Les administrateurs peuvent activer/désactiver le suivi, **Actualiser les données du fournisseur** et mettre en file
d'attente une synchronisation en lecture seule. L'identité du référentiel utilise le compte du fournisseur et l'ID du
référentiel du fournisseur stable. Les renommages/transferts préservent l'historique, les filtres, les adhésions et les
chaînes ; L'actualisation des métadonnées rejette un ID différent sur l'ancien chemin plutôt que de le réattribuer. Les
référentiels désactivés conservent les données stockées mais cessent de participer à la synchronisation.

<a id="retention-filters-and-memberships"></a>

## Rétention, filtres et adhésions

Les administrateurs définissent des remplacements de conservation distincts pour l'exécution du workflow, les problèmes
et les demandes d'extraction, chacun allant de 1 à 3 650 jours. Une valeur vide restaure le
[défaut du système](/docs/v2.0/settings-system) correspondant. Les filtres de workflow acceptent les modèles globaux
**ALLOW** et**DENY** ; le refus est prioritaire. Ajoutez des modèles non vides ou supprimez ceux existants. Des filtres
restrictifs peuvent expliquer les exécutions absentes.

Dans les adhésions, ajoutez un utilisateur non-administrateur en tant qu'observateur ou gestionnaire, modifiez son rôle
de référentiel ou supprimez l'accès. Les administrateurs sont exclus de la sélection des membres car ils disposent déjà
d'un accès illimité. Un Manager global a toujours besoin d'être membre du Manager pour les fonctionnalités de gestion du
référentiel telles que les alertes de sécurité.

<a id="webhooks-and-failures"></a>

## Webhooks et échecs

La carte webhook du référentiel affiche l'URL de rappel, l'état configuré, les instructions du fournisseur et la
dernière livraison. Il peut générer/copier un secret, enregistrer la configuration, effectuer une rotation avec
confirmation explicite ou supprimer la configuration. Une URL publique manquante doit être corrigée avant
l'enregistrement du fournisseur. Les secrets sont affichés uniquement lors de la configuration ; conservez-les dans un
gestionnaire secret. Suivez [Webhooks du référentiel](/docs/v2.0/provider-webhooks) pour la configuration et la
vérification.

Les visualiseurs et les gestionnaires reçoivent un résumé des paramètres du référentiel en lecture seule. Réessayez de
charger/enregistrer les erreurs après la récupération ; inspectez [Tâches de synchronisation](/docs/v2.0/guide-jobs)
pour détecter les échecs d’accès au fournisseur, de limite de débit ou de synchronisation.

<a id="local-user-and-group-management"></a>

## Groupes d’accès locaux

Dans Accès des groupes du dépôt, attribuez Viewer ou Manager, modifiez ou retirez le rôle. Les droits directs et hérités
se combinent ; Manager prévaut. La gestion nécessite toujours le rôle global Manager ; les administrateurs restent sans
restriction. Le retrait agit à la requête suivante sauf autre droit conservé. Les groupes locaux acceptent les comptes
locaux et OIDC, sans synchronisation des claims OIDC.

[Groupes d’accès locaux](/docs/v2.0/users#local-access-groups)
