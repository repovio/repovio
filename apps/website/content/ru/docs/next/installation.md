---
title: 'Установка Repovio'
description: 'Установка и настройка локальных учетных записей, Authentik, Keycloak и существующих OIDC-сервисов.'
---

<a id="before-you-begin"></a>

## Установка Repovio

Выберите локальные учетные записи, Authentik, Keycloak или существующий OIDC-сервис. Ниже приведены полные альтернативы
для новой установки; не объединяйте их сервисы.

Нужны Docker Engine, Compose v2, публичный DNS и обратный прокси TLS. Используйте разные HTTPS-имена для Repovio и
собственного провайдера идентификации (Authentik или Keycloak). Закрытые образы требуют доступа GHCR. Для действующих
установок используйте инструкции развертывания и обновления PostgreSQL своей версии; старые тома в этих примерах не
используйте.

<a id="shared-compose-configuration"></a>

## Общая конфигурация

Сохраните YAML как compose.yml, а значения ниже как .env в закрытом каталоге. Замените все шаблоны и укажите одинаковый
точный тег Repovio для обоих образов. Первой командой отдельно создайте пароль БД и секрет JWT, второй — ключ
шифрования. Шестнадцатеричные пароли избегают ошибок кодирования URL.

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

## Без OIDC

Стек использует локальные учетные записи. Завершите начальную настройку и создайте первого системного администратора.
Оставьте OIDC выключенным; дополнительные записи создаются в Администрирование → Пользователи.

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

## С Authentik

Используйте этот полный альтернативный стек, не запускайте оба одновременно. Добавьте значения в .env и создайте
отдельные пароль БД и секретный ключ. Закрепленная версия использует собственную PostgreSQL, сервер и worker; Redis и
сокет Docker для этого OIDC-примера не нужны.

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

## С Keycloak

Используйте этот полный альтернативный стек отдельно. Добавьте значения ниже в .env и сгенерируйте разные случайные
пароли базы и bootstrap-администратора. Keycloak использует собственную базу PostgreSQL 17 и том; не используйте базу
Repovio или старый том PostgreSQL. Образ закреплен на Keycloak 26.8.2 с производственным start, не start-dev.

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

В существующем примере Caddy измените upstream auth.example.com с 127.0.0.1:9000 на 127.0.0.1:8080. Укажите публичный
HTTPS URL в KC_HOSTNAME. Caddy должен перезаписывать X-Forwarded; доступ к HTTP listener имеет только доверенный прокси.
Не публикуйте внутренний порт readiness 9000. Оставьте Allow HTTP issuer выключенным: HTTP используется только между
прокси и Keycloak.

После запуска войдите в консоль с bootstrap-учетными данными. Создайте и проверьте постоянного администратора в master
realm, удалите временного, затем уберите обе записи KC_BOOTSTRAP_ADMIN из Compose и их значения из .env. По руководству
Keycloak настройте realm repovio, клиент, группы и сопоставления. После перезапуска проверьте discovery и четыре
сценария доступа.

Справочные материалы: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## Существующий провайдер идентификации

Используйте Compose для локальных учетных записей с существующим Keycloak, Entra ID, Auth0 или Authentik. Добавьте
OIDC_CALLBACK_URL с точным публичным callback API в общую среду API. Завершите настройку локального администратора и
следуйте руководству провайдера. Настраивайте issuer и секреты в Repovio, а не через выдуманные переменные окружения.

Справочные материалы: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## Прокси и запуск

Замените домены в YAML, переменных и прокси. Прокси работает на Docker-хосте; оба имени требуют действительных
TLS-сертификатов. Для контейнерного прокси используйте общую Docker-сеть вместо его loopback. Порты БД не публикуйте.

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

## Настройка OIDC

Откройте Authentik и настройте akadmin. Создайте OAuth2/OpenID-приложение и провайдер: slug repovio, конфиденциальный
клиент, код авторизации, ключ подписи, issuer для провайдера и точный строгий redirect URI ниже. Включите openid,
profile и email; profile должен возвращать имена групп в groups.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

Войдите в Repovio локальным администратором. В Настройки → Аутентификация укажите issuer, ID и секрет клиента, groups и
области openid profile email. Создайте в Authentik repovio-admins, repovio-managers и repovio-viewers и сопоставьте
роли. Проверьте конфигурацию, включите OIDC, испытайте обычного пользователя и запись без назначения. Настройки хранятся
в Repovio, а не в выдуманных OIDC-переменных. Локальный вход сохраняется для восстановления.

Группы OIDC определяют только глобальные роли. Локальные группы и прямые назначения отдельно дают доступ к репозиториям;
менеджеру также нужно назначение Manager на репозиторий. Синхронизации групп OIDC нет.

<a id="verify-compose-installation"></a>

## Проверка и обновления

Проверьте конфигурацию без вывода секретов и запустите стек. Проверьте миграции, API и веб, для второго примера также
Authentik и вход OIDC. Защитите .env и сохраняйте обе БД и тома Authentik. Существующие имена томов сохраняются. Старые
версии игнорируют групповые права: откат может убрать наследуемый доступ, но прямые назначения сохранятся.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Резервное копирование и восстановление Keycloak

Выполните также общие команды проверки и запуска. После перезапуска Keycloak и PostgreSQL проверьте readiness, HTTPS
discovery и новый вход с S256 PKCE; пользователи и настройки realm должны сохраниться.

Отдельно копируйте обе базы, Compose, защищенный .env и TOKEN_ENCRYPTION_KEY. Для Keycloak нужен согласованный
PostgreSQL dump; одного экспорта realm недостаточно. Перед тестированием обновлений восстановите в отдельной установке с
теми же закрепленными версиями. Остановите Keycloak на время восстановления и проверьте пользователей, секреты,
сопоставления и роли перед переключением трафика. Не перезаписывайте единственный рабочий том.

<a id="recommended-first-session"></a>

## Дополнительные инструкции

[Дополнительные инструкции](/docs/next/setup) · [Войти](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Дополнительные инструкции: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Дополнительные инструкции](/docs/next/repositories)
