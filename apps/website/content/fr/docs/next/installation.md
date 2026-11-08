---
title: 'Installer Repovio'
description: 'Installation et configuration avec comptes locaux, Authentik, Keycloak ou services OIDC existants.'
---

<a id="before-you-begin"></a>

## Installer Repovio

Choisissez les comptes locaux, Authentik, Keycloak ou un service OIDC existant. Les exemples suivants sont des
alternatives complètes pour une nouvelle installation ; ne combinez pas leurs services.

Docker Engine, Compose v2, DNS public et proxy inverse TLS sont requis. Utilisez deux noms HTTPS distincts pour Repovio
et le fournisseur d’identité auto-hébergé (Authentik ou Keycloak). Les images privées nécessitent un accès GHCR. Pour
une installation existante, suivez les guides de déploiement et de mise à niveau PostgreSQL correspondant à la version ;
ne réutilisez pas un ancien volume avec ces exemples.

<a id="shared-compose-configuration"></a>

## Configuration commune

Enregistrez le YAML choisi dans compose.yml et ces valeurs dans .env, dans un répertoire privé. Remplacez tous les
paramètres et utilisez la même version exacte de Repovio pour les deux images. Générez séparément le mot de passe et le
secret JWT avec la première commande, puis la clé de chiffrement avec la seconde. Les mots de passe hexadécimaux évitent
les erreurs URL.

```bash
openssl rand -hex 32
openssl rand -base64 32
```

```dotenv
REPOVIO_VERSION=REPLACE_WITH_EXACT_RELEASE_TAG
POSTGRES_PASSWORD=REPLACE_WITH_RANDOM_HEX_PASSWORD
AUTH_JWT_SECRET=REPLACE_WITH_RANDOM_HEX_SECRET
TOKEN_ENCRYPTION_KEY=REPLACE_WITH_BASE64_32_BYTE_KEY
```

<a id="docker-compose-without-oidc"></a>

## Sans OIDC

Cette pile utilise des comptes locaux. Terminez la configuration initiale pour créer le premier administrateur. Laissez
OIDC désactivé ; créez les autres comptes sous Administration → Utilisateurs.

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
volumes:
  repovio-postgres:
```

<a id="docker-compose-with-authentik"></a>

## Avec Authentik

Utilisez cette pile alternative complète, sans lancer les deux exemples ensemble. Ajoutez ces valeurs à .env et générez
un mot de passe et une clé secrète distincts. Cette version figée utilise son propre PostgreSQL, un serveur et un worker
; Redis et le socket Docker ne sont pas nécessaires pour OIDC.

```dotenv
AUTHENTIK_POSTGRES_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
AUTHENTIK_SECRET_KEY=REPLACE_WITH_RANDOM_HEX_SECRET
```

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
      OIDC_CALLBACK_URL: https://repovio.example.com/api/v1/auth/oidc/callback
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
  authentik-postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: authentik
      POSTGRES_USER: authentik
      POSTGRES_PASSWORD: ${AUTHENTIK_POSTGRES_PASSWORD:?Set AUTHENTIK_POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U authentik -d authentik']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - authentik-postgres:/var/lib/postgresql/data
  authentik-server:
    image: ghcr.io/goauthentik/server:2026.8.5
    command: server
    restart: unless-stopped
    shm_size: 512mb
    environment: &authentik-environment
      AUTHENTIK_POSTGRESQL__HOST: authentik-postgres
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_POSTGRES_PASSWORD:?Set AUTHENTIK_POSTGRES_PASSWORD}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY:?Set AUTHENTIK_SECRET_KEY}
    depends_on:
      authentik-postgres:
        condition: service_healthy
    ports:
      - '127.0.0.1:9000:9000'
    healthcheck:
      test: ['CMD', 'ak', 'healthcheck']
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 90s
    volumes:
      - authentik-data:/data
      - authentik-templates:/templates
  authentik-worker:
    image: ghcr.io/goauthentik/server:2026.8.5
    command: worker
    restart: unless-stopped
    shm_size: 512mb
    environment: *authentik-environment
    depends_on:
      authentik-postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'ak', 'healthcheck']
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 90s
    volumes:
      - authentik-data:/data
      - authentik-templates:/templates
volumes:
  repovio-postgres:
  authentik-postgres:
  authentik-data:
  authentik-templates:
```

<a id="docker-compose-with-keycloak"></a>

## Avec Keycloak

Utilisez cette pile complète séparément. Ajoutez les valeurs ci-dessous à .env et générez des mots de passe distincts
pour PostgreSQL et le compte bootstrap. Keycloak utilise sa propre base PostgreSQL 17 et son volume, jamais ceux de
Repovio ni un ancien volume PostgreSQL. L’image fixe Keycloak 26.8.2 avec start en production, pas start-dev.

```dotenv
KEYCLOAK_POSTGRES_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
KEYCLOAK_ADMIN_USERNAME=bootstrap-admin
KEYCLOAK_ADMIN_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
```

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
      OIDC_CALLBACK_URL: https://repovio.example.com/api/v1/auth/oidc/callback
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
  keycloak-postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KEYCLOAK_POSTGRES_PASSWORD:?Set KEYCLOAK_POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U keycloak -d keycloak']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - keycloak-postgres:/var/lib/postgresql/data
  keycloak:
    image: quay.io/keycloak/keycloak:26.8.2
    command: ['start']
    restart: unless-stopped
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KEYCLOAK_POSTGRES_PASSWORD:?Set KEYCLOAK_POSTGRES_PASSWORD}
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN_USERNAME:?Set KEYCLOAK_ADMIN_USERNAME}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Set KEYCLOAK_ADMIN_PASSWORD}
      KC_HOSTNAME: https://auth.example.com
      KC_HTTP_ENABLED: 'true'
      KC_PROXY_HEADERS: xforwarded
      KC_HEALTH_ENABLED: 'true'
    depends_on:
      keycloak-postgres:
        condition: service_healthy
    ports:
      - '127.0.0.1:8080:8080'
    healthcheck:
      test:
        - CMD
        - /bin/bash
        - -ec
        - >-
          exec 3<>/dev/tcp/127.0.0.1/9000; printf 'GET /health/ready HTTP/1.0\r\n\r\n' >&3; IFS= read -r status <&3; [[
          "$$status" == *' 200 '* ]]
      interval: 15s
      timeout: 5s
      retries: 20
      start_period: 120s
volumes:
  repovio-postgres:
  keycloak-postgres:
```

Dans l’exemple Caddy existant, remplacez la destination auth.example.com 127.0.0.1:9000 par 127.0.0.1:8080. Définissez
KC_HOSTNAME avec l’URL HTTPS publique. Caddy doit remplacer les en-têtes X-Forwarded ; seul le proxy de confiance accède
au listener HTTP. Ne publiez pas le port interne 9000 de readiness. Laissez Allow HTTP issuer désactivé : seul le lien
proxy–Keycloak utilise HTTP.

Connectez-vous à la console avec le compte bootstrap. Créez et vérifiez un administrateur permanent dans le realm
master, supprimez le compte temporaire puis retirez les deux entrées KC_BOOTSTRAP_ADMIN de Compose et leurs valeurs de
.env. Suivez le guide Keycloak pour le realm repovio, le client, les groupes et les associations. Après redémarrage,
vérifiez discovery et les quatre cas d’accès.

Références: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## Utiliser un fournisseur existant

Utilisez la pile Compose des comptes locaux avec votre service Keycloak, Entra ID, Auth0 ou Authentik existant. Ajoutez
OIDC_CALLBACK_URL avec le callback public exact dans l’environnement API partagé. Créez l’administrateur local puis
suivez le guide du fournisseur. Configurez issuer et secrets dans Repovio, sans inventer de variables d’environnement.

Références: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## Proxy et démarrage

Remplacez les noms de domaine dans le YAML, les variables et le proxy. Le proxy tourne sur le serveur Docker ; les deux
noms nécessitent des certificats TLS valides. Pour un proxy conteneurisé, utilisez un réseau Docker partagé plutôt que
sa propre boucle locale. Gardez les ports des bases privés.

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
auth.example.com {
  reverse_proxy 127.0.0.1:9000
}
```

<a id="configure-authentik-oidc"></a>

## Configurer OIDC

Ouvrez Authentik et initialisez akadmin. Créez une application et un fournisseur OAuth2/OpenID avec slug repovio, client
confidentiel, flux par code, clé de signature, émetteur par fournisseur et URI de redirection stricte ci-dessous.
Incluez openid, profile et email ; profile doit renvoyer les noms de groupes dans groups.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

Connectez-vous à Repovio avec le compte administrateur local. Dans Paramètres → Authentification, saisissez émetteur,
identifiant et secret client ; choisissez groups et les scopes openid profile email. Créez repovio-admins,
repovio-managers et repovio-viewers dans Authentik et associez les rôles. Testez, activez OIDC puis vérifiez un compte
non administrateur et un compte sans rôle. Les paramètres résident dans Repovio, pas dans des variables OIDC inventées.
La connexion locale reste disponible pour récupération.

Les groupes OIDC définissent uniquement les rôles globaux. Les groupes locaux et les attributions directes accordent
séparément les accès aux dépôts ; un gestionnaire doit aussi avoir une attribution Manager. Aucune synchronisation de
groupes OIDC.

<a id="verify-compose-installation"></a>

## Vérification et mises à niveau

Validez sans afficher de secrets, puis démarrez. Vérifiez migrations, santé API et accès web, ainsi que la santé
Authentik et la connexion OIDC pour le second exemple. Protégez .env et sauvegardez les deux bases et les volumes
Authentik. Gardez les noms des volumes existants. Une ancienne version ignore les droits de groupe : un retour arrière
peut supprimer les accès hérités mais conserve les attributions directes.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Sauvegarde et restauration de Keycloak

Exécutez aussi les commandes communes de validation et de démarrage. Après redémarrage de Keycloak et PostgreSQL,
vérifiez readiness, discovery HTTPS et une nouvelle connexion S256 PKCE ; utilisateurs et realm doivent persister.

Sauvegardez séparément les deux bases, Compose, .env protégé et TOKEN_ENCRYPTION_KEY. Pour Keycloak, utilisez un dump
PostgreSQL cohérent ; un export de realm ne suffit pas. Restaurez dans une installation séparée aux mêmes versions
Keycloak et PostgreSQL avant de tester les mises à niveau. Arrêtez Keycloak pendant la restauration et vérifiez
utilisateurs, secrets, associations et rôles avant de basculer le trafic. N’écrasez jamais l’unique volume fonctionnel.

<a id="recommended-first-session"></a>

## Guides complémentaires

[Guides complémentaires](/docs/next/setup) · [Connectez-vous](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Guides complémentaires: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Guides complémentaires](/docs/next/repositories)
