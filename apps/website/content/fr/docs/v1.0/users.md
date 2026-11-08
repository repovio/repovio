---
title: 'Utilisateurs'
description:
  "Examinez les utilisateurs locaux et gérés par identité, les rôles, la suppression et l'administration des jetons MCP."
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="review-accounts"></a>

## Vérifier les comptes

Les administrateurs système ouvrent **Administration → Utilisateurs**. Le tableau indique le nom d'utilisateur,
l'avatar/nom d'affichage, le rôle, l'origine locale/OIDC et les horodatages créés/mis à jour. Filtrez par rôle, triez,
modifiez les colonnes ou paginer. L'accès au référentiel pour un visualiseur ou un gestionnaire nécessite un
[adhésion au référentiel](/docs/v1.0/repositories) distinct ; Les groupes de fournisseurs d’identité ne créent pas ces
adhésions.

<a id="provisioning-and-deletion"></a>

## Provisionnement et suppression

La page Utilisateurs n'a pas de formulaire de création d'utilisateur ou de modification d'utilisateur. Des utilisateurs
locaux supplémentaires sont créés via l'API utilisateur protégée uniquement par l'administrateur à l'aide d'un nom
d'utilisateur, d'un mot de passe et d'un rôle. Les utilisateurs OIDC sont provisionnés via une connexion d'identité
configurée. Voir [Authentification](/docs/v1.0/authentication) pour le mappage et la séparation des comptes. Ne déduisez
pas une action de modification par l'utilisateur de la présence d'un profil modifiable sur votre propre page Paramètres.

L'action de suppression est disponible pour les autres utilisateurs et s'exécute immédiatement ; examinez le compte
avant de le sélectionner. Vous ne pouvez pas supprimer votre propre compte via cette API ou cet écran. La suppression
d'un utilisateur Repovio supprime l'accès local ; il ne supprime aucun compte de fournisseur sur GitHub, GitLab, Forgejo
ou Gitea. Vérifiez l’accès de l’utilisateur concerné avant de supprimer.

<a id="user-mcp-tokens"></a>

## Jetons utilisateur MCP

Ouvrez la boîte de dialogue de jeton MCP d'un utilisateur pour répertorier les métadonnées du jeton ou révoquer un jeton
avec confirmation. Les administrateurs ne peuvent pas récupérer les valeurs de jeton en texte brut ni créer le jeton
d'un autre utilisateur via cette boîte de dialogue. Les utilisateurs créent leurs propres jetons dans
[Paramètres MCP](/docs/v1.0/mcp). Les listes vides et les erreurs de chargement sont distinctes ; réessayez après la
récupération de l'API. Ne copiez jamais les valeurs des jetons dans les rapports d'assistance ou les captures d'écran.

<a id="local-user-api"></a>

## Provisionner un utilisateur local via l'API

Utilisez un client API via HTTPS pour envoyer `POST /api/v1/users` avec l'authentification du porteur administrateur et
`Content-Type: application/json`. Fournissez ce corps de requête, en remplaçant les espaces réservés dans les entrées
protégées du client :

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Les rôles valides sont `VIEWER`, `MANAGER` et `SYSTEM_ADMIN`. Attribuez uniquement le rôle requis, puis accordez les
adhésions au référentiel séparément. La réponse contient des métadonnées utilisateur sécurisées, pas le mot de passe ou
son hachage. Un nom d'utilisateur en double ou une demande invalide doit être corrigé avant de réessayer. Ne stockez pas
les mots de passe ou les jetons du porteur dans les fichiers suivis, l'historique du shell, les captures d'écran ou les
rapports de problèmes.
