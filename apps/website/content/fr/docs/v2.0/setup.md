---
title: 'Configuration de première exécution'
description: 'Créez le premier administrateur local et comprenez la configuration unique.'
---

<a id="before-setup"></a>

## Avant la configuration

Déployez l'API, l'application Web et PostgreSQL à l'aide de [Déploiement](/docs/v2.0/deployment). Ouvrez l'URL
d'installation. Lorsqu'aucun utilisateur n'existe, Repovio dirige le navigateur vers `/auth/setup`. Les installations
existantes conservent leurs comptes et ouvrent à la place la connexion. Le programme d'installation crée un compte
Repovio local, et non un compte de fournisseur.

<a id="create-the-administrator"></a>

## Créer l'administrateur

Entrez un prénom et un nom facultatifs, un nom d'utilisateur unique, un mot de passe et une confirmation du mot de
passe. Les mots de passe nécessitent au moins 12 caractères. Soumettez le formulaire de configuration une fois et
attendez la demande ; la configuration réussie signe chez le premier administrateur système. Les erreurs de validation
laissent le formulaire disponible pour correction. Si un autre opérateur a terminé la configuration en premier, passez à
[Se connecter](/docs/v2.0/sign-in) avec un compte existant.

<a id="continue-configuration"></a>

## Continuer la configuration

Connectez un [compte fournisseur](/docs/v2.0/provider-accounts), sélectionnez [référentiels](/docs/v2.0/repositories) et
inspectez le [tâches de synchronisation](/docs/v2.0/guide-jobs). Les utilisateurs locaux peuvent être créés via l'API
protégée ; la page Utilisateurs répertorie les comptes et gère la suppression et l'accès MCP. Vous pouvez également
configurer [OIDC](/docs/v2.0/authentication) pour les comptes gérés par le fournisseur d'identité. Les nouveaux
non-administrateurs ont besoin d’une adhésion explicite au référentiel.

Si l'installation échoue, vérifiez la disponibilité de l'API/de la base de données et les journaux de déploiement sans
publier les informations d'identification. Ne réinitialisez pas la base de données pour répéter l'installation. Voir
[Récupération de mot de passe](/docs/v2.0/authentication#reset-a-forgotten-password) pour un administrateur local
existant.

<a id="local-user-and-group-management"></a>

## Créer et réinitialiser les comptes locaux

Dans Administration → Utilisateurs, choisissez Nouvel utilisateur. Saisissez un identifiant unique, les noms
facultatifs, un mot de passe de 12–256 caractères et sa confirmation, puis le rôle ; Viewer est la valeur initiale. La
création reste possible avec OIDC. Les identités OIDC proviennent de leur fournisseur et ne sont jamais liées par
correspondance avec un nom local.

[Groupes d’accès locaux](/docs/v2.0/users#local-access-groups)
