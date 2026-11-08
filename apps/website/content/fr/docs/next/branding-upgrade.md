---
title: 'Mise à niveau de la marque Repovio'
description: "Conservez les données et les informations d'identification de la base de données lors du passage au nom Repovio."
---

Ce changement de nom constitue un changement de configuration radical. Mettez à jour toutes les anciennes variables
d'environnement préfixées par le produit avec le préfixe `REPOVIO_`, notamment `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`,
`REPOVIO_API_PORT` et `REPOVIO_WEB_PORT`. Utilisez l'API et les images Web sous `ghcr.io/repovio/repovio-api` et
`ghcr.io/repovio/repovio-web`.

Terminez d’abord le changement de marque sur la version précédente avec PostgreSQL 17. La configuration Compose actuelle
vise PostgreSQL 18 ; suivez la [mise à niveau PostgreSQL 18 distincte](/docs/next/postgresql-18-upgrade) avant de
l’utiliser. Ne montez jamais les fichiers PostgreSQL 17 dans le service PostgreSQL 18. Les étapes ci-dessous utilisent
la configuration PostgreSQL 17 conservée, y compris `compose.yml` et `compose.upgrade.yml`. Le changement de marque seul
ne convertit pas les données ; le changement de version majeure est une opération distincte.

## Préserver les données PostgreSQL

1. Sauvegardez la base de données existante et confirmez que la sauvegarde peut être restaurée avant de modifier le
   déploiement.
2. Inspectez le conteneur PostgreSQL en cours d'exécution avec `docker inspect <postgres-container>` et enregistrez le
   volume nommé exact monté sur `/var/lib/postgresql/data`. Arrêtez l'ancienne application et les conteneurs PostgreSQL
   sans supprimer de volumes.
3. Définissez `REPOVIO_POSTGRES_VOLUME` dans le nouvel environnement de déploiement sur ce nom de volume exact.
   Confirmez son existence à l'aide de `docker volume inspect <recorded-volume>`. La valeur par défaut de la nouvelle
   installation est `repovio-postgres` ; il ne doit pas remplacer accidentellement le volume d'une installation
   existante.
4. Conserver `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` et `AUTH_JWT_SECRET` inchangés.
   Conservez PostgreSQL sur la même version majeure. Examinez `docker compose config` en privé avant de commencer ; sa
   sortie contient des secrets résolus et ne doit jamais être partagée ou validée.
5. Utilisez `docker compose -f compose.yml -f compose.upgrade.yml` pour la mise à niveau. Ce remplacement nécessite que
   le volume nommé existe, donc un volume mal orthographié ne peut pas initialiser silencieusement un remplacement vide.
   Démarrez d'abord PostgreSQL et vérifiez la base de données existante, puis démarrez le service de migration et
   l'application. N'exécutez jamais `docker compose down --volumes`, supprimez l'ancien volume ou initialisez une base
   de données vierge dans le cadre de ce changement de nom.

Aucune conversion de données n’est requise par la stratégie de marque. Les identifiants de la base de données et la clé
de chiffrement restent essentiels pour lire les données existantes. Un déploiement précédent peut être restauré à l'aide
de sa configuration et du volume conservé ; évitez les écrivains simultanés.

## Authentification et état du navigateur

L'émetteur JWT par défaut est désormais `repovio` ; reconnectez-vous après la mise à niveau. Un émetteur explicitement
configuré doit également être mis à jour délibérément. Les préférences du navigateur existantes, l'état de notification,
les cookies et les clés de stockage ne sont pas importés. Sélectionnez à nouveau votre langue/thème, réinstallez la PWA
si nécessaire et réactivez les notifications du navigateur. Mettre à jour les noms d'affichage des fournisseurs
d'identité et la configuration des applications externes, le cas échéant ; les itinéraires de rappel ne changent pas.
Effacez les données de site obsolètes uniquement après avoir confirmé les nouveaux travaux d'installation.

Révoquez les jetons MCP précédents et créez des remplacements : le préfixe du jeton renommé n'est intentionnellement pas
accepté comme alias.
