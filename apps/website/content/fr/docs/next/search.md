---
title: 'Recherche globale'
description: 'Recherchez des destinations, des référentiels, des comptes de fournisseur et des exécutions de flux de travail.'
---

<a id="search-the-installation"></a>

## Rechercher l'installation

Ouvrez la recherche depuis la barre d'applications ou utilisez le raccourci clavier affiché. Saisissez au moins deux
caractères. Les résultats sont regroupés en destinations de navigation, référentiels, comptes de fournisseur et
exécutions de flux de travail. Les correspondances de navigation utilisent les étiquettes traduites des destinations
auxquelles votre compte peut accéder ; les résultats des ressources utilisent des noms de fournisseurs synchronisés.

Parcourez les résultats avec le clavier ou sélectionnez-en un avec le pointeur. Les correspondances entre le référentiel
et le compte fournisseur ouvrent la vue Repovio correspondante ; les correspondances de flux de travail ouvrent l'URL
d'exécution du fournisseur. Appuyez sur **Échap** pour fermer la recherche et revenir à la page précédente. La recherche
n’effectue pas de découverte côté fournisseur ni ne démarre la synchronisation.

<a id="access-and-failure-states"></a>

## États d'accès et d'échec

La recherche de ressources utilise les autorisations du référentiel de l'utilisateur actuel. Les résultats du compte
fournisseur sont limités aux administrateurs. Aucun résultat ne peut signifier une requête courte, aucun enregistrement
conservé correspondant ou une adhésion insuffisante. Essayez un nom plus spécifique et inspectez le référentiel/la tâche
si des données synchronisées sont manquantes. Le chargement est affiché pendant l'exécution d'une requête. En cas
d'erreur de requête, réessayez la requête une fois la connectivité API rétablie. La recherche ne révèle jamais les
jetons du fournisseur ni les informations d'identification de notification.
