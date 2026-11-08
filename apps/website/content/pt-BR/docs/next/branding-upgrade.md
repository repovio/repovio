---
title: 'Atualização da marca Repovio'
description: 'Preserve os dados e as credenciais do banco de dados ao mudar para o nome Repovio.'
---

Essa renomeação é uma alteração significativa na configuração. Atualize todas as variáveis ​​de ambiente anteriores com
prefixo de produto para o prefixo `REPOVIO_`, incluindo `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`, `REPOVIO_API_PORT` e
`REPOVIO_WEB_PORT`. Use a API e as imagens da web em `ghcr.io/repovio/repovio-api` e `ghcr.io/repovio/repovio-web`.

Conclua primeiro a mudança de marca na versão anterior com PostgreSQL 17. A configuração Compose atual usa PostgreSQL
18; siga a [atualização separada para PostgreSQL 18](/docs/next/postgresql-18-upgrade) antes de usá-la. Nunca monte
arquivos PostgreSQL 17 no serviço PostgreSQL 18. Os passos abaixo usam a configuração PostgreSQL 17 preservada,
incluindo `compose.yml` e `compose.upgrade.yml`. Apenas a mudança de marca não exige conversão de dados; a atualização
da versão principal é uma operação separada.

## Preservar dados PostgreSQL

1. Faça backup do banco de dados existente e confirme se o backup pode ser restaurado antes de alterar a implantação.
2. Inspecione o contêiner PostgreSQL em execução com `docker inspect <postgres-container>` e registre o volume nomeado
   exato montado em `/var/lib/postgresql/data`. Pare o aplicativo antigo e os contêineres PostgreSQL sem excluir
   volumes.
3. Configure `REPOVIO_POSTGRES_VOLUME` no novo ambiente de implementação com esse nome de volume exato. Confirme que
   existe usando `docker volume inspect <recorded-volume>`. O padrão da nova instalação é `repovio-postgres`; ele não
   deve substituir acidentalmente o volume de uma instalação existente.
4. Mantenha `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` e `AUTH_JWT_SECRET` inalterados.
   Mantenha PostgreSQL na mesma versão principal. Revise `docker compose config` em particular antes de começar; sua
   saída contém segredos resolvidos e nunca deve ser compartilhada ou confirmada.
5. Use `docker compose -f compose.yml -f compose.upgrade.yml` para atualização. Essa substituição exige que o volume
   nomeado exista, portanto, um volume com erro ortográfico não pode inicializar silenciosamente um substituto vazio.
   Inicie PostgreSQL primeiro e verifique o banco de dados existente e, em seguida, inicie o serviço e o aplicativo de
   migração. Nunca execute `docker compose down --volumes`, remova o volume antigo ou inicialize um banco de dados em
   branco como parte desta renomeação.

Nenhuma conversão de dados é exigida pela marca. As credenciais do banco de dados e a chave de criptografia permanecem
essenciais para a leitura dos dados existentes. Uma implantação anterior pode ser restaurada usando sua configuração e
volume retido; evite escritores simultâneos.

## Autenticação e estado do navegador

O emissor JWT padrão agora é `repovio`; faça login novamente após a atualização. Um emissor explicitamente configurado
também deve ser atualizado deliberadamente. Preferências de navegador existentes, estado de notificação, cookies e
chaves de armazenamento não são importados. Selecione seu idioma/tema novamente, reinstale o PWA se necessário e reative
as notificações do navegador. Atualizar os nomes de exibição do provedor de identidade e a configuração do aplicativo
externo quando apropriado; as rotas de retorno de chamada não mudam. Limpe os dados obsoletos do site somente após
confirmar que a nova instalação funciona.

Revogar tokens MCP anteriores e criar substitutos: o prefixo do token renomeado não é aceito intencionalmente como um
alias.
