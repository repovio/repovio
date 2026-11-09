---
title: 'Repovio کی تنصیب'
description: 'مقامی اکاؤنٹس، Authentik، Keycloak اور موجودہ OIDC خدمات کی تنصیب اور ترتیب۔'
---

<a id="before-you-begin"></a>

## Repovio کی تنصیب

مقامی اکاؤنٹس، Authentik، Keycloak یا موجودہ OIDC سروس منتخب کریں۔ نیچے کی مثالیں نئی تنصیب کے مکمل متبادل ہیں؛ ان کی
خدمات اکٹھی نہ کریں۔

نئی تنصیب کے لیے ایک نمونہ منتخب کریں۔ Docker Engine، Compose v2، عوامی DNS اور TLS ریورس پراکسی ضروری ہیں۔ Repovio اور
خود میزبان شناخت فراہم کنندہ (Authentik یا Keycloak) کے الگ HTTPS نام رکھیں۔ نجی امیجز کے لیے GHCR رسائی چاہیے۔ موجودہ
تنصیب میں متعلقہ ورژن کی تعیناتی اور PostgreSQL اپ گریڈ ہدایات اپنائیں؛ ان نمونوں میں پرانا ڈیٹابیس والیوم استعمال نہ
کریں۔

<a id="shared-compose-configuration"></a>

## مشترک ترتیب

منتخب YAML کو compose.yml اور درج ذیل اقدار کو نجی فولڈر میں .env کے طور پر محفوظ کریں۔ تمام عارضی اقدار بدلیں اور دونوں
Repovio امیجز کے لیے ایک ہی درست ریلیز ٹیگ چنیں۔ پہلے حکم سے ڈیٹابیس پاس ورڈ اور JWT راز الگ الگ، دوسرے سے انکرپشن کلید
بنائیں۔ ہیکس پاس ورڈ URL انکوڈنگ کی غلطی سے بچاتے ہیں۔

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

## OIDC کے بغیر

اسٹیک مقامی اکاؤنٹس استعمال کرتا ہے۔ ابتدائی سیٹ اپ میں پہلا سسٹم منتظم بنائیں۔ OIDC بند رکھیں؛ انتظام → صارفین سے مزید
اکاؤنٹس بنائیں۔

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

## Authentik کے ساتھ

یہ مکمل متبادل اسٹیک استعمال کریں؛ دونوں نمونے ساتھ نہ چلائیں۔ درج ذیل Authentik اقدار .env میں شامل کریں اور الگ
ڈیٹابیس پاس ورڈ اور خفیہ کلید بنائیں۔ مقررہ ورژن اپنا PostgreSQL، سرور اور ورکر استعمال کرتا ہے؛ اس OIDC نمونے کے لیے
Redis یا Docker ساکٹ درکار نہیں۔

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

## Keycloak کے ساتھ

یہ مکمل متبادل stack الگ استعمال کریں۔ نیچے کی اقدار .env میں شامل کرکے database اور bootstrap منتظم کے الگ random
passwords بنائیں۔ Keycloak اپنی PostgreSQL 17 database اور volume استعمال کرتا ہے؛ Repovio database یا پرانی PostgreSQL
volume دوبارہ نہ لیں۔ Image، Keycloak 26.8.2 پر pinned ہے اور production start استعمال کرتی ہے، start-dev نہیں۔

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

موجودہ Caddy مثال میں auth.example.com کا upstream، 127.0.0.1:9000 سے 127.0.0.1:8080 کریں۔ KC_HOSTNAME کو عوامی HTTPS
URL دیں۔ Caddy کو X-Forwarded headers دوبارہ لکھنے چاہییں؛ صرف قابلِ اعتماد proxy، HTTP listener تک پہنچے۔ اندرونی
readiness port 9000 عام نہ کریں۔ Repovio میں Allow HTTP issuer بند رکھیں: HTTP صرف proxy اور Keycloak کے درمیان ہے۔

آغاز کے بعد bootstrap credentials سے کنسول کھولیں۔ Master realm میں مستقل منتظم بنائیں اور جانچیں، عارضی منتظم حذف کریں،
پھر Compose سے دونوں KC_BOOTSTRAP_ADMIN entries اور .env سے ان کی اقدار ہٹائیں۔ Keycloak گائیڈ کے مطابق repovio realm،
client، گروپ اور mappings بنائیں۔ Restart کے بعد discovery اور چاروں access cases جانچیں۔

حوالے: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## موجودہ شناخت فراہم کنندہ استعمال کرنا

اپنی موجودہ Keycloak، Entra ID، Auth0 یا Authentik سروس کے ساتھ local-account Compose stack استعمال کریں۔ مشترکہ API
environment میں عین public API callback والا OIDC_CALLBACK_URL شامل کریں۔ مقامی منتظم کا setup مکمل کرکے متعلقہ گائیڈ
اپنائیں۔ Issuer اور secrets، Repovio میں ترتیب دیں، من گھڑت environment variables میں نہیں۔

حوالے: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## پراکسی اور آغاز

YAML، ماحول اور پراکسی میں مثالی ڈومین بدلیں۔ پراکسی Docker میزبان پر چلتا ہے؛ دونوں ناموں کے درست TLS سرٹیفکیٹ چاہییں۔
کنٹینر پراکسی اپنی loopback کے بجائے مشترک Docker نیٹ ورک استعمال کرے۔ ڈیٹابیس پورٹس نجی رکھیں۔

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

## OIDC ترتیب دیں

Authentik کھول کر akadmin سیٹ اپ مکمل کریں۔ repovio slug، خفیہ کلائنٹ، اجازت کوڈ فلو، دستخطی کلید، ہر فراہم کنندہ کا
issuer اور نیچے دیا درست strict redirect URI رکھ کر OAuth2/OpenID ایپ اور فراہم کنندہ بنائیں۔ openid، profile، email
میپنگ شامل کریں؛ profile میں groups دعوے کے تحت گروپ نام آنے چاہییں۔

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

پہلے مقامی منتظم سے Repovio میں داخل ہوں۔ ترتیبات → تصدیق میں issuer، کلائنٹ ID اور راز دیں؛ groups اور openid profile
email اسکوپ چنیں۔ Authentik میں repovio-admins، repovio-managers، repovio-viewers بنا کر کردار ملائیں۔ جانچیں، OIDC فعال
کریں اور غیر منتظم و غیر مختص اکاؤنٹ آزمائیں۔ ترتیبات Repovio میں محفوظ ہوتی ہیں، فرضی OIDC ماحولیاتی متغیروں میں نہیں۔
مقامی لاگ ان بحالی کے لیے برقرار رہتا ہے۔

OIDC گروپ صرف عالمی کردار دیتے ہیں۔ مقامی گروپ اور براہ راست ریپوزٹری تعیناتیاں الگ رسائی دیتے ہیں؛ مینیجر کو ریپوزٹری
پر Manager اجازت بھی چاہیے۔ OIDC گروپ ہم وقت سازی نہیں ہوتی۔

<a id="verify-compose-installation"></a>

## جانچ اور اپ گریڈ

راز ظاہر کیے بغیر ترتیب جانچیں، پھر شروع کریں۔ مائیگریشن، API اور ویب، نیز دوسرے نمونے میں Authentik صحت اور OIDC لاگ ان
آزمائیں۔ .env نجی رکھیں اور دونوں ڈیٹابیس اور Authentik والیوم کا بیک اپ لیں۔ موجودہ والیوم نام برقرار رکھیں۔ پرانا ورژن
گروپ اجازت نظرانداز کرتا ہے؛ رول بیک سے وراثتی رسائی ختم ہو سکتی ہے، براہ راست تعیناتیاں برقرار رہتی ہیں۔

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Keycloak بیک اپ اور بحالی

مشترکہ validation اور startup commands بھی چلائیں۔ Keycloak اور PostgreSQL کے restart کے بعد readiness، public HTTPS
discovery اور نیا S256 PKCE login جانچیں؛ صارفین اور realm configuration برقرار رہنے چاہییں۔

دونوں databases کا الگ backup لیں اور Compose، محفوظ .env اور TOKEN_ENCRYPTION_KEY رکھیں۔ Keycloak کے لیے consistent
PostgreSQL dump درکار ہے؛ صرف realm export مکمل backup نہیں۔ Upgrade آزمانے سے پہلے انہی pinned versions والی الگ
installation میں restore کریں۔ Restore کے دوران Keycloak روکیں اور traffic منتقل کرنے سے پہلے صارفین، secrets، mappings
اور کردار جانچیں۔ واحد درست کام کرنے والی volume کو overwrite نہ کریں۔

<a id="recommended-first-session"></a>

## مزید رہنمائی

[مزید رہنمائی](/docs/next/setup) · [سائن ان کریں۔](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

مزید رہنمائی: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[مزید رہنمائی](/docs/next/repositories)
