---
title: 'Repovio installieren'
description: 'Installation und Konfiguration mit lokalen Konten, Authentik, Keycloak oder vorhandenen OIDC-Diensten.'
---

<a id="before-you-begin"></a>

## Repovio installieren

Wählen Sie lokale Konten, Authentik, Keycloak oder einen vorhandenen OIDC-Dienst. Die Beispiele unten sind vollständige
Alternativen für neue Installationen; kombinieren Sie ihre Dienste nicht.

Erforderlich sind Docker Engine, Compose v2, öffentliches DNS und ein TLS-Reverse-Proxy. Für Repovio und den selbst
gehosteten Identitätsanbieter (Authentik oder Keycloak) getrennte HTTPS-Hostnamen verwenden. Private Anwendungsimages
benötigen GHCR-Zugriff. Bestehende Installationen verwenden die zur Version passende Deployment- und
PostgreSQL-Upgrade-Anleitung; ältere PostgreSQL-Volumes nicht mit diesen Neuinstallationsbeispielen verwenden.

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

<a id="docker-compose-with-keycloak"></a>

## Mit Keycloak

Verwenden Sie diesen vollständigen alternativen Stack einzeln. Ergänzen Sie .env um die Werte unten; erzeugen Sie
separate zufällige Datenbank- und Bootstrap-Passwörter. Keycloak nutzt eine eigene PostgreSQL-17-Datenbank mit eigenem
Volume; verwenden Sie weder Repovios Datenbank noch ein älteres PostgreSQL-Volume. Das Image ist auf Keycloak 26.8.2
festgelegt und nutzt den Produktionsstart start, nicht start-dev.

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

Verwenden Sie das vorhandene Caddy-Beispiel, ändern Sie jedoch für Keycloak das Ziel von auth.example.com von
127.0.0.1:9000 auf 127.0.0.1:8080. Setzen Sie KC_HOSTNAME auf Ihre öffentliche HTTPS-URL. Caddy muss X-Forwarded-Header
überschreiben; nur der vertrauenswürdige Proxy darf den HTTP-Listener erreichen. Port 9000 dient intern der
Bereitschaftsprüfung und darf nicht veröffentlicht werden. Lassen Sie HTTP-Aussteller zulassen in Repovio deaktiviert:
Nur die Verbindung vom Proxy zu Keycloak nutzt HTTP.

Öffnen Sie nach dem Start die Keycloak-Administrationskonsole mit den Bootstrap-Zugangsdaten. Erstellen und prüfen Sie
einen dauerhaften Administrator im Master-Realm, löschen Sie den temporären Administrator und entfernen Sie beide
KC_BOOTSTRAP_ADMIN-Einträge aus Compose sowie deren Werte aus .env. Folgen Sie der Keycloak-Authentifizierungsanleitung
für Realm repovio, Client, Gruppen und Zuordnungen. Prüfen Sie nach einem Neustart Discovery und alle vier
Zugriffsfälle.

Referenzen: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## Vorhandenen Identitätsanbieter verwenden

Nutzen Sie den Compose-Stack für lokale Konten mit Ihrem vorhandenen Keycloak-, Entra-ID-, Auth0- oder Authentik-Dienst.
Ergänzen Sie OIDC_CALLBACK_URL mit der exakten öffentlichen API-Callback-URL in der gemeinsamen API-Umgebung. Schließen
Sie die lokale Administratoreinrichtung ab und folgen Sie der jeweiligen Authentifizierungsanleitung. Konfigurieren Sie
Client-Geheimnisse und Issuer in Repovio, nicht über erfundene Umgebungsvariablen.

Referenzen: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

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

<a id="keycloak-backup-recovery"></a>

## Keycloak sichern und wiederherstellen

Führen Sie auch für diesen Stack die gemeinsamen Prüf- und Startbefehle aus. Prüfen Sie nach einem Neustart von Keycloak
und seiner Datenbank die Bereitschaft, öffentliche HTTPS-Discovery und eine neue Anmeldung mit S256 PKCE; Benutzer und
Realm-Konfiguration müssen erhalten bleiben.

Sichern Sie beide Datenbanken getrennt sowie Compose, die geschützte .env und TOKEN_ENCRYPTION_KEY. Verwenden Sie für
Keycloak einen konsistenten PostgreSQL-Dump; ein Realm-Export allein ist keine vollständige Sicherung. Stellen Sie die
Sicherung vor Upgrade-Tests in einer separaten Installation mit denselben festgelegten Keycloak- und
PostgreSQL-Versionen wieder her. Stoppen Sie Keycloak während der Wiederherstellung. Prüfen Sie Benutzer,
Client-Geheimnisse, Zuordnungen und alle Rollenfälle vor dem Verkehrswechsel. Überschreiben Sie niemals das einzige
funktionierende Volume.

<a id="recommended-first-session"></a>

## Weitere Anleitungen

[Weitere Anleitungen](/docs/next/setup) · [Melden Sie sich an](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Weitere Anleitungen: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Weitere Anleitungen](/docs/next/repositories)
