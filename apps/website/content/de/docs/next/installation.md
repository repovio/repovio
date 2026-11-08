---
title: 'Repovio installieren'
description: 'Docker-Compose-Beispiele mit lokalen Konten oder vollständigem Authentik-OIDC-Stack.'
---

<a id="before-you-begin"></a>

## Repovio installieren

Ein Beispiel für eine Neuinstallation auswählen. Erforderlich sind Docker Engine, Compose v2, öffentliches DNS und ein
TLS-Reverse-Proxy. Für Repovio und Authentik getrennte HTTPS-Hostnamen verwenden. Private Anwendungsimages benötigen
GHCR-Zugriff. Bestehende Installationen verwenden die zur Version passende Deployment- und PostgreSQL-Upgrade-Anleitung;
ältere PostgreSQL-Volumes nicht mit diesen Neuinstallationsbeispielen verwenden.

<a id="shared-compose-configuration"></a>

## Gemeinsame Konfiguration

Das gewählte YAML als compose.yml und folgende Werte als .env in einem privaten Verzeichnis speichern. Alle Platzhalter
ersetzen. Für beide Repovio-Images denselben exakten Release-Tag auswählen. Datenbankpasswort und JWT-Schlüssel jeweils
separat mit dem ersten Befehl erzeugen, den Verschlüsselungsschlüssel mit dem zweiten. Hexadezimale Datenbankpasswörter
vermeiden URL-Kodierungsfehler.

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

## Ohne OIDC

Dieser Stack verwendet lokale Konten. In Repovio die Ersteinrichtung abschließen und die erste Systemadministration
anlegen. OIDC deaktiviert lassen; weitere Konten unter Administration → Benutzer erstellen.

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

## Mit Authentik

Diesen vollständigen alternativen Stack verwenden, nicht beide Beispiele gleichzeitig. Folgende Authentik-Werte an .env
anhängen; ein eigenes Datenbankpasswort und einen eigenen geheimen Schlüssel erzeugen. Die festgelegte Authentik-Version
verwendet eine eigene PostgreSQL-Datenbank, Server und Worker; Redis und Docker-Socket werden für dieses OIDC-Beispiel
nicht benötigt.

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

<a id="compose-proxy-and-startup"></a>

## Proxy und Start

Beispielhostnamen im gesamten YAML, in Umgebungswerten und Proxy-Konfiguration ersetzen. Der Proxy läuft auf dem
Docker-Host; beide Namen benötigen gültige TLS-Zertifikate. Bei einem Proxy im Container über ein gemeinsames
Docker-Netzwerk statt dessen eigene Loopback-Adresse routen. Datenbankports privat halten.

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

## OIDC konfigurieren

Den Authentik-Hostnamen öffnen und die Ersteinrichtung für akadmin abschließen. Eine OAuth2/OpenID-Anwendung samt
Provider mit Slug repovio, vertraulichem Client, Authorization-Code-Flow, Signaturschlüssel, providerspezifischem Issuer
und exakt folgender strikter Redirect-URI erstellen. Scope-Mappings für openid, profile und email aufnehmen; das
Profil-Mapping muss Gruppennamen im Claim groups liefern.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

Zuerst mit der lokalen Systemadministration bei Repovio anmelden. Unter Einstellungen → Authentifizierung Issuer,
Client-ID und Client-Secret eintragen; groups als Gruppen-Claim und openid profile email als Scopes wählen. In Authentik
Gruppen repovio-admins, repovio-managers und repovio-viewers erstellen und den entsprechenden Repovio-Rollen zuordnen.
Konfiguration testen, OIDC aktivieren und danach eine Anmeldung ohne Administrationsrechte sowie ein nicht zugeordnetes
Konto prüfen. Provider-Einstellungen werden in Repovio gespeichert, nicht über erfundene OIDC-Umgebungsvariablen. Die
lokale Anmeldung bleibt zur Wiederherstellung verfügbar.

OIDC-Gruppen bestimmen ausschließlich globale Rollen. Lokale Zugriffsgruppen und direkte Repository-Zuweisungen gewähren
separat Sichtbarkeit; Manager benötigen zusätzlich eine Manager-Zuweisung am Repository. Es gibt keine
OIDC-Gruppensynchronisierung.

<a id="verify-compose-installation"></a>

## Prüfung und Upgrades

Aufgelöste Konfiguration ohne Ausgabe von Geheimnissen validieren, dann Stack starten. Migrationen, API-Health und
Webzugriff prüfen; beim zweiten Beispiel zusätzlich Authentik-Health und OIDC-Anmeldung. .env privat halten und beide
Datenbanken sowie Authentik-Volumes sichern. Bestehende Installationen behalten ihre Volume-Namen. Ältere
Repovio-Versionen ignorieren Gruppenrechte: Ein Anwendungsrollback kann geerbte Zugriffe entziehen; direkte Zuweisungen
bleiben bestehen.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="recommended-first-session"></a>

## Weitere Anleitungen

[Weitere Anleitungen](/docs/next/setup) · [Melden Sie sich an](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Weitere Anleitungen: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Weitere Anleitungen](/docs/next/repositories)
