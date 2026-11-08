---
title: 'Déploiement de Repovio'
description:
  'Déploiement en production, proxy TLS, sauvegarde, restauration, mise à niveau et restauration pour Repovio.'
---

La pile Compose de Repovio démarre PostgreSQL, applique les migrations Prisma une fois, puis démarre l'API et les
applications Web. Il ne met pas fin à TLS. Placez les services Web et API derrière un proxy inverse qui possède le nom
d'hôte public et les certificats.

<a id="prerequisites"></a>

## Prérequis

- Moteur Docker avec Docker Compose v2.
- Un enregistrement DNS pour le nom d'hôte public.
- Un proxy inverse qui obtient et renouvelle les certificats TLS.
- Un répertoire de serveur privé lisible uniquement par les administrateurs de déploiement.

La pile Compose conserve les données PostgreSQL, y compris les images de profil utilisateur normalisées, dans son volume
nommé `repovio-postgres`. Ne supprimez pas ce volume, sauf si vous souhaitez intentionnellement supprimer toutes les
données Repovio.

<a id="first-deployment"></a>

## Premier déploiement

### Étape 1 : Récupérez une version publiée de Repovio et créez le fichier d'environnement privé :

```bash
cp .env.example .env
chmod 600 .env
```

### Étape 2 : Remplacez chaque espace réservé dans `.env`, en particulier `POSTGRES_PASSWORD`, les deux URL de base de données, `AUTH_JWT_SECRET` et

`TOKEN_ENCRYPTION_KEY`. Générez la clé de chiffrement avec :

```bash
openssl rand -base64 32
```

### Étape 3 : Définissez les URL visibles en externe. Pour un déploiement sur `https://repovio.example.com`, utilisez :

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Étape 4 : Liez les ports du conteneur au bouclage lorsque le proxy inverse s'exécute sur le même hôte :

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

Sinon, limitez l'accès aux ports 3000 et 3001 avec le pare-feu hôte. N’exposez jamais le conteneur PostgreSQL.

### Étape 5 : Définissez `REPOVIO_VERSION` dans `.env` sur une paire d'images publiées exactes, puis démarrez la pile :

```bash
docker compose pull
docker compose up --detach --wait
```

Conservez cette valeur dans `.env` afin que chaque commande Compose ultérieure utilise la même API et la même version
Web.

### Étape 6 : Confirmez localement le point de terminaison d'intégrité de l'API :

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Étape 7 : Ouvrez l'URL publique Repovio et complétez le [configuration unique pour la première exécution](/docs/v2.0/authentication) pour créer le premier

administrateur système.

<a id="reverse-proxy-and-tls"></a>

## Proxy inverse et TLS

Proxyez l'origine Web publique vers le port 3000 et les chemins API et Socket.IO vers le port 3001. Par exemple, un bloc
de site Caddy peut utiliser :

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

Le proxy doit rediriger HTTP vers HTTPS, valider les connexions en amont conformément à sa politique locale et conserver
le nom d'hôte public. Configurez les fournisseurs OAuth avec la même URL de rappel HTTPS définie dans
`OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## Mise à niveau

<a id="migrating-an-earlier-installation"></a>

### Migration d'une installation antérieure

Suivez le [mise à niveau de l'image de marque](/docs/v2.0/branding-upgrade) avant de démarrer la pile renommée.
Définissez `REPOVIO_POSTGRES_VOLUME` sur le nom exact du volume existant. Conserver les informations d'identification de
la base de données et la clé de cryptage ; aucune copie ou réinitialisation de la base de données n'est requise pour la
personnalisation.

### Étape 1 : Créez et vérifiez une sauvegarde de base de données avant de modifier les images.

### Étape 2 : Définissez `REPOVIO_VERSION` sur la version exacte dans `.env`.

### Étape 3 : Tirez et appliquez le déclencheur :

```bash
docker compose pull
docker compose up --detach --wait
```

Le service `migrate` applique les migrations Prisma en attente avant le démarrage de l'API. Inspectez-le après chaque
mise à jour :

```bash
docker compose logs migrate
```

### Étape 4 : Vérifiez le point de terminaison d'intégrité et le tableau de bord servi par proxy avant de considérer la mise à jour terminée.

<a id="database-backup"></a>

## Sauvegarde de la base de données

Exécutez des sauvegardes à partir du répertoire de déploiement. Cela écrit un dump au format personnalisé PostgreSQL sur
l'hôte sans imprimer les informations d'identification ni les placer dans la ligne de commande :

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Stockez les copies chiffrées hors hôte et testez périodiquement les restaurations sur un système distinct.

<a id="database-restore"></a>

## Restauration de la base de données

La restauration remplace les objets de base de données actuels. Effectuez d’abord une nouvelle sauvegarde et planifiez
les temps d’arrêt.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Ensuite, vérifiez `docker compose logs migrate` et le point de terminaison d’intégrité de l’API. Restaurez un vidage
effectué par une version compatible de Repovio lors de la restauration des modifications de schéma.

<a id="rollback"></a>

## Restauration

### Étape 1 : Conservez la sauvegarde effectuée immédiatement avant l'échec de la mise à niveau.

### Étape 2 : Définissez `REPOVIO_VERSION` dans `.env` sur la dernière version d'image connue.

### Étape 3 : Exécutez `docker compose pull` et `docker compose up --detach --wait`.

### Étape 4 : Si la version la plus récente a migré la base de données de manière incompatible, arrêtez l'API et le Web, restaurez la sauvegarde compatible, puis

redémarrez la version précédente de l’image.

N'utilisez jamais `docker compose down --volumes` comme commande de mise à jour ou de restauration : cela supprime le
volume PostgreSQL nommé.
