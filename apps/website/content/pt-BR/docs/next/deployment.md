---
title: 'Implantando Repovio'
description: 'Implantação de produção, proxy TLS, backup, restauração, atualização e orientação de reversão para Repovio.'
---

A pilha Compose de Repovio inicia PostgreSQL, aplica migrações Prisma uma vez e, em seguida, inicia a API e os
aplicativos da web. Ele não encerra o TLS. Coloque os serviços da Web e da API atrás de um proxy reverso que possua o
nome de host e os certificados públicos.

<a id="prerequisites"></a>

## Pré-requisitos

- Docker Engine com Docker Compose v2.
- Um registro DNS para o nome de host público.
- Um proxy reverso que obtém e renova certificados TLS.
- Um diretório de servidor privado que pode ser lido apenas por administradores de implantação.

A pilha do Compose persiste dados PostgreSQL, incluindo imagens de perfil de usuário normalizadas, em seu volume nomeado
`repovio-postgres`. Não exclua este volume, a menos que queira remover intencionalmente todos os dados Repovio.

<a id="first-deployment"></a>

## Primeira implantação

### Etapa 1: Confira uma versão Repovio lançada e crie o arquivo de ambiente privado:

```bash
cp .env.example .env
chmod 600 .env
```

### Etapa 2: Substitua todos os espaços reservados em `.env`, especialmente `POSTGRES_PASSWORD`, ambos os URLs do banco de dados, `AUTH_JWT_SECRET` e

`TOKEN_ENCRYPTION_KEY`. Gere a chave de criptografia com:

```bash
openssl rand -base64 32
```

### Etapa 3: Defina os URLs visíveis externamente. Para uma implantação em `https://repovio.example.com`, use:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Etapa 4: Vincule as portas do contêiner ao loopback quando o proxy reverso for executado no mesmo host:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

Caso contrário, restrinja o acesso às portas 3000 e 3001 com o firewall do host. Nunca exponha o contêiner PostgreSQL.

### Etapa 5: Defina `REPOVIO_VERSION` em `.env` para um par exato de imagens liberadas e, em seguida, inicie a pilha:

```bash
docker compose pull
docker compose up --detach --wait
```

Mantenha esse valor em `.env` para que cada comando posterior do Compose use a mesma API e versão da web.

### Etapa 6: Confirme o endpoint de integridade da API localmente:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Etapa 7: Abra a URL pública Repovio e preencha o [configuração única de primeira execução](/docs/next/authentication) para criar o primeiro

administrador do sistema.

<a id="reverse-proxy-and-tls"></a>

## Proxy reverso e TLS

Faça proxy da origem da web pública para a porta 3000 e dos caminhos API e Socket.IO para a porta 3001. Por exemplo, um
bloco de site Caddy pode usar:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

O proxy deve redirecionar HTTP para HTTPS, validar conexões upstream de acordo com sua política local e preservar o nome
do host público. Configure provedores OAuth com o mesmo URL de retorno de chamada HTTPS definido em
`OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## Atualizando

<a id="migrating-an-earlier-installation"></a>

### Migrando uma instalação anterior

Siga [atualização de marca](/docs/next/branding-upgrade) antes de iniciar a pilha renomeada. Defina
`REPOVIO_POSTGRES_VOLUME` com o nome exato do volume existente. Preservar as credenciais do banco de dados e a chave de
criptografia; nenhuma cópia ou redefinição do banco de dados é necessária para a marca.

### Etapa 1: Crie e verifique um backup do banco de dados antes de alterar as imagens.

### Etapa 2: Defina `REPOVIO_VERSION` para a versão de lançamento exata em `.env`.

### Etapa 3: Puxe e aplique a liberação:

```bash
docker compose pull
docker compose up --detach --wait
```

O serviço `migrate` aplica migrações pendentes do Prisma antes do início da API. Inspecione-o após cada atualização:

```bash
docker compose logs migrate
```

### Etapa 4: verifique o endpoint de integridade e o painel servido por proxy antes de considerar a atualização concluída.

<a id="database-backup"></a>

## Backup de banco de dados

Execute backups do diretório de implantação. Isso grava um dump de formato personalizado PostgreSQL no host sem imprimir
credenciais ou colocá-las na linha de comando:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Armazene cópias criptografadas fora do host e teste periodicamente as restaurações em um sistema separado.

<a id="database-restore"></a>

## Restauração do banco de dados

A restauração substitui os objetos atuais do banco de dados. Faça primeiro um novo backup e agende o tempo de
inatividade.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Depois, verifique `docker compose logs migrate` e o endpoint de integridade da API. Restaure um dump feito por uma
versão Repovio compatível ao reverter alterações de esquema.

<a id="rollback"></a>

## Reversão

### Etapa 1: Mantenha o backup feito imediatamente antes da falha na atualização.

### Etapa 2: Defina `REPOVIO_VERSION` em `.env` para a última versão de imagem em boas condições.

### Etapa 3: Execute `docker compose pull` e `docker compose up --detach --wait`.

### Etapa 4: se a versão mais recente migrou o banco de dados de forma incompatível, interrompa a API e a Web, restaure o backup compatível e, em seguida,

inicie a versão anterior da imagem novamente.

Nunca use `docker compose down --volumes` como um comando de atualização ou reversão: ele remove o volume nomeado
PostgreSQL.
