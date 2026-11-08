---
title: 'Deploying Repovio'
description: 'Production deployment, TLS proxy, backup, restore, upgrade, and rollback guidance for Repovio.'
---

Repovio's Compose stack starts PostgreSQL, applies Prisma migrations once, and then starts the API and web applications.
It does not terminate TLS. Put the web and API services behind a reverse proxy that owns the public hostname and
certificates.

<a id="prerequisites"></a>

## Prerequisites

- Docker Engine with Docker Compose v2.
- A DNS record for the public hostname.
- A reverse proxy that obtains and renews TLS certificates.
- A private server directory readable only by deployment administrators.

The Compose stack persists PostgreSQL data, including normalized user profile pictures, in its named `repovio-postgres`
volume. Do not delete this volume unless you intentionally want to remove all Repovio data.

<a id="first-deployment"></a>

## First deployment

### Step 1: Check out a released Repovio version and create the private environment file:

```bash
cp .env.example .env
chmod 600 .env
```

### Step 2: Replace every placeholder in `.env`, especially `POSTGRES_PASSWORD`, both database URLs, `AUTH_JWT_SECRET`, and

`TOKEN_ENCRYPTION_KEY`. Generate the encryption key with:

```bash
openssl rand -base64 32
```

### Step 3: Set the externally visible URLs. For a deployment at `https://repovio.example.com`, use:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Step 4: Bind the container ports to loopback when the reverse proxy runs on the same host:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

Otherwise, restrict access to ports 3000 and 3001 with the host firewall. Never expose the PostgreSQL container.

### Step 5: Set `REPOVIO_VERSION` in `.env` to an exact released image pair, then start the stack:

```bash
docker compose pull
docker compose up --detach --wait
```

Keep that value in `.env` so every later Compose command uses the same API and web version.

### Step 6: Confirm the API health endpoint locally:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Step 7: Open the public Repovio URL and complete the [one-time first-run setup](/docs/v2.0/authentication) to create the first

system administrator.

<a id="reverse-proxy-and-tls"></a>

## Reverse proxy and TLS

Proxy the public web origin to port 3000, and the API and Socket.IO paths to port 3001. For example, a Caddy site block
can use:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

The proxy must redirect HTTP to HTTPS, validate upstream connections according to its local policy, and preserve the
public hostname. Configure OAuth providers with the same HTTPS callback URL set in `OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## Upgrading

<a id="migrating-an-earlier-installation"></a>

### Migrating an earlier installation

Follow the [branding upgrade](/docs/v2.0/branding-upgrade) before starting the renamed stack. Set
`REPOVIO_POSTGRES_VOLUME` to the exact existing volume name. Preserve database credentials and the encryption key; no
database copy or reset is required for branding.

### Step 1: Create and verify a database backup before changing images.

### Step 2: Set `REPOVIO_VERSION` to the exact release version in `.env`.

### Step 3: Pull and apply the release:

```bash
docker compose pull
docker compose up --detach --wait
```

The `migrate` service applies pending Prisma migrations before the API starts. Inspect it after every update:

```bash
docker compose logs migrate
```

### Step 4: Verify the health endpoint and the proxy-served dashboard before considering the update complete.

<a id="database-backup"></a>

## Database backup

Run backups from the deployment directory. This writes a PostgreSQL custom-format dump to the host without printing
credentials or putting them in the command line:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Store encrypted copies off-host and periodically test restores on a separate system.

<a id="database-restore"></a>

## Database restore

Restoring replaces current database objects. Take a new backup first and schedule downtime.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Afterward, check `docker compose logs migrate` and the API health endpoint. Restore a dump made by a compatible Repovio
version when rolling back across schema changes.

<a id="rollback"></a>

## Rollback

### Step 1: Keep the backup made immediately before the failed upgrade.

### Step 2: Set `REPOVIO_VERSION` in `.env` to the last known-good image version.

### Step 3: Run `docker compose pull` and `docker compose up --detach --wait`.

### Step 4: If the newer release migrated the database incompatibly, stop API and web, restore the compatible backup, and then

start the previous image version again.

Never use `docker compose down --volumes` as an update or rollback command: it removes the named PostgreSQL volume.
