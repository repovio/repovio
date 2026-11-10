---
title: 'Paramètres'
description: "Recherchez les paramètres personnels, l'authentification et les contrôles système réservés aux administrateurs."
---

<a id="settings-tabs"></a>

## Onglets Paramètres

Ouvrez **Paramètres** dans le menu utilisateur. Chaque utilisateur authentifié peut accéder à**Général** et**MCP**. Les
administrateurs système voient également**Authentification** et**Système**. Le groupe d'administrateurs de la barre
latérale n'empêche pas les autres utilisateurs connectés d'ouvrir leurs paramètres personnels via le menu utilisateur.

Général contient [Profil](/docs/next/profile), [Avatar](/docs/next/avatar) et, pour les comptes locaux,
[Mot de passe](/docs/next/password). Les utilisateurs gérés par OIDC voient un avis de gestion d'identité au lieu des
formulaires de profil/mot de passe locaux, mais peuvent toujours modifier leur avatar. [MCP](/docs/next/mcp) gère les
jetons d'accès personnels en lecture seule.

<a id="related-preferences"></a>

## Préférences associées

[Langue](/docs/next/language) et [Apparence](/docs/next/appearance) sont sélectionnés à partir des contrôles
application/utilisateur. Les administrateurs configurent [Authentification OIDC](/docs/next/authentication) et
[Paramètres par défaut du système](/docs/next/settings-system) dans leurs onglets respectifs. Un onglet manquant peut
être correct pour votre rôle ; changer une URL n’accorde pas d’autorisation. Réessayez les demandes de paramètres ayant
échoué uniquement après avoir vérifié la connectivité de l'API.

<a id="repository-settings"></a>

## Paramètres du dépôt

La configuration du dépôt est distincte des paramètres personnels. Les administrateurs y trouvent Général, Webhook, Filtres de flux, Membres et Accès des groupes. Pour les adresses directes et la durée des brouillons, consultez
[Sections des paramètres du dépôt](/docs/next/repositories#repository-settings-sections).
