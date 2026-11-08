---
title: 'Repovio ইনস্টল করুন'
description: 'স্থানীয় অ্যাকাউন্ট বা সম্পূর্ণ Authentik OIDC স্ট্যাকসহ Docker Compose উদাহরণ।'
---

<a id="before-you-begin"></a>

## Repovio ইনস্টল করুন

নতুন ইনস্টলেশনের জন্য একটি উদাহরণ বাছুন। Docker Engine, Compose v2, পাবলিক DNS ও TLS রিভার্স প্রক্সি দরকার। Repovio ও
Authentik-এর জন্য আলাদা HTTPS হোস্টনাম ব্যবহার করুন। ব্যক্তিগত ইমেজের জন্য GHCR অনুমতি প্রয়োজন। বিদ্যমান ইনস্টলেশনে
সংস্করণ অনুযায়ী ডেপ্লয়মেন্ট ও PostgreSQL আপগ্রেড নির্দেশনা মানুন; এখানে পুরোনো ডেটাবেস ভলিউম ব্যবহার করবেন না।

<a id="shared-compose-configuration"></a>

## সাধারণ কনফিগারেশন

নির্বাচিত YAML compose.yml এবং নিচের মানগুলো ব্যক্তিগত ডিরেক্টরিতে .env হিসেবে রাখুন। সব স্থানধারক বদলান এবং দুই Repovio
ইমেজে একই নির্দিষ্ট রিলিজ ট্যাগ দিন। প্রথম কমান্ডে ডেটাবেস পাসওয়ার্ড ও JWT সিক্রেট আলাদাভাবে এবং দ্বিতীয়টিতে এনক্রিপশন
কী তৈরি করুন। হেক্স পাসওয়ার্ড URL এনকোডিং ভুল এড়ায়।

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

## OIDC ছাড়া

স্ট্যাক স্থানীয় অ্যাকাউন্ট ব্যবহার করে। প্রথম সেটআপে প্রথম সিস্টেম প্রশাসক তৈরি করুন। OIDC বন্ধ রাখুন; প্রশাসন →
ব্যবহারকারী থেকে অন্য অ্যাকাউন্ট তৈরি করুন।

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
      SHADOW_DATABASE_URL:
        postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
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

## Authentik সহ

এই সম্পূর্ণ বিকল্প স্ট্যাক ব্যবহার করুন, দুটি উদাহরণ একসঙ্গে নয়। নিচের Authentik মান .env-এ যোগ করুন এবং পৃথক ডেটাবেস
পাসওয়ার্ড ও গোপন কী তৈরি করুন। নির্দিষ্ট সংস্করণ নিজস্ব PostgreSQL, সার্ভার ও ওয়ার্কার ব্যবহার করে; এই OIDC উদাহরণে
Redis বা Docker সকেট লাগে না।

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
      SHADOW_DATABASE_URL:
        postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
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

## প্রক্সি ও চালু করা

YAML, পরিবেশ ও প্রক্সির উদাহরণ ডোমেইন বদলান। প্রক্সি Docker হোস্টে চলে; দুই নামেই বৈধ TLS সনদ চাই। কনটেইনার প্রক্সিতে
নিজস্ব loopback নয়, ভাগ করা Docker নেটওয়ার্ক ব্যবহার করুন। ডেটাবেস পোর্ট ব্যক্তিগত রাখুন।

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

## OIDC কনফিগার করুন

Authentik খুলে akadmin সেটআপ শেষ করুন। repovio slug, গোপন ক্লায়েন্ট, অথরাইজেশন কোড ফ্লো, স্বাক্ষর কী, প্রদানকারীভিত্তিক
issuer ও নিচের নির্দিষ্ট strict redirect URI দিয়ে OAuth2/OpenID অ্যাপ ও প্রদানকারী তৈরি করুন। openid, profile, email
ম্যাপিং নিন; profile যেন groups দাবিতে দলের নাম দেয়।

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

স্থানীয় প্রশাসক দিয়ে Repovio-তে ঢুকুন। সেটিংস → প্রমাণীকরণে issuer, ক্লায়েন্ট ID ও সিক্রেট দিন; groups এবং openid
profile email স্কোপ বাছুন। Authentik-এ repovio-admins, repovio-managers ও repovio-viewers বানিয়ে ভূমিকা মেলান। পরীক্ষা
করে OIDC চালু করুন, তারপর সাধারণ ও অনির্ধারিত অ্যাকাউন্ট পরীক্ষা করুন। সেটিংস Repovio-তে থাকে, কাল্পনিক OIDC পরিবেশ চরে
নয়। পুনরুদ্ধারের জন্য স্থানীয় লগইন থাকে।

OIDC দল শুধু বৈশ্বিক ভূমিকা নির্ধারণ করে। স্থানীয় দল ও সরাসরি রিপোজিটরি বরাদ্দ আলাদা প্রবেশাধিকার দেয়; ম্যানেজারের
রিপোজিটরিতে Manager বরাদ্দও দরকার। OIDC দল সমন্বয় হয় না।

<a id="verify-compose-installation"></a>

## যাচাই ও আপগ্রেড

গোপন তথ্য না ছাপিয়ে কনফিগারেশন যাচাই করে চালু করুন। মাইগ্রেশন, API ও ওয়েব এবং দ্বিতীয় উদাহরণে Authentik স্বাস্থ্য ও
OIDC লগইন পরীক্ষা করুন। .env সুরক্ষিত রাখুন এবং দুই ডেটাবেস ও Authentik ভলিউম ব্যাকআপ নিন। বিদ্যমান ভলিউম নাম রাখুন।
পুরোনো সংস্করণ দলীয় অধিকার মানে না: রোলব্যাকে উত্তরাধিকার প্রবেশ হারাতে পারে, সরাসরি বরাদ্দ থাকে।

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="recommended-first-session"></a>

## আরও নির্দেশনা

[আরও নির্দেশনা](/docs/v2.0/setup) · [সাইন ইন করুন](/docs/v2.0/sign-in) · [Repovio](/docs/v2.0/deployment) ·
[OIDC](/docs/v2.0/authentication)

আরও নির্দেশনা: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[আরও নির্দেশনা](/docs/v2.0/repositories)
