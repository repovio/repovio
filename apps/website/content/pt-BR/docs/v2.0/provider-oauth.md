---
title: 'Configuração do provedor OAuth'
description: 'Registre aplicativos OAuth e configure a autenticação do provedor somente leitura para Repovio.'
---

As instruções PAT/OAuth desta página usam webhooks por repositório. Conexões GitHub App usam um webhook central e são
configuradas pelo diálogo do aplicativo.

Repovio conecta contas de provedores por meio de OAuth ou de um token de acesso pessoal (PAT). OAuth está disponível
quando pelo menos um cliente provedor OAuth está configurado. Sem nenhum cliente OAuth configurado, a tela da conta do
provedor oferece apenas autenticação PAT. Repovio usa a credencial resultante apenas para suas APIs de provedor somente
leitura e a criptografa antes de gravá-la em PostgreSQL.

<a id="register-oauth-applications"></a>

## Registrar aplicativos OAuth

Registre um aplicativo OAuth para cada instância do provedor que Repovio deve conectar. Defina o URL de retorno de
chamada exato de `OAUTH_CALLBACK_URL` em cada registro de aplicativo. Para uma instalação local, o padrão é
`http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Configure o ID do cliente e o segredo do cliente no ambiente da API, nunca no aplicativo Web ou no Git:

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

Configure apenas os provedores necessários para esta instalação. Os IDs de cliente e os segredos devem sempre ser
configurados como pares. `GITLAB_OAUTH_BASE_URL` identifica a única instância GitLab para o aplicativo OAuth instalado.
Forgejo precisa de um URL base explícito quando seu cliente OAuth é configurado.

<a id="read-scopes"></a>

## Ler escopos

Use estes escopos ao registrar o aplicativo:

-GitHub: `repo security_events`. As contas OAuth existentes devem ser reautorizadas antes que Repovio possa ler alertas
de segurança. -GitLab: `read_api read_user`.

Os tokens de acesso pessoal GitHub refinados precisam de acesso de leitura aos alertas do Dependabot, alertas de
verificação de código e alertas de verificação secreta. O acesso ao alerta de segurança GitLab depende adicionalmente da
licença da instância e da função do projeto do proprietário do token; tipos de alerta indisponíveis são mostrados sem
falhar em outros escopos de sincronização do repositório.

-Forgejo: `read:repository`.

- Gitea: configure um token de acesso pessoal com acesso de leitura no formulário conta-provedor Gitea, incluindo a URL
  base da instância. Repovio atualmente não oferece um cliente Gitea OAuth compartilhado porque cada instância
  auto-hospedada precisa de seu próprio registro de aplicativo.

Os adaptadores Repovio expõem apenas validação, descoberta, sincronização de fluxo de trabalho e verificação de webhook.
Eles não criam, atualizam, despacham, executam novamente, cancelam ou excluem recursos do provedor. Os segredos do
cliente OAuth permanecem no ambiente da API e os tokens do provedor nunca são retornados pela API Repovio.

[Configurar GitHub App](/docs/v2.0/github-app)
