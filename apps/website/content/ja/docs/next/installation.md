---
title: 'Repovio のインストール'
description: 'ローカルアカウント、Authentik、Keycloak、既存 OIDC サービスのインストールと設定。'
---

<a id="before-you-begin"></a>

## Repovio のインストール

ローカルアカウント、Authentik、Keycloak、既存 OIDC サービスから選択します。以下は新規インストール用の独立した完全な構成例です。サービスを混在させないでください。

Docker Engine、Compose
v2、公開 DNS、TLS リバースプロキシが必要です。Repovio と 自前の ID プロバイダー（Authentik または Keycloak） は別の HTTPS ホスト名を使います。非公開イメージには GHCR 権限が必要です。既存環境では対応バージョンの展開と PostgreSQL 更新手順を使用し、古いデータボリュームを本例で再利用しないでください。

<a id="shared-compose-configuration"></a>

## 共通設定

選んだ YAML を compose.yml、以下を非公開ディレクトリの .env に保存します。プレースホルダーをすべて置換し、両方の Repovio イメージに同一の正確なリリースタグを指定します。最初のコマンドでデータベースパスワードと JWT シークレットを別々に、次のコマンドで暗号化キーを生成します。16進数パスワードは URL エンコードの誤りを避けます。

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

## OIDC なし

ローカルアカウントを使用します。初期設定で最初のシステム管理者を作成します。OIDC は無効のままにし、管理 → ユーザーで追加アカウントを作成します。

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

## Authentik あり

この完全な代替構成を使用し、両方を同時に起動しないでください。以下を .env に追加し、専用のパスワードとキーを生成します。固定版 Authentik は専用 PostgreSQL、サーバー、ワーカーを使用し、本 OIDC 例には Redis や Docker ソケットは不要です。

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

## Keycloak を使用する場合

この完全な代替スタックは単独で使用します。下記の値を .env に追加し、データベースと bootstrap 管理者には別々のランダムパスワードを生成します。Keycloak は専用の PostgreSQL
17 データベースとボリュームを使用します。Repovio のデータベースや古い PostgreSQL ボリュームは再利用しません。Keycloak
26.8.2 に固定し、start-dev ではなく本番用 start を使用します。

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

既存 Caddy 例で auth.example.com の転送先を 127.0.0.1:9000 から 127.0.0.1:8080 に変更します。KC_HOSTNAME は公開 HTTPS
URL に設定します。Caddy が X-Forwarded を上書きし、信頼するプロキシだけが HTTP
listener にアクセスできるようにします。内部 readiness ポート 9000 は公開しません。Repovio の Allow HTTP
issuer は無効のままです。HTTP はプロキシから Keycloak への接続にのみ使います。

起動後、bootstrap 資格情報でコンソールにログインします。master
realm に恒久管理者を作成して検証し、一時管理者を削除します。Compose の二つの KC_BOOTSTRAP_ADMIN 環境項目と .env の対応値も削除します。Keycloak 認証ガイドに従って repovio
realm、クライアント、グループ、マッピングを設定します。再起動後に discovery と四つのアクセスケースを確認します。

参考資料: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## 既存の ID プロバイダーを使用する

既存の Keycloak、Entra
ID、Auth0、Authentik サービスにはローカルアカウント用 Compose を使用します。共有 API 環境に正確な公開 API コールバックの OIDC_CALLBACK_URL を追加します。ローカル管理者の初期設定を完了し、各プロバイダーのガイドに従います。Issuer とシークレットは Repovio で設定し、独自の環境変数は追加しません。

参考資料: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## プロキシと起動

YAML、環境値、プロキシ内の例示ドメインを置換します。プロキシは Docker ホスト上で動き、両ホスト名に有効な TLS 証明書が必要です。コンテナー内プロキシは自身のループバックではなく共有 Docker ネットワークを使います。データベースポートを公開しないでください。

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

## OIDC 設定

Authentik を開いて akadmin の初期設定を完了します。slug
repovio、機密クライアント、認可コードフロー、署名キー、プロバイダー別 issuer、以下の厳密なリダイレクト URI で OAuth2/OpenID アプリとプロバイダーを作成します。openid、profile、email を含め、profile が groups クレームでグループ名を返すことを確認します。

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

ローカル管理者で Repovio にログインします。設定 → 認証に issuer、クライアント ID、シークレットを入力し、groups と openid
profile
email を指定します。Authentik に repovio-admins、repovio-managers、repovio-viewers を作り対応する役割に割り当てます。接続確認後 OIDC を有効化し、非管理者と未割り当てアカウントを確認します。設定は Repovio に保存され、架空の OIDC 環境変数は使用しません。ローカルログインは復旧用に維持されます。

OIDC グループは全体の役割のみを決めます。ローカルグループと直接割り当てがリポジトリアクセスを個別に付与します。管理者役割にはリポジトリの Manager 割り当ても必要です。OIDC グループ同期は行いません。

<a id="verify-compose-installation"></a>

## 検証と更新

シークレットを表示せず設定を検証して起動します。移行、API、Web を確認し、2つ目の例では Authentik の健全性と OIDC ログインも確認します。.env を保護し、両データベースと Authentik ボリュームをバックアップします。既存のボリューム名を維持してください。旧版はグループ権限を無視するため、戻すと継承アクセスが消える場合がありますが、直接割り当ては維持されます。

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Keycloak のバックアップと復旧

共通の検証・起動コマンドも実行します。Keycloak と PostgreSQL の再起動後に readiness、公開 HTTPS discovery、新しい S256
PKCE ログインを確認します。ユーザーと realm 設定は保持される必要があります。

二つのデータベースを個別にバックアップし、Compose、保護された .env、TOKEN_ENCRYPTION_KEY を保存します。Keycloak には整合性のある PostgreSQL
dump を使用します。Realm エクスポートだけでは不十分です。アップグレード検証前に、同じ固定バージョンで別環境へ復元します。復元中は Keycloak を停止し、切り替え前にユーザー、シークレット、マッピング、ロールを検証します。唯一の正常なボリュームに上書きしないでください。

<a id="recommended-first-session"></a>

## 関連ガイド

[関連ガイド](/docs/next/setup) · [サインイン](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

関連ガイド: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[関連ガイド](/docs/next/repositories)
