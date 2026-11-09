---
title: 'Autenticação'
description: 'Configure a autenticação local, login opcional do OpenID Connect e recuperação de conta.'
---

<a id="first-run-setup"></a>

## Configuração de primeira execução

Após implantar uma nova instalação, abra sua URL pública. Repovio redireciona todas as solicitações para `/auth/setup`
até que a primeira conta exista. Insira um nome e sobrenome opcionais, um nome de usuário exclusivo e uma senha com pelo
menos 12 caracteres. A conta é criada como administrador do sistema e conectada imediatamente.

A instalação pode ser bem-sucedida apenas uma vez. Após a existência do primeiro usuário, `/auth/setup` redireciona para
`/auth/signin`. As instalações existentes mantêm seus usuários atuais durante as atualizações e não mostram a
configuração novamente.

<a id="openid-connect-single-sign-on"></a>

## Login único do OpenID Connect

Repovio oferece suporte a um provedor OpenID Connect opcional, além de login local. Um administrador do sistema
configura-o em **Configurações → Autenticação**. Este login é separado do provedor GitHub, GitLab, Forgejo e Gitea
OAuth: OIDC identifica um usuário Repovio, enquanto o provedor OAuth concede apenas acesso de leitura aos recursos do
provedor.

Defina o URL de retorno de chamada de API acessível externamente antes de configurar o provedor:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Registre o valor de `OIDC_CALLBACK_URL` como um URI de redirecionamento permitido no provedor de identidade. Configure
seu emissor, ID do cliente, segredo do cliente opcional, escopos e declaração de grupo em Repovio. A API aceita o
segredo do cliente ao salvar, mas nunca retorna seu valor. Ele é criptografado em repouso com `TOKEN_ENCRYPTION_KEY`.
Salve a configuração antes de usar **Verificar conexão**; alterações não salvas desativam essa verificação. Confirme o
sucesso da descoberta antes de confiar no login OIDC.

HTTPS é necessário para o emissor e seus terminais. **Permitir emissor HTTP** destina-se apenas a redes de laboratório
isoladas; ele nunca deve ser habilitado para uma implantação acessível pela Internet. O login com senha local permanece
disponível como caminho de recuperação mesmo quando OIDC está ativado.

O formulário também mostra o URL de retorno de chamada para cópia, grupos configurados/observados e controles separados
para substituir ou limpar o segredo do cliente armazenado. Deixar a substituição desabilitada preserva o segredo salvo.
Falhas de carregamento, salvamento e verificação de conexão são relatadas separadamente. Corrija a configuração inválida
e salve novamente antes de tentar novamente a verificação de conexão.

<a id="groups-roles-and-identities"></a>

### Grupos, funções e identidades

O claim de grupos pode ser um nome exato ou caminho separado por pontos como `realm_access.groups`. Use valores exatos
que diferenciem maiúsculas. Com várias correspondências, a prioridade é `SYSTEM_ADMIN`, depois `MANAGER` e `VIEWER`.
Grupos ausentes ou sem correspondência são rejeitados, exceto com acesso Viewer sem correspondência explicitamente
ativado. Claims malformados e excesso de grupos sempre são rejeitados.

Uma conta OIDC é vinculada apenas pelo par verificado de emissor e sujeito. Repovio nunca vincula um login OIDC a uma
conta local por endereço de e-mail ou nome de usuário. O nome e o sobrenome são sincronizados a partir de declarações
verificadas a cada login bem-sucedido; o nome de login, os nomes dos perfis e a senha não podem ser alterados
localmente. As associações ao repositório permanecem gerenciadas em Repovio e nunca são derivadas de grupos de
provedores de identidade.

Alterações de configuração relacionadas à segurança ou alterações de função invalidam os tokens bearer OIDC existentes.
Alterar apenas o nome de exibição do provedor não invalida esses tokens. Desativar ou remover um grupo no provedor de
identidade impede que a conta afetada obtenha uma nova sessão e invalida suas sessões anteriores após a próxima
tentativa de login negada.

<a id="provider-examples"></a>

### Exemplos de provedores

Guias de provedores: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Para Authentik, crie um provedor OAuth2/OpenID com fluxo de código de autorização, o URL de retorno de chamada exato
acima e os escopos `openid`, `profile` e `email`. Adicione um mapeamento de escopo que retorne a declaração de grupo
escolhida como uma matriz de nomes de grupos, anexe o provedor a um aplicativo e, em seguida, copie o emissor, o ID do
cliente e o segredo do cliente do aplicativo em Repovio.

Para outro provedor compatível com os padrões, habilite o Fluxo de Código de Autorização, exija S256 PKCE, registre a
URL de retorno de chamada exata e inclua um `sub` estável mais a declaração de grupo configurada no token de ID ou na
resposta UserInfo. Repovio aceita apenas assinaturas de token de ID assimétricas e rejeita tokens não assinados e
assinados por HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

No console Keycloak, crie o realm repovio e um cliente OpenID Connect repovio. Ative Client authentication e Standard
flow; desative Implicit flow e Direct access grants. Cadastre o callback exato abaixo em Valid redirect URIs, exija S256
e mantenha RS256. Copie o segredo em Credentials.

No scope dedicado do cliente, adicione um mapper Group Membership: Token Claim Name groups, Full group path desativado e
Add to ID token ativado. Adicione profile e email como scopes padrão. Crie repovio-admins, repovio-managers e
repovio-viewers, atribua usuários e associe os nomes completos aos respectivos papéis Repovio. Papéis do realm não são
associações a grupos.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

Referências: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Em Entra ID → App registrations, registre um aplicativo de tenant único com plataforma Web e o callback exato abaixo,
sem emissão implícita de tokens. Copie Application (client) ID e Directory (tenant) ID. Crie um segredo de cliente e
copie Value, não seu ID. Use o tenant no issuer v2, nunca common ou organizations.

Em Token configuration, adicione groups aos ID tokens para grupos de segurança usando Group ID. Crie três grupos,
atribua usuários e associe seus IDs de objeto a SYSTEM_ADMIN, MANAGER e VIEWER. Nomes de exibição não correspondem aos
GUIDs. Filtrar grupos atribuídos pode exigir uma licença Entra adequada. Use S256 PKCE e assinaturas assimétricas;
renove o segredo antes de expirar.

Repovio rejeita indicadores de excesso de grupos mesmo com acesso Viewer para usuários sem correspondência ativado. Não
segue fontes externas de claims nem consulta Microsoft Graph. Reduza as associações emitidas ou filtre grupos; conceder
permissões Graph não resolve.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

Referências:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Crie uma Regular Web Application, cadastre o callback exato em Allowed Callback URLs, ative Authorization Code com S256
PKCE e escolha RS256. Defina Token Endpoint Authentication Method como Basic. Copie client ID e segredo. Use o issuer de
discovery do tenant ou domínio personalizado, incluindo a barra final; não misture domínios.

Crie uma Action Login / Post Login com o exemplo abaixo, substitua REPLACE_WITH_REPOVIO_CLIENT_ID, publique-a e
adicione-a ao Login flow. Um administrador deve definir app_metadata.repovio_groups de cada usuário como um array com
repovio-admins, repovio-managers ou repovio-viewers; não use user_metadata editável pelo usuário. Auth0 não emite esses
grupos automaticamente; um claim somente no access token não basta. No Repovio, use o nome completo do claim namespaced
e associe os três valores aos papéis.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

Referências: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Validação e diagnóstico

Para cada provedor, cadastre OIDC_CALLBACK_URL exatamente, solicite openid profile email e use Authorization Code com
S256 PKCE e assinatura assimétrica. Salve issuer, client ID, segredo, scopes e claim de grupos em Configurações →
Autenticação e verifique a conexão. Discovery não verifica grupos de um usuário.

Teste SYSTEM_ADMIN, MANAGER, VIEWER e um usuário sem atribuição, que deve ser rejeitado com acesso Viewer sem
correspondência desativado. Confira nomes exatos, caminhos Keycloak, IDs Entra e claim namespaced Auth0 no ID token.
Mantenha um administrador local. Grupos OIDC concedem apenas papéis globais; repositórios exigem permissões Repovio
separadas. Configure apenas um provedor por vez.

<a id="oidc-api-contract"></a>

### Contrato API OIDC

| Método       | Caminho                      | Acesso                   | Finalidade                                                                        |
| ------------ | ---------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | Público                  | Retorna apenas a disponibilidade efetiva e o nome do provedor opcional.           |
| `GET`        | `/api/v1/auth/oidc/start`    | Público                  | Inicia um código de autorização vinculado ao navegador e uma transação S256 PKCE. |
| `GET`        | `/api/v1/auth/oidc/callback` | Público                  | Valida a resposta do provedor e redireciona com um código de fragmento único.     |
| `POST`       | `/api/v1/auth/oidc/exchange` | Público                  | Consome o código do fragmento uma vez e retorna o portador normal `AuthResult`.   |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Administrador do sistema | Lê ou atualiza configurações OIDC secretas e seguras.                             |
| `POST`       | `/api/v1/auth/oidc/check`    | Administrador do sistema | Verifica a configuração de descoberta salva sem alterá-la.                        |

O retorno de chamada nunca coloca um JWT de portador em uma URL. Seu código de troca opaco expira após 60 segundos e
pode ser usado apenas uma vez. Os erros do provedor são reduzidos a códigos de erro estáveis ​​antes de chegarem ao
navegador ou aos logs.

<a id="change-your-password"></a>

## Altere sua senha

Enquanto estiver conectado, abra **Configurações → Geral → Alterar senha**. Digite a senha atual, a nova senha e sua
confirmação. Repovio mantém o navegador atual conectado com um token de acesso substituto e invalida os tokens mantidos
por todas as outras sessões conectadas.

<a id="reset-a-forgotten-password"></a>

## Redefinir uma senha esquecida

Repovio deliberadamente não possui redefinição de senha baseada em e-mail. Um administrador de implementação pode
redefinir uma conta local no diretório que contém `compose.yml`. Leia a senha de substituição sem repeti-la ou
armazená-la no histórico do shell e, em seguida, envie-a para o contêiner da API pela entrada padrão:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Substitua `USERNAME` pelo nome de usuário de login exato. O comando requer uma senha entre 12 e 256 caracteres, atualiza
apenas a conta local e invalida todos os seus tokens de acesso existentes. Faça login novamente com a nova senha depois.
O comando rejeita contas gerenciadas por OIDC porque elas não possuem senha local.

<a id="local-user-and-group-management"></a>

## Grupos de acesso locais

Em Acesso de grupos do repositório, atribua Viewer ou Manager, altere ou remova a concessão. Direitos diretos e herdados
se somam; Manager prevalece. Gerenciamento ainda exige papel global Manager; administradores mantêm acesso total.
Remoções valem na próxima solicitação, salvo outra concessão. Grupos locais aceitam contas locais e OIDC, sem
sincronizar claims OIDC.

[Grupos de acesso locais](/docs/next/users#local-access-groups)
