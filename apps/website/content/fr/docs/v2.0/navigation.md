---
title: 'Navigation'
description:
  'Recherchez les destinations des applications, leur statut, leurs paramètres personnels et leurs informations de
  version.'
---

<a id="sidebar"></a>

## Barre latérale

**Présentation** contient le tableau de bord, les exécutions de workflow, les problèmes, les demandes d'extraction et
les alertes de sécurité prises en charge.**Opérations** contient des référentiels, des tâches et des
notifications.**Administration** contient les comptes de fournisseur, les utilisateurs et les paramètres des
administrateurs système. Les exécutions de flux de travail s'étendent à Toutes les exécutions, En attente d'approbation
et Nécessite une attention ; la navigation par notification expose les canaux et, pour les administrateurs, l'historique
de livraison.

La barre latérale propose uniquement les destinations auxquelles votre rôle peut accéder. Les alertes de sécurité
nécessitent une autorisation de gestion. La réduction de la barre latérale préserve les destinations étiquetées. Sur les
écrans étroits, utilisez le contrôle de navigation pour ouvrir la barre latérale. Le manuel documente chaque domaine de
rôle même lorsque votre compte ne peut pas le voir.

<a id="status-and-search"></a>

## Statut et recherche

Utilisez [Recherche](/docs/v2.0/search) dans la barre d'applications pour rechercher des destinations et des ressources
synchronisées. La barre d'état indique la connectivité API, l'activité de synchronisation et le nombre de flux de
travail en cours d'exécution. Son compteur de flux de travail en cours d'exécution ouvre
[Tâches de synchronisation](/docs/v2.0/guide-jobs) ; l'activité de synchronisation peut inclure la progression de
l'élément. La récupération de connexion actualise l’état. Un indicateur déconnecté signifie que les mises à jour en
direct peuvent être obsolètes ; inspectez l’API et réessayez avant de vous fier aux décomptes affichés.

<a id="user-menu-and-footer"></a>

## Menu utilisateur et pied de page

Le menu utilisateur ouvre le [Paramètres](/docs/v2.0/settings) personnel, les commandes de langue et d'apparence, et se
déconnecte. Le pied de page renvoie au projet et au manuel. La sélection de la version affichée ouvre la boîte de
dialogue du journal des modifications. Ses notes de version et son indicateur de mise à jour aident à identifier une
version disponible ; l'application d'une mise à niveau reste une opération de déploiement. Les liens des fournisseurs
ouvrent des ressources externes. Les actions ici nécessitent les propres autorisations du fournisseur et se déroulent en
dehors de Repovio.

<a id="table-controls"></a>

## Contrôles de table partagés

Lorsqu'elles sont proposées, les options de tableau configurent la visibilité, l'ordre et l'épinglage des colonnes ; la
colonne des actions reste épinglée à droite. Les options persistent par table dans le navigateur. La pagination utilise
la requête de page. Les listes de flux de travail, de problèmes, de demandes d'extraction et d'alertes commencent à 25
lignes ; Les tâches, les référentiels, les fournisseurs, les utilisateurs, les canaux et l'historique de livraison
commencent à 10. Les contrôles de filtre peuvent être désactivés pendant le chargement de leurs options. Effacez les
préréglages du tableau de bord ou modifiez les filtres pour revenir à votre propre requête. Ces contrôles modifient la
vue locale, jamais les enregistrements du fournisseur.
