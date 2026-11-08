---
title: 'تثبيت Repovio'
description: 'أمثلة Docker Compose بحسابات محلية أو حزمة Authentik OIDC كاملة.'
---

<a id="before-you-begin"></a>

## تثبيت Repovio

اختر مثالاً لتثبيت جديد. يلزم Docker Engine وCompose v2 وDNS عام ووكيل عكسي TLS. استخدم اسمَي HTTPS منفصلين لـ Repovio
وAuthentik. الصور الخاصة تتطلب صلاحية GHCR. للتثبيتات الحالية اتبع دليل النشر وترقية PostgreSQL المطابق للإصدار؛ لا
تستخدم وحدات PostgreSQL القديمة مع هذه الأمثلة.

<a id="shared-compose-configuration"></a>

## الإعداد المشترك

احفظ YAML باسم compose.yml والقيم التالية في .env داخل مجلد خاص. استبدل كل القيم المؤقتة وحدد نفس وسم إصدار Repovio
الدقيق للصورتين. أنشئ كلمة مرور القاعدة وسر JWT كلّاً على حدة بالأمر الأول ومفتاح التشفير بالثاني. كلمات المرور السداسية
تتجنب أخطاء ترميز URL.

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

## بدون OIDC

تستخدم الحزمة حسابات محلية. أكمل الإعداد الأول لإنشاء مسؤول النظام الأول. اترك OIDC معطلاً وأنشئ الحسابات الإضافية من
الإدارة ← المستخدمون.

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

## مع Authentik

استخدم هذه الحزمة البديلة الكاملة ولا تشغل المثالين معاً. أضف القيم التالية إلى .env وأنشئ كلمة مرور قاعدة ومفتاحاً
سرياً منفصلين. الإصدار المثبت يستخدم PostgreSQL مستقلة وخادماً وعاملاً؛ لا يحتاج مثال OIDC إلى Redis أو مقبس Docker.

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

## الوكيل والتشغيل

استبدل النطاقات في YAML والمتغيرات والوكيل. يعمل الوكيل على مضيف Docker ويحتاج الاسمان شهادات TLS صالحة. الوكيل داخل
حاوية يستخدم شبكة Docker مشتركة بدلاً من loopback الخاص به. أبق منافذ قواعد البيانات خاصة.

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

## إعداد OIDC

افتح Authentik وأكمل إعداد akadmin. أنشئ تطبيقاً ومزود OAuth2/OpenID مع slug repovio وعميل سري وتدفق رمز تفويض ومفتاح
توقيع ومُصدر لكل مزود وURI إعادة توجيه صارم مطابق أدناه. أضف openid وprofile وemail وتأكد أن profile يرجع أسماء
المجموعات في groups.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

سجل في Repovio بالمسؤول المحلي أولاً. في الإعدادات ← المصادقة أدخل المُصدر ومعرف العميل وسره واختر groups ونطاقات openid
profile email. أنشئ repovio-admins وrepovio-managers وrepovio-viewers في Authentik واربط الأدوار. اختبر الإعداد ثم فعّل
OIDC واختبر حساباً غير إداري وآخر دون تعيين. تحفظ الإعدادات في Repovio لا في متغيرات OIDC مخترعة. يبقى الدخول المحلي
للاسترداد.

مجموعات OIDC تحدد الأدوار العامة فقط. مجموعات الوصول المحلية والتعيينات المباشرة تمنح وصول المستودعات بشكل منفصل؛ يحتاج
المدير أيضاً إلى تعيين Manager للمستودع. لا توجد مزامنة مجموعات OIDC.

<a id="verify-compose-installation"></a>

## التحقق والترقيات

تحقق دون طباعة الأسرار ثم شغل الحزمة. افحص الترحيلات وAPI والويب، وللمثال الثاني صحة Authentik ودخول OIDC أيضاً. احم
.env وانسخ القاعدتين ووحدات Authentik احتياطياً. احتفظ بأسماء الوحدات الحالية. الإصدارات القديمة تتجاهل حقوق المجموعات؛
التراجع قد يلغي الوصول الموروث مع بقاء التعيينات المباشرة.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="recommended-first-session"></a>

## إرشادات إضافية

[إرشادات إضافية](/docs/next/setup) · [تسجيل الدخول](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

إرشادات إضافية: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[إرشادات إضافية](/docs/next/repositories)
