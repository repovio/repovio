---
title: 'Repovio کی تنصیب'
description: 'مقامی اکاؤنٹس یا مکمل Authentik OIDC اسٹیک کے Docker Compose نمونے۔'
---

<a id="before-you-begin"></a>

## Repovio کی تنصیب

نئی تنصیب کے لیے ایک نمونہ منتخب کریں۔ Docker Engine، Compose v2، عوامی DNS اور TLS ریورس پراکسی ضروری ہیں۔ Repovio اور
Authentik کے الگ HTTPS نام رکھیں۔ نجی امیجز کے لیے GHCR رسائی چاہیے۔ موجودہ تنصیب میں متعلقہ ورژن کی تعیناتی اور
PostgreSQL اپ گریڈ ہدایات اپنائیں؛ ان نمونوں میں پرانا ڈیٹابیس والیوم استعمال نہ کریں۔

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

<a id="recommended-first-session"></a>

## مزید رہنمائی

[مزید رہنمائی](/docs/next/setup) · [سائن ان کریں۔](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

مزید رہنمائی: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[مزید رہنمائی](/docs/next/repositories)
