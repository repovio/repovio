---
title: '认证'
description: '配置本地身份验证、可选的 OpenID Connect 登录和帐户恢复。'
---

<a id="first-run-setup"></a>

## 首次运行设置

部署新安装后，打开其公共 URL。 Repovio 将每个请求重定向到
`/auth/setup`，直到第一个帐户存在。输入可选的名字和姓氏、唯一的用户名以及至少 12 个字符的密码。该帐户以系统管理员身份创建并立即登录。

安装只能成功一次。第一个用户存在后，`/auth/setup` 重定向到
`/auth/signin`。现有安装在升级期间保留其当前用户，并且不会再次显示安装程序。

<a id="openid-connect-single-sign-on"></a>

## OpenID Connect 单点登录

除了本地登录之外，Repovio 还支持一种可选的 OpenID
Connect 提供商。系统管理员在**设置 → 身份验证**下对其进行配置。此登录与 GitHub、GitLab、Forgejo 和 Gitea 提供程序 OAuth 分开：OIDC 标识 Repovio 用户，而提供程序 OAuth 仅授予对提供程序资源的读取访问权限。

在配置提供程序之前设置准确的外部可访问的 API 回调 URL：

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

将 `OIDC_CALLBACK_URL`
的值注册为身份提供商处允许的重定向 URI。在 Repovio 中配置其颁发者、客户端 ID、可选客户端密钥、范围和组声明。 API 在保存时接受客户端密钥，但从不返回其值。它使用
`TOKEN_ENCRYPTION_KEY`
进行静态加密。使用**检查连接**之前保存配置；未保存的更改会禁用该检查。在依赖 OIDC 登录之前确认发现成功。

发行者及其端点需要 HTTPS。
**允许 HTTP 颁发者**仅适用于隔离实验室网络；决不能为可通过 Internet 访问的部署启用它。即使启用了 OIDC，本地密码登录仍可用作恢复路径。

该表单还显示用于复制的回调 URL、配置/观察的组以及用于替换或清除存储的客户端密钥的单独控件。禁用替换可以保留已保存的秘密。加载、保存和连接检查失败分别报告。修复无效配置并再次保存，然后重试连接检查。

<a id="groups-roles-and-identities"></a>

### 组、角色和身份

组声明可以是精确名称或点分路径，如 `realm_access.groups`。使用区分大小写的精确组值映射角色。多个组匹配时，优先级为
`SYSTEM_ADMIN`、`MANAGER`、`VIEWER`。缺失或未匹配的组会被拒绝，除非明确启用未匹配用户的 Viewer 权限。格式错误的声明和组超限标记始终被拒绝。

OIDC 帐户仅由经过验证的发行人和主体对链接。 Repovio 绝不会通过电子邮件地址或用户名将 OIDC 登录链接到本地​​帐户。每次成功登录时，名字和姓氏都会根据经过验证的声明进行同步；无法在本地更改登录名、配置文件名称和密码。存储库成员身份仍然在 Repovio 中进行管理，并且永远不会从身份提供者组派生。

安全相关的配置或角色变更会使现有 OIDC bearer token 失效。仅更改提供商的显示名称不会使现有 OIDC
token 失效。停用或移除身份提供商中的组会阻止受影响的账号建立新会话，并在下次登录被拒绝后使该账号之前的会话失效。

<a id="provider-examples"></a>

### 提供者示例

提供程序指南: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

对于 Authentik，使用授权代码流、上面的确切回调 URL 以及 `openid`、`profile` 和 `email`
范围创建 OAuth2/OpenID 提供程序。添加范围映射，以组名称数组的形式返回所选组声明，将提供程序附加到应用程序，然后将应用程序的颁发者、客户端 ID 和客户端密钥复制到 Repovio 中。

对于另一个符合标准的提供商，启用授权代码流，需要 S256 PKCE，注册准确的回调 URL，并在 ID 令牌或 UserInfo 响应中包含稳定的
`sub` 以及配置的组声明。 Repovio 仅接受非对称 ID 令牌签名，拒绝未签名和 HMAC 签名的令牌。

<a id="oidc-keycloak"></a>

#### Keycloak

在 Keycloak 管理控制台创建 repovio realm 和名为 repovio 的 OpenID Connect 客户端。启用 Client authentication 和 Standard
flow，禁用 Implicit flow 和 Direct access grants。在 Valid redirect
URIs 中填写下方完全一致的回调地址，强制 S256，保留 RS256 签名。从 Credentials 复制客户端密钥。

在客户端专用 scope 中添加 Group Membership mapper：Token Claim Name 为 groups，关闭 Full group path，启用 Add to ID
token。将 profile 和 email 设为默认客户端 scope。创建 repovio-admins、repovio-managers 和 repovio-viewers 并分配用户。在 Repovio 中保存下方配置，将完整组名映射到相应角色。Realm 角色不等于组成员关系。

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

参考资料: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

在 Entra ID → App
registrations 注册单租户应用，添加 Web 平台和下方完全一致的回调地址，不启用隐式令牌签发。复制 Application (client)
ID 和 Directory (tenant) ID。创建客户端密钥并复制 Value，而非密钥 ID。在 v2
issuer 中使用租户 ID，不要使用 common 或 organizations。

在 Token configuration 中为 ID token 添加安全组的 groups 声明，选择 Group
ID。创建三个安全组并分配用户，将组对象 ID 映射到 SYSTEM_ADMIN、MANAGER 和 VIEWER；显示名称不能匹配 GUID。仅输出已分配组的筛选功能可能需要相应 Entra 许可证。使用 S256
PKCE 和非对称签名，并在密钥到期前更新。

组数量超限时，即使允许未匹配用户作为 Viewer，Repovio 也会拒绝超限标记。它不会跟随外部声明来源或查询 Microsoft
Graph。应减少输出的组成员关系或配置支持的组筛选；授予 Graph 权限不能解决此问题。

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

参考资料:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

创建 Regular Web Application，将下方回调地址原样填入 Allowed Callback URLs，启用 Authorization Code 和 S256
PKCE，选择 RS256 签名，将 Token Endpoint Authentication
Method 设为 Basic。复制客户端 ID 和密钥。从所选租户或自定义域名的 discovery 获取 issuer，保留末尾斜杠，不要混用域名。

按下方示例创建 Login / Post Login Action，替换 REPLACE_WITH_REPOVIO_CLIENT_ID，部署并加入 Login
flow。由管理员将用户的 app_metadata.repovio_groups 设置为包含 repovio-admins、repovio-managers 或 repovio-viewers 的数组；不要用用户可编辑的 user_metadata 授权。Auth0 不会自动输出这些组，只在 access
token 中添加声明不够。在 Repovio 中将完整 namespaced 声明作为精确的组声明名称，并将三个值映射到对应角色。

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

参考资料: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### 验证与故障排查

所有提供程序均须原样注册 OIDC_CALLBACK_URL，请求 openid profile email，并使用 Authorization Code、S256
PKCE 和非对称签名。在设置 → 身份验证中保存 issuer、客户端 ID、密钥、scopes 和组声明，再检查连接。Discovery 成功不代表用户组声明正确。

分别测试 SYSTEM_ADMIN、MANAGER、VIEWER 及未分配用户；关闭未匹配用户的 Viewer 权限时，最后一种必须被拒绝。失败时检查组名大小写、Keycloak 路径选项、Entra 对象 ID 和 Auth0 的 namespaced
ID-token 声明。保留本地管理员用于恢复。OIDC 组仅授予全局角色；仓库权限仍需在 Repovio 中单独分配。一次只能配置一个身份提供程序。

<a id="oidc-api-contract"></a>

### OIDC API合约

| 方法         | 路径                         | 访问       | 目的                                           |
| ------------ | ---------------------------- | ---------- | ---------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | 公共       | 仅返回有效的可用性和可选的提供商名称。         |
| `GET`        | `/api/v1/auth/oidc/start`    | 公共       | 启动浏览器绑定的授权代码和 S256 PKCE 事务。    |
| `GET`        | `/api/v1/auth/oidc/callback` | 公共       | 验证提供者响应并使用一次性片段代码进行重定向。 |
| `POST`       | `/api/v1/auth/oidc/exchange` | 公共       | 消耗一次片段代码并返回正常承载`AuthResult`。   |
| `GET`、`PUT` | `/api/v1/auth/oidc/config`   | 系统管理员 | 读取或更新机密安全 OIDC 设置。                 |
| `POST`       | `/api/v1/auth/oidc/check`    | 系统管理员 | 检查保存的发现配置而不更改它。                 |

回调永远不会将承载 JWT 放置在 URL 中。其不透明的兑换码会在 60 秒后过期，并且只能使用一次。提供程序错误在到达浏览器或日志之前会被简化为稳定的错误代码。

<a id="change-your-password"></a>

## 更改密码

登录后，打开
**设置 → 常规 → 更改密码**。输入当前密码、新密码及其确认。 Repovio 使用替换访问令牌保持当前浏览器登录状态，并使所有其他登录会话持有的令牌无效。

<a id="reset-a-forgotten-password"></a>

## 重置忘记的密码

Repovio 故意没有基于电子邮件的密码重置。部署管理员可以从包含 `compose.yml`
的目录重置本地帐户。读取替换密码，而不回显它或将其存储在 shell 历史记录中，然后通过标准输入将其发送到 API 容器：

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

将 `USERNAME`
替换为准确的登录用户名。该命令需要 12 到 256 个字符之间的密码，仅更新该本地帐户，并使所有现有的访问令牌失效。之后使用新密码再次登录。该命令拒绝 OIDC 管理的帐户，因为它们没有本地密码。

<a id="local-user-and-group-management"></a>

## 本地访问组

在仓库的组访问区域分配 Viewer 或 Manager，修改或移除授权。直接与继承授权取并集，Manager 优先。管理仍需全局 Manager 角色，系统管理员不受限制。移除在下一请求生效，其他授权仍可保留访问。组支持本地和 OIDC 账户，不从 OIDC 声明同步。

[本地访问组](/docs/next/users#local-access-groups)
