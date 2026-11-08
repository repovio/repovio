---
title: 'Configuration du fournisseur OAuth'
description:
  "Enregistrez les applications OAuth et configurez l'authentification du fournisseur en lecture seule pour Repovio."
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

Repovio connecte les comptes du fournisseur via OAuth ou un jeton d'accès personnel (PAT). OAuth est disponible
lorsqu’au moins un client fournisseur OAuth est configuré. Sans aucun client OAuth configuré, l'écran du compte du
fournisseur propose uniquement l'authentification PAT. Repovio utilise les informations d'identification résultantes
uniquement pour ses API de fournisseur en lecture seule et les chiffre avant de les écrire dans PostgreSQL.

<a id="register-oauth-applications"></a>

## Enregistrez les applications OAuth

Enregistrez une application OAuth pour chaque instance de fournisseur à laquelle Repovio doit se connecter. Définissez
l'URL de rappel exacte à partir de `OAUTH_CALLBACK_URL` dans chaque enregistrement d'application. Pour une installation
locale, la valeur par défaut est `http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Configurez l'ID client et le secret client dans l'environnement API, jamais dans l'application Web ou Git :

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

Configurez uniquement les fournisseurs dont cette installation a besoin. Les ID client et les secrets doivent toujours
être configurés par paires. `GITLAB_OAUTH_BASE_URL` identifie l'instance unique GitLab pour l'application OAuth
installée. Forgejo a besoin d'une URL de base explicite lorsque son client OAuth est configuré.

<a id="read-scopes"></a>

## Lire les étendues

Utilisez ces étendues lors de l’enregistrement de l’application :

- GitHub : `repo security_events`. Les comptes OAuth existants doivent être réautorisés avant que Repovio puisse lire
  les alertes de sécurité.
- GitLab : `read_api read_user`.

Les jetons d'accès personnels GitHub à granularité fine nécessitent un accès en lecture aux alertes Dependabot, aux
alertes d'analyse de code et aux alertes d'analyse secrète. L'accès aux alertes de sécurité GitLab dépend en outre de la
licence de l'instance et du rôle du propriétaire du jeton dans le projet ; les types d'alertes indisponibles sont
affichés sans faire échouer les autres étendues de synchronisation du référentiel.

- Forgejo : `read:repository`.
- Gitea : configurez un jeton d'accès personnel avec accès en lecture dans le formulaire de compte fournisseur Gitea, y
  compris l'URL de base de l'instance. Repovio ne propose actuellement pas de client Gitea OAuth partagé, car chaque
  instance auto-hébergée nécessite son propre enregistrement d'application.

Les adaptateurs de Repovio exposent uniquement la validation, la découverte, la synchronisation des flux de travail et
la vérification des webhooks. Ils ne créent pas, ne mettent pas à jour, ne répartissent pas, ne réexécutent pas,
n'annulent pas ou ne suppriment pas les ressources du fournisseur. Les secrets client OAuth restent dans l'environnement
API et les jetons du fournisseur ne sont jamais renvoyés par l'API Repovio.
