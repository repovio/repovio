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

[Configurar GitHub App](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## Ciclo de vida das conexões GitLab

Registre um aplicativo OAuth confidencial do GitLab com a URL de retorno exata e os escopos de leitura indicados acima.
Mantenha o segredo do cliente no ambiente da API. Somente a instância GitLab configurada pode usar esse aplicativo;
outra instância exige uma configuração de implantação correspondente.

Para uma nova conta de provedor, escolha **Adicionar provedor**, GitLab e OAuth e conclua o consentimento. Em uma
conexão GitLab existente, escolha **Conectar com GitLab OAuth** para convertê-la sem substituí-la. Conexões OAuth
gerenciadas oferecem **Autorizar novamente**. A conversão vincula o ID numérico do usuário GitLab; autorizações
posteriores devem usar o mesmo usuário, mesmo que seu nome mude. São preservados o ID, o nome atual e o estado
habilitado da conta de provedor, os repositórios acompanhados, as associações, a configuração e o histórico.
Cancelamento ou falha no consentimento mantém a conexão existente intacta.

Conexões existentes sem metadados de renovação salvos exigem uma nova autorização. O Repovio não consegue distinguir
esses tokens OAuth antigos de PATs; portanto, uma atualização não os reclassifica nem converte automaticamente.

<a id="gitlab-token-recovery"></a>

## Rotação de tokens e recuperação

O Repovio criptografa os tokens de acesso e renovação juntos e renova automaticamente os de acesso quando restam 60
segundos ou menos. Cada rotação bem-sucedida substitui o par anterior. Uma renovação rejeitada com `invalid_grant`
indica que a conexão precisa de nova autorização e suspende novas tentativas automáticas até o sucesso. Use **Autorizar
novamente**; não é necessário excluir e recriar a conexão.

Erros de rede, tempo limite, limites de solicitações e falhas do servidor usam as tentativas e esperas existentes.
Restaure a configuração do cliente se estiver ausente; uma identidade de cliente alterada exige nova autorização, e uma
instância diferente é rejeitada. Credenciais e erros brutos do provedor nunca são exibidos. Se o GitLab rotacionar os
tokens, mas a resposta se perder ou a confirmação no banco falhar, os tokens anteriores já podem ser inválidos. Autorize
novamente para recuperar; PostgreSQL e GitLab não podem confirmar essa operação atomicamente.

<a id="gitlab-oauth-rollout"></a>

## Implantação e reversão

Aplique primeiro a migração aditiva do banco de dados e depois implante versões correspondentes da API e da web.
Preserve as colunas adicionadas durante uma reversão da aplicação. Versões antigas não renovam automaticamente os tokens
OAuth do GitLab, e uma reversão não restaura tokens já invalidados pelo GitLab.
