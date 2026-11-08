---
title: 'Utilisateurs'
description:
  "Examinez les utilisateurs locaux et gérés par identité, les rôles, la suppression et l'administration des jetons MCP."
---

<a id="review-accounts"></a>

## Vérifier les comptes

Les administrateurs système ouvrent **Administration → Utilisateurs**. Le tableau indique le nom d'utilisateur,
l'avatar/nom d'affichage, le rôle, l'origine locale/OIDC et les horodatages créés/mis à jour. Filtrez par rôle, triez,
modifiez les colonnes ou paginer. L'accès au référentiel pour un visualiseur ou un gestionnaire nécessite un
[adhésion au référentiel](/docs/v2.0/repositories) distinct ; Les groupes de fournisseurs d’identité ne créent pas ces
adhésions.

<a id="provisioning-and-deletion"></a>

## Provisionnement et suppression

Dans Administration → Utilisateurs, choisissez Nouvel utilisateur. Saisissez un identifiant unique, les noms
facultatifs, un mot de passe de 12–256 caractères et sa confirmation, puis le rôle ; Viewer est la valeur initiale. La
création reste possible avec OIDC. Les identités OIDC proviennent de leur fournisseur et ne sont jamais liées par
correspondance avec un nom local.

L'action de suppression est disponible pour les autres utilisateurs et s'exécute immédiatement ; examinez le compte
avant de le sélectionner. Vous ne pouvez pas supprimer votre propre compte via cette API ou cet écran. La suppression
d'un utilisateur Repovio supprime l'accès local ; il ne supprime aucun compte de fournisseur sur GitHub, GitLab, Forgejo
ou Gitea. Vérifiez l’accès de l’utilisateur concerné avant de supprimer.

<a id="user-mcp-tokens"></a>

## Jetons utilisateur MCP

Ouvrez la boîte de dialogue de jeton MCP d'un utilisateur pour répertorier les métadonnées du jeton ou révoquer un jeton
avec confirmation. Les administrateurs ne peuvent pas récupérer les valeurs de jeton en texte brut ni créer le jeton
d'un autre utilisateur via cette boîte de dialogue. Les utilisateurs créent leurs propres jetons dans
[Paramètres MCP](/docs/v2.0/mcp). Les listes vides et les erreurs de chargement sont distinctes ; réessayez après la
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

<a id="create-and-reset-local-accounts"></a>

## Créer et réinitialiser les comptes locaux

L’action Réinitialiser le mot de passe permet à un administrateur de remplacer un mot de passe local sans connaître le
précédent. Confirmez le nouveau mot de passe. Les sessions JWT existantes deviennent invalides ; votre propre
réinitialisation vous déconnecte. Les comptes OIDC ne proposent pas cette action. Les jetons MCP sont conservés.

<a id="local-access-groups"></a>

## Groupes d’accès locaux

Ouvrez Administration → Groupes pour créer, renommer, supprimer et gérer les membres. Le nom doit être unique et non
vide. La sélection permet recherche et pagination ; plusieurs groupes par utilisateur sont autorisés, sans imbrication.
La suppression demande confirmation et retire membres et droits hérités, en conservant les attributions directes.

Dans Accès des groupes du dépôt, attribuez Viewer ou Manager, modifiez ou retirez le rôle. Les droits directs et hérités
se combinent ; Manager prévaut. La gestion nécessite toujours le rôle global Manager ; les administrateurs restent sans
restriction. Le retrait agit à la requête suivante sauf autre droit conservé. Les groupes locaux acceptent les comptes
locaux et OIDC, sans synchronisation des claims OIDC.

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
