---
title: 'Repovio स्थापित करें'
description: 'स्थानीय खाते, Authentik, Keycloak और मौजूदा OIDC सेवाओं की स्थापना व कॉन्फ़िगरेशन।'
---

<a id="before-you-begin"></a>

## Repovio स्थापित करें

स्थानीय खाते, Authentik, Keycloak या मौजूदा OIDC सेवा चुनें। नीचे के उदाहरण नई स्थापना के पूर्ण विकल्प हैं; उनकी सेवाएँ
आपस में न मिलाएँ।

नई स्थापना के लिए एक उदाहरण चुनें। Docker Engine, Compose v2, सार्वजनिक DNS और TLS रिवर्स प्रॉक्सी आवश्यक हैं। Repovio
और स्व-होस्टेड पहचान प्रदाता (Authentik या Keycloak) के लिए अलग HTTPS होस्टनाम रखें। निजी इमेज के लिए GHCR पहुँच चाहिए।
मौजूदा स्थापना में संस्करण के अनुरूप परिनियोजन और PostgreSQL अपग्रेड निर्देश अपनाएँ; इन उदाहरणों में पुराने डेटाबेस
वॉल्यूम दोबारा न लगाएँ।

<a id="shared-compose-configuration"></a>

## साझा विन्यास

चुना हुआ YAML compose.yml और नीचे के मान निजी निर्देशिका में .env के रूप में रखें। सभी स्थानधारक बदलें और दोनों Repovio
इमेज का एक ही सटीक रिलीज़ टैग चुनें। पहले आदेश से डेटाबेस पासवर्ड और JWT रहस्य अलग-अलग, दूसरे से एन्क्रिप्शन कुंजी
बनाएँ। हेक्स पासवर्ड URL एन्कोडिंग की गलतियाँ रोकते हैं।

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

## OIDC के बिना

स्टैक स्थानीय खाते उपयोग करता है। प्रारंभिक सेटअप में पहला सिस्टम व्यवस्थापक बनाएँ। OIDC बंद रखें और प्रशासन →
उपयोगकर्ता से अतिरिक्त खाते बनाएँ।

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

## Authentik के साथ

यह पूर्ण वैकल्पिक स्टैक चलाएँ, दोनों उदाहरण साथ नहीं। नीचे के Authentik मान .env में जोड़ें; अलग डेटाबेस पासवर्ड और
गुप्त कुंजी बनाएँ। निश्चित संस्करण अपना PostgreSQL, सर्वर और वर्कर उपयोग करता है; OIDC उदाहरण के लिए Redis या Docker
सॉकेट नहीं चाहिए।

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

## Keycloak के साथ

इस पूरे वैकल्पिक stack को अलग उपयोग करें। नीचे के मान .env में जोड़ें और डेटाबेस व bootstrap व्यवस्थापक के लिए अलग
random passwords बनाएँ। Keycloak अपना PostgreSQL 17 डेटाबेस और volume उपयोग करता है; Repovio डेटाबेस या पुराना
PostgreSQL volume दोबारा न लें। Image Keycloak 26.8.2 पर pinned है और production start उपयोग करती है, start-dev नहीं।

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

मौजूदा Caddy उदाहरण में auth.example.com का upstream 127.0.0.1:9000 से 127.0.0.1:8080 करें। KC_HOSTNAME को public HTTPS
URL पर सेट करें। Caddy को X-Forwarded headers overwrite करने चाहिए; केवल trusted proxy HTTP listener तक पहुँचे। आंतरिक
readiness port 9000 प्रकाशित न करें। Repovio में Allow HTTP issuer बंद रखें: HTTP केवल proxy से Keycloak तक उपयोग होता
है।

Startup के बाद bootstrap credentials से कंसोल खोलें। Master realm में स्थायी व्यवस्थापक बनाकर सत्यापित करें, अस्थायी
व्यवस्थापक हटाएँ, फिर Compose से दोनों KC_BOOTSTRAP_ADMIN entries और .env से उनके मान हटाएँ। Keycloak गाइड के अनुसार
repovio realm, client, समूह और mappings बनाएँ। Restart के बाद discovery और चारों access cases जाँचें।

संदर्भ: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## मौजूदा पहचान प्रदाता उपयोग करना

अपने मौजूदा Keycloak, Entra ID, Auth0 या Authentik के साथ local-account Compose stack उपयोग करें। साझा API environment
में सटीक public API callback वाला OIDC_CALLBACK_URL जोड़ें। स्थानीय व्यवस्थापक setup पूरा करके संबंधित गाइड अपनाएँ।
Issuer और secrets Repovio में सेट करें, मनगढ़ंत environment variables में नहीं।

संदर्भ: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## प्रॉक्सी और आरंभ

YAML, वातावरण और प्रॉक्सी में उदाहरण डोमेन बदलें। प्रॉक्सी Docker होस्ट पर चलता है; दोनों नामों के वैध TLS प्रमाणपत्र
चाहिए। कंटेनर प्रॉक्सी के लिए उसके loopback की जगह साझा Docker नेटवर्क उपयोग करें। डेटाबेस पोर्ट निजी रखें।

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

## OIDC सेट करें

Authentik खोलकर akadmin सेटअप पूरा करें। repovio slug, गोपनीय क्लाइंट, प्राधिकरण कोड प्रवाह, हस्ताक्षर कुंजी,
प्रति-प्रदाता issuer और नीचे के सटीक strict redirect URI वाला OAuth2/OpenID अनुप्रयोग तथा प्रदाता बनाएँ। openid,
profile, email मैपिंग जोड़ें; profile में groups दावे के अंतर्गत समूह नाम आने चाहिए।

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

पहले स्थानीय व्यवस्थापक से Repovio में आएँ। सेटिंग → प्रमाणीकरण में issuer, क्लाइंट ID और रहस्य दें; groups और openid
profile email स्कोप चुनें। Authentik में repovio-admins, repovio-managers, repovio-viewers बनाकर भूमिकाएँ मैप करें।
जाँचें, OIDC चालू करें, फिर गैर-व्यवस्थापक और बिना भूमिका खाते का परीक्षण करें। सेटिंग Repovio में रहती हैं, काल्पनिक
OIDC वातावरण चर में नहीं। स्थानीय प्रवेश पुनर्प्राप्ति हेतु उपलब्ध रहता है।

OIDC समूह केवल वैश्विक भूमिकाएँ देते हैं। स्थानीय समूह और सीधे रिपॉज़िटरी आवंटन अलग पहुँच देते हैं; मैनेजर को रिपॉज़िटरी
पर Manager अनुदान भी चाहिए। OIDC समूह समकालिकरण नहीं होता।

<a id="verify-compose-installation"></a>

## सत्यापन और अपग्रेड

रहस्य छापे बिना विन्यास जाँचें और आरंभ करें। माइग्रेशन, API और वेब जाँचें; दूसरे उदाहरण में Authentik स्वास्थ्य और OIDC
प्रवेश भी। .env निजी रखें और दोनों डेटाबेस तथा Authentik वॉल्यूम का बैकअप लें। पुराने वॉल्यूम नाम बनाए रखें। पुराना
संस्करण समूह अधिकार अनदेखा करता है: रोलबैक से विरासत पहुँच हट सकती है, सीधे आवंटन बने रहते हैं।

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Keycloak बैकअप और पुनर्प्राप्ति

साझा validation और startup commands भी चलाएँ। Keycloak और PostgreSQL restart करने के बाद readiness, public HTTPS
discovery और नया S256 PKCE login जाँचें; उपयोगकर्ता और realm configuration बने रहने चाहिए।

दोनों डेटाबेस अलग backup करें और Compose, सुरक्षित .env तथा TOKEN_ENCRYPTION_KEY रखें। Keycloak के लिए consistent
PostgreSQL dump चाहिए; केवल realm export पूर्ण backup नहीं है। Upgrade परीक्षण से पहले समान pinned versions वाली अलग
installation में restore करें। Restore के समय Keycloak रोकें और traffic बदलने से पहले उपयोगकर्ता, secrets, mappings व
roles जाँचें। एकमात्र काम कर रहे volume को overwrite न करें।

<a id="recommended-first-session"></a>

## आगे के निर्देश

[आगे के निर्देश](/docs/next/setup) · [साइन इन करें](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

आगे के निर्देश: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[आगे के निर्देश](/docs/next/repositories)
