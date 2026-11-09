---
title: 'Instalar o Repovio'
description: 'Instalação e configuração com contas locais, Authentik, Keycloak ou serviços OIDC existentes.'
---

<a id="before-you-begin"></a>

## Instalar o Repovio

Escolha contas locais, Authentik, Keycloak ou um serviço OIDC existente. Os exemplos abaixo são alternativas completas
para instalações novas; não combine seus serviços.

São necessários Docker Engine, Compose v2, DNS público e proxy reverso TLS. Use nomes HTTPS separados para Repovio e o
provedor de identidade auto-hospedado (Authentik ou Keycloak). Imagens privadas exigem acesso ao GHCR. Instalações
existentes devem seguir os guias de implantação e atualização PostgreSQL da versão; não reutilize volumes antigos nestes
exemplos.

<a id="shared-compose-configuration"></a>

## Configuração comum

Salve o YAML escolhido como compose.yml e os valores como .env em diretório privado. Substitua todos os marcadores e use
a mesma versão exata do Repovio nas duas imagens. Gere separadamente a senha e o segredo JWT com o primeiro comando; a
chave de criptografia com o segundo. Senhas hexadecimais evitam erros de URL.

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

## Sem OIDC

A pilha usa contas locais. Conclua a configuração inicial para criar o primeiro administrador. Mantenha OIDC desativado;
crie outras contas em Administração → Usuários.

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

## Com Authentik

Use esta alternativa completa, sem iniciar os dois exemplos juntos. Acrescente estes valores a .env, com senha e chave
secreta independentes. A versão fixada usa PostgreSQL próprio, servidor e worker; este exemplo OIDC não precisa de Redis
nem do socket Docker.

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

## Com Keycloak

Use esta pilha completa separadamente. Acrescente os valores abaixo ao .env e gere senhas aleatórias distintas para o
banco e o administrador bootstrap. Keycloak usa seu próprio PostgreSQL 17 e volume, nunca os do Repovio nem um volume
PostgreSQL antigo. A imagem fixa Keycloak 26.8.2 com start de produção, não start-dev.

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

No exemplo Caddy existente, altere o destino de auth.example.com de 127.0.0.1:9000 para 127.0.0.1:8080. Defina
KC_HOSTNAME como a URL HTTPS pública. Caddy deve sobrescrever X-Forwarded; somente o proxy confiável deve acessar o
listener HTTP. Não publique a porta interna 9000 de readiness. Mantenha Allow HTTP issuer desativado: somente a ligação
proxy–Keycloak usa HTTP.

Abra o console com as credenciais bootstrap. Crie e verifique um administrador permanente no realm master, exclua o
temporário e remova as duas entradas KC_BOOTSTRAP_ADMIN do Compose e seus valores do .env. Siga o guia Keycloak para
realm repovio, cliente, grupos e associações. Após reiniciar, verifique discovery e os quatro casos de acesso.

Referências: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## Usar um provedor existente

Use a pilha Compose de contas locais com seu serviço Keycloak, Entra ID, Auth0 ou Authentik existente. Adicione
OIDC_CALLBACK_URL com o callback API público exato ao ambiente API compartilhado. Configure o administrador local e siga
o guia do provedor. Configure issuer e segredos no Repovio, sem inventar variáveis de ambiente.

Referências: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## Proxy e inicialização

Substitua os domínios no YAML, variáveis e proxy. O proxy executa no host Docker; ambos os nomes precisam de
certificados TLS válidos. Um proxy em contêiner deve usar uma rede Docker compartilhada em vez do próprio loopback.
Mantenha os bancos sem portas públicas.

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

## Configurar OIDC

Abra Authentik e configure akadmin. Crie aplicação/provedor OAuth2/OpenID com slug repovio, cliente confidencial, fluxo
de código, chave de assinatura, emissor por provedor e a URI estrita abaixo. Inclua openid, profile e email; profile
deve fornecer nomes de grupos em groups.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

Entre no Repovio com o administrador local. Em Configurações → Autenticação informe emissor, ID e segredo; selecione
groups e escopos openid profile email. Crie repovio-admins, repovio-managers e repovio-viewers no Authentik e associe os
papéis. Teste, ative OIDC e verifique uma conta não administradora e uma sem associação. Os ajustes ficam no Repovio,
não em variáveis OIDC inventadas. O login local continua disponível para recuperação.

Grupos OIDC definem apenas papéis globais. Grupos locais e associações diretas concedem acesso a repositórios
separadamente; um gerente também precisa de concessão Manager. Não há sincronização de grupos OIDC.

<a id="verify-compose-installation"></a>

## Verificação e atualizações

Valide sem exibir segredos e inicie. Verifique migrações, saúde da API e web; no segundo exemplo, saúde Authentik e
login OIDC. Proteja .env e faça backup dos dois bancos e volumes Authentik. Preserve nomes de volumes existentes.
Versões antigas ignoram permissões de grupo: reverter a aplicação pode retirar acesso herdado, preservando associações
diretas.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Backup e recuperação do Keycloak

Execute também os comandos comuns de validação e inicialização. Após reiniciar Keycloak e PostgreSQL, verifique
readiness, discovery HTTPS e um novo login S256 PKCE; usuários e realm devem persistir.

Faça backup separado dos dois bancos, Compose, .env protegido e TOKEN_ENCRYPTION_KEY. Para Keycloak, use um dump
PostgreSQL consistente; exportar somente o realm não basta. Restaure em outra instalação com as mesmas versões fixadas
antes de testar atualizações. Pare Keycloak durante a restauração e verifique usuários, segredos, associações e papéis
antes de trocar o tráfego. Nunca sobrescreva o único volume funcional.

<a id="recommended-first-session"></a>

## Mais orientações

[Mais orientações](/docs/next/setup) · [Faça login](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Mais orientações: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Mais orientações](/docs/next/repositories)
