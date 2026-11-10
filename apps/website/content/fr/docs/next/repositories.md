---
title: 'Dépôts'
description: "Suivez les référentiels, inspectez l'activité et configurez la synchronisation et l'accès locaux."
---

<a id="browse-and-open-details"></a>

## Parcourir et ouvrir les détails

Ouvrez un dépôt depuis le tableau pour accéder à la vue d’ensemble, aux exécutions de workflows, aux issues, aux pull
requests, aux alertes de sécurité et aux paramètres. Les pages d’activité restent limitées au dépôt et proposent
filtres, tri, pagination et navigation par ligne. Les alertes nécessitent des droits de gestion ; les paramètres sont
réservés aux administrateurs système. Le lien du fournisseur ouvre le dépôt externe.

La vue d’ensemble affiche les informations générales, la rétention, la dernière synchronisation, l’âge des données,
l’intervalle, le job actuel et l’activité récente. Les jobs en attente ou en cours affichent leur progression et des
erreurs classées sans données sensibles.

<a id="add-and-maintain-tracking"></a>

## Ajouter et maintenir le suivi

Seuls les administrateurs système ajoutent des référentiels. Sélectionnez un compte fournisseur activé, attendez la
découverte et sélectionnez un ou plusieurs référentiels non suivis. Les référentiels déjà suivis sont exclus. Si une
partie d'un ajout multiple échoue, les sélections réussies restent ajoutées et seules les sélections échouées restent
pour une nouvelle tentative. Une liste de fournisseurs vide nécessite d'abord de connecter un
[compte fournisseur](/docs/next/provider-accounts) activé.

Les administrateurs peuvent activer/désactiver le suivi, **Actualiser les données du fournisseur** et mettre en file
d'attente une synchronisation en lecture seule. L'identité du référentiel utilise le compte du fournisseur et l'ID du
référentiel du fournisseur stable. Les renommages/transferts préservent l'historique, les filtres, les adhésions et les
chaînes ; L'actualisation des métadonnées rejette un ID différent sur l'ancien chemin plutôt que de le réattribuer. Les
référentiels désactivés conservent les données stockées mais cessent de participer à la synchronisation.

<a id="repository-settings-sections"></a>

## Sections des paramètres du dépôt

Les paramètres du dépôt proposent cinq onglets secondaires. Chaque section utilise toute la largeur disponible et les champs s’empilent sur les petits écrans. Les liens des onglets peuvent être partagés et restaurés après rechargement ou navigation Précédent/Suivant. Général est sélectionné par défaut.

| Section           | Fonction                                 | Adresse                      |
| ----------------- | ---------------------------------------- | ---------------------------- |
| Général           | Durées de conservation                   | `/repositories/:id/settings` |
| Webhook           | Configuration du webhook du dépôt        | `?tab=webhook`               |
| Filtres de flux   | Motifs d’autorisation et d’exclusion     | `?tab=workflow-filters`      |
| Membres           | Accès directs et rôles des utilisateurs  | `?tab=members`               |
| Accès des groupes | Accès supplémentaires des groupes locaux | `?tab=groups`                |

Les saisies non enregistrées et les requêtes en cours sont conservées lors du changement d’onglet pendant une même visite. Quitter les paramètres ou changer de dépôt efface ces brouillons, y compris les secrets de webhook générés. Utilisez l’action d’enregistrement ou d’attribution de la section pour conserver les modifications.

La boîte de détails rapide a été supprimée. Les anciens liens `?repository=` ouvrent la vue d’ensemble. Les pages complètes conservent l’actualisation, la synchronisation, les liens du fournisseur et la suppression locale. Modifier l’URL ne donne aucun accès aux paramètres aux lecteurs ou gestionnaires.

<a id="retention-filters-and-memberships"></a>

## Rétention, filtres et adhésions

Les administrateurs définissent des remplacements de conservation distincts pour l'exécution du workflow, les problèmes
et les demandes d'extraction, chacun allant de 1 à 3 650 jours. Une valeur vide restaure le
[défaut du système](/docs/next/settings-system) correspondant. Les filtres de workflow acceptent les modèles globaux
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
gestionnaire secret. Suivez [Webhooks du référentiel](/docs/next/provider-webhooks) pour la configuration et la
vérification.

Les lecteurs et gestionnaires consultent les métadonnées en lecture seule dans la vue d’ensemble ; les paramètres restent réservés aux administrateurs. Réessayez après correction et consultez les [Jobs](/docs/next/guide-jobs) pour les erreurs de synchronisation.

<a id="local-user-and-group-management"></a>

## Groupes d’accès locaux

Dans Accès des groupes du dépôt, attribuez Viewer ou Manager, modifiez ou retirez le rôle. Les droits directs et hérités
se combinent ; Manager prévaut. La gestion nécessite toujours le rôle global Manager ; les administrateurs restent sans
restriction. Le retrait agit à la requête suivante sauf autre droit conservé. Les groupes locaux acceptent les comptes
locaux et OIDC, sans synchronisation des claims OIDC.

[Groupes d’accès locaux](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Supprimer le suivi local

Les administrateurs système peuvent sélectionner **Supprimer le dépôt** sur la page de détails. La confirmation nomme le dépôt et explique la suppression définitive des workflows, exécutions, issues,
pull requests, alertes de sécurité, paramètres, attributions d’accès, historiques de webhooks, états de synchronisation
et historiques de notifications associés localement. Le compte fournisseur et les données du dépôt chez le fournisseur
restent inchangés.

La suppression est bloquée pendant une synchronisation ; attendez sa fin et réessayez. Les demandes en attente sont
supprimées avec le dépôt. Les abonnements perdent le filtre de ce dépôt ; un abonnement limité uniquement à ce dépôt
est supprimé au lieu de devenir global. Les canaux partagés sont conservés.

Le dépôt peut être ajouté à nouveau via la sélection du fournisseur existante. Le suivi repart de zéro, sans restaurer
l’historique ni les paramètres locaux précédents.
