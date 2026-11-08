---
title: 'Paramètres'
description:
  "Recherchez les paramètres personnels, l'authentification et les contrôles système réservés aux administrateurs."
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="settings-tabs"></a>

## Onglets Paramètres

Ouvrez **Paramètres** dans le menu utilisateur. Chaque utilisateur authentifié peut accéder à**Général** et**MCP**. Les
administrateurs système voient également**Authentification** et**Système**. Le groupe d'administrateurs de la barre
latérale n'empêche pas les autres utilisateurs connectés d'ouvrir leurs paramètres personnels via le menu utilisateur.

Général contient [Profil](/docs/v1.0/profile), [Avatar](/docs/v1.0/avatar) et, pour les comptes locaux,
[Mot de passe](/docs/v1.0/password). Les utilisateurs gérés par OIDC voient un avis de gestion d'identité au lieu des
formulaires de profil/mot de passe locaux, mais peuvent toujours modifier leur avatar. [MCP](/docs/v1.0/mcp) gère les
jetons d'accès personnels en lecture seule.

<a id="related-preferences"></a>

## Préférences associées

[Langue](/docs/v1.0/language) et [Apparence](/docs/v1.0/appearance) sont sélectionnés à partir des contrôles
application/utilisateur. Les administrateurs configurent [Authentification OIDC](/docs/v1.0/authentication) et
[Paramètres par défaut du système](/docs/v1.0/settings-system) dans leurs onglets respectifs. Un onglet manquant peut
être correct pour votre rôle ; changer une URL n’accorde pas d’autorisation. Réessayez les demandes de paramètres ayant
échoué uniquement après avoir vérifié la connectivité de l'API.
