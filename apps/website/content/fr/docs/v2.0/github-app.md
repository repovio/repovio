---
title: 'Configurer GitHub App'
description: 'Enregistrez et connectez votre GitHub App avec des identifiants chiffrés et un accès en lecture seule.'
---

<a id="register-app"></a>

## Enregistrer l’application

Utilisez une GitHub App par installation Repovio ; PAT et OAuth restent disponibles. En tant que propriétaire, ouvrez
Settings, Developer settings, GitHub Apps puis New GitHub App. Choisissez un nom unique et votre page Repovio.
Sélectionnez Any account pour plusieurs comptes ; une application privée ne peut être installée que sur son compte
propriétaire. Aucun secret client OAuth, URL de rappel ou URL de configuration supplémentaire n’est requis.

<a id="permissions-and-events"></a>

## Permissions et événements

Réglez les permissions de base ci-dessous sur Read-only ; Metadata est automatique. Ajoutez les permissions de sécurité
facultatives seulement si nécessaires et disponibles. Abonnez-vous aux événements indiqués ; GitHub transmet
automatiquement les événements d’installation. Repovio limite les jetons générés à la lecture, même si l’application
possède davantage de permissions.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Configurer Repovio

Activez les webhooks avec le point de terminaison HTTPS public ci-dessous. PUBLIC_URL doit désigner votre installation
accessible depuis l’extérieur. Générez un secret aléatoire d’au moins 16 caractères et saisissez la même valeur dans
GitHub et Repovio. Générez une clé RSA sur GitHub et téléchargez le fichier PEM. Dans Administration, Comptes
fournisseurs, GitHub App, saisissez ID, slug, clé complète et secret puis vérifiez et enregistrez. L’API valide
l’identité et chiffre les deux secrets dans PostgreSQL. Protégez la clé de chiffrement du déploiement ; les secrets
enregistrés ne sont jamais renvoyés au navigateur.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Installer et connecter

Installez l’application depuis GitHub, choisissez un compte ou une organisation et seulement les dépôts nécessaires.
Revenez, actualisez les installations et connectez le compte voulu. Les installations suspendues ou déjà connectées ne
peuvent pas être reconnectées. La liste provient de l’application configurée ; aucun ID de rappel n’est considéré comme
fiable. Ajoutez les dépôts depuis leur écran. Les jetons sont renouvelés automatiquement ; import initial et
interrogation périodique complètent les webhooks.

Modifiez le nom local avant la connexion s’il existe déjà un compte PAT ou OAuth portant ce nom.

<a id="rotate-and-disconnect"></a>

## Rotation et déconnexion

Générez une nouvelle clé GitHub, enregistrez-la et vérifiez la synchronisation avant de supprimer l’ancienne. Modifiez
le secret du webhook des deux côtés ensemble ; les anciennes signatures sont immédiatement refusées. Les champs vides
conservent les secrets. Supprimez les comptes connectés avant de remplacer l’identité ou supprimer la configuration ;
leurs données dépendantes sont également supprimées, exportez-les auparavant. La suppression locale ne désinstalle pas
l’application sur GitHub.

<a id="troubleshooting"></a>

## Dépannage

Vérifiez ID, slug et format PEM si la configuration échoue. Pour une signature incorrecte, contrôlez le secret, HTTPS et
la préservation du corps brut par le proxy. Si la liste est vide, vérifiez les dépôts et permissions puis actualisez.
Les installations supprimées ou suspendues conservent les données ; rétablissez l’accès et actualisez. Les permissions
de sécurité facultatives manquantes ne bloquent pas les autres domaines. Consultez Jobs. L’interrogation périodique
continue en cas d’échec des webhooks. Les tests simulés ne vérifient pas une installation réelle sur GitHub.

## Voir aussi

- [Comptes fournisseurs](/docs/v2.0/provider-accounts)
- [Configurer OAuth](/docs/v2.0/provider-oauth)
- [Webhooks fournisseurs](/docs/v2.0/provider-webhooks)
