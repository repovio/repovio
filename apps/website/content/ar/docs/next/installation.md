---
title: 'تثبيت Repovio'
description: 'تثبيت وإعداد الحسابات المحلية وAuthentik وKeycloak وخدمات OIDC الموجودة.'
---

<a id="before-you-begin"></a>

## تثبيت Repovio

اختر الحسابات المحلية أو Authentik أو Keycloak أو خدمة OIDC موجودة. الأمثلة أدناه بدائل كاملة لتثبيت جديد؛ لا تدمج
خدماتها.

يلزم Docker Engine وCompose v2 وDNS عام ووكيل عكسي TLS. استخدم اسمَي HTTPS منفصلين لـ Repovio وموفر الهوية المستضاف
ذاتياً (Authentik أو Keycloak). الصور الخاصة تتطلب صلاحية GHCR. للتثبيتات الحالية اتبع دليل النشر وترقية PostgreSQL
المطابق للإصدار؛ لا تستخدم وحدات PostgreSQL القديمة مع هذه الأمثلة.

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

<a id="docker-compose-with-keycloak"></a>

## مع Keycloak

استخدم هذه الحزمة البديلة الكاملة منفردة. أضف القيم أدناه إلى .env وأنشئ كلمات مرور عشوائية منفصلة لقاعدة البيانات
ومسؤول bootstrap. يستخدم Keycloak قاعدة PostgreSQL 17 ووحدة تخزين خاصتين؛ لا تعِد استخدام قاعدة Repovio أو وحدة
PostgreSQL قديمة. الصورة مثبتة على Keycloak 26.8.2 وتستخدم start للإنتاج، وليس start-dev.

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

في مثال Caddy الحالي غيّر وجهة auth.example.com من 127.0.0.1:9000 إلى 127.0.0.1:8080. اضبط KC_HOSTNAME على عنوان HTTPS
العام. يجب أن يستبدل Caddy ترويسات X-Forwarded، وألا يصل إلى مستمع HTTP إلا الوكيل الموثوق. لا تنشر منفذ الجاهزية
الداخلي 9000. أبقِ Allow HTTP issuer معطلاً في Repovio؛ يستخدم HTTP فقط بين الوكيل وKeycloak.

بعد التشغيل افتح وحدة الإدارة ببيانات bootstrap. أنشئ مسؤولاً دائماً في master realm وتحقق منه، ثم احذف المؤقت وأزل
إدخالي KC_BOOTSTRAP_ADMIN من Compose وقيمهما من .env. اتبع دليل Keycloak لإنشاء realm repovio والعميل والمجموعات والربط.
بعد إعادة التشغيل تحقق من discovery وحالات الوصول الأربع.

المراجع: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## استخدام موفر هوية موجود

استخدم حزمة Compose للحسابات المحلية مع خدمة Keycloak أو Entra ID أو Auth0 أو Authentik الموجودة. أضف OIDC_CALLBACK_URL
مع callback واجهة API العام المطابق إلى بيئة API المشتركة. أكمل إعداد المسؤول المحلي ثم اتبع دليل الموفر. اضبط issuer
والأسرار في Repovio، وليس بمتغيرات بيئة مبتكرة.

المراجع: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

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

<a id="keycloak-backup-recovery"></a>

## نسخ Keycloak احتياطياً واستعادته

نفّذ أوامر التحقق والتشغيل المشتركة أيضاً. بعد إعادة تشغيل Keycloak وPostgreSQL افحص الجاهزية وdiscovery عبر HTTPS
وتسجيل دخول جديد باستخدام S256 PKCE؛ يجب بقاء المستخدمين وإعدادات realm.

انسخ قاعدتي البيانات منفصلتين واحتفظ بـ Compose وملف .env المحمي وTOKEN_ENCRYPTION_KEY. يحتاج Keycloak إلى PostgreSQL
dump متسق؛ تصدير realm وحده ليس نسخة كاملة. استعد في تثبيت منفصل بالإصدارات المثبتة نفسها قبل اختبار الترقيات. أوقف
Keycloak أثناء الاستعادة، وافحص المستخدمين والأسرار والربط والأدوار قبل تحويل الزيارات. لا تستبدل وحدة التخزين الوحيدة
العاملة.

<a id="recommended-first-session"></a>

## إرشادات إضافية

[إرشادات إضافية](/docs/next/setup) · [تسجيل الدخول](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

إرشادات إضافية: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[إرشادات إضافية](/docs/next/repositories)
