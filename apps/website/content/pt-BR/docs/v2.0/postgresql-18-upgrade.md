---
title: Atualizar PostgreSQL 17 para 18
description: Migrar os dados para um novo volume PostgreSQL 18 e verificar a restauração.
---

A pilha Compose usa `postgres:18-alpine` e monta o volume nomeado em `/var/lib/postgresql`. O PostgreSQL 18 armazena o
cluster em um subdiretório específico da versão. Arquivos do PostgreSQL 17 não podem ser reutilizados diretamente.
Consulte a [documentação oficial da imagem](https://hub.docker.com/_/postgres).

Este procedimento gera um dump da aplicação e o restaura em um **novo volume separado**. Exige uma janela de manutenção.
Não combinar com a [mudança de marca](/docs/v2.0/branding-upgrade); concluí-la primeiro com a versão anterior do
PostgreSQL 17. Atualizações do código não executam migrações de produção automaticamente.

<a id="before-maintenance"></a>

## Antes da manutenção

- Preservar toda a configuração anterior, seu `.env` e o nome exato do volume PostgreSQL 17. Manter o Compose no
  diretório anterior para resolver corretamente montagens relativas e arquivos de ambiente.
- Manter `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` e `AUTH_JWT_SECRET` inalterados. A
  chave decifra as credenciais existentes de provedores e notificações.
- Reservar espaço para o dump e ambos os volumes. Proteger backups e `.env` como segredos.
- O procedimento pressupõe o único papel de banco do Repovio. Inventariar separadamente papéis, permissões, extensões e
  bancos adicionais; o dump da aplicação não garante seu backup.
- Ensaiar restauração e verificação com uma cópia descartável. `pnpm test:postgres-upgrade` usa migrações reais e apenas
  dados sintéticos; não valida o backup de uma instalação específica.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Interromper escritas e fazer backup do PostgreSQL 17

Executar no **diretório da versão anterior**, com sua configuração Compose PostgreSQL 17. Parar também outros processos
externos de escrita. Não iniciar a aplicação nova antes de concluir restauração e verificação.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

Registrar contagens iniciais de forma privada. Validar o dump restaurando-o, não apenas verificando seu tamanho.
Preservar volume e configuração antigos. Nunca executar `docker compose down --volumes` nem excluir qualquer volume de
dados.

<a id="restore-into-postgresql-18"></a>

## Restaurar no PostgreSQL 18

No **diretório da nova versão**, manter credenciais e chave. Definir `backup` como caminho absoluto do backup. Escolher
um nome novo e exclusivo e salvá-lo como `REPOVIO_POSTGRES_VOLUME` no novo `.env`; deve diferir do volume PostgreSQL 17.
Usar a sobreposição de volume externo para rejeitar nomes inexistentes ou incorretos.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

Usar um volume realmente novo e vazio; se o nome já existir, escolher outro. O ponto de entrada rejeita formatos
antigos, inclusive um volume PostgreSQL 17 montado por engano na nova raiz; não converte dados. Se a restauração falhar,
manter dump e volume antigo, investigar e repetir com outro volume novo vazio. Não restaurar repetidamente sobre um
banco parcialmente restaurado.

Comparar contagens e relações representativas. Verificar login, permissões, notificações e decifragem com a chave
preservada. Examinar saúde da API e logs em privado. Reiniciar PostgreSQL 18 e confirmar persistência antes de encerrar.
O diretório padrão testado é `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Recuperação

Antes de novas escritas, parar a pilha nova e reiniciar a versão anterior completa com volume PostgreSQL 17 e
configuração originais. Nunca deixar ambas as pilhas escreverem simultaneamente. Preservar o volume novo para
diagnóstico; PostgreSQL 17 nunca deve abrir arquivos PostgreSQL 18.

Após novas escritas, o volume antigo está desatualizado; voltar a ele perde essas escritas. Planejar reconciliação ou
recuperação testada separadamente. Restaurar um dump PostgreSQL 18 no 17 não garante downgrade. Preservar volumes e
backups até o operador encerrar explicitamente a janela de recuperação.

<a id="disposable-verification"></a>

## Verificação com recursos descartáveis

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

O teste cria contêineres, rede e volumes com nomes únicos; aplica migrações Prisma reais nas duas versões; verifica
inicialização e banco sombra; rejeita volume antigo montado incorretamente; restaura dump; compara todas as tabelas
públicas; decifra credencial sintética e verifica persistência após reinício e dados antigos intactos. A limpeza remove
apenas recursos do teste. Não usa contêineres, volumes, bancos ou credenciais existentes. Definir
`REPOVIO_TEST_API_IMAGE` para outra imagem da aplicação construída localmente.
