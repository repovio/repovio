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

组声明可以是一个精确的声明名称或点分隔的路径，例如
`realm_access.groups`。为三个 Repovio 角色配置准确、区分大小写的组值。如果多个组匹配，则 Repovio 应用
`SYSTEM_ADMIN`，然后是 `MANAGER`，然后是
`VIEWER`。除非明确启用**允许不匹配的用户作为查看者**，否则不匹配、格式错误、缺失或过大的组声明将被拒绝。

OIDC 帐户仅由经过验证的发行人和主体对链接。 Repovio 绝不会通过电子邮件地址或用户名将 OIDC 登录链接到本地​​帐户。每次成功登录时，名字和姓氏都会根据经过验证的声明进行同步；无法在本地更改登录名、配置文件名称和密码。存储库成员身份仍然在 Repovio 中进行管理，并且永远不会从身份提供者组派生。

安全相关的配置或角色变更会使现有 OIDC bearer token 失效。仅更改提供商的显示名称不会使现有 OIDC
token 失效。停用或移除身份提供商中的组会阻止受影响的账号建立新会话，并在下次登录被拒绝后使该账号之前的会话失效。

<a id="provider-examples"></a>

### 提供者示例

对于 Authentik，使用授权代码流、上面的确切回调 URL 以及 `openid`、`profile` 和 `email`
范围创建 OAuth2/OpenID 提供程序。添加范围映射，以组名称数组的形式返回所选组声明，将提供程序附加到应用程序，然后将应用程序的颁发者、客户端 ID 和客户端密钥复制到 Repovio 中。

对于另一个符合标准的提供商，启用授权代码流，需要 S256 PKCE，注册准确的回调 URL，并在 ID 令牌或 UserInfo 响应中包含稳定的
`sub` 以及配置的组声明。 Repovio 仅接受非对称 ID 令牌签名，拒绝未签名和 HMAC 签名的令牌。

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

[本地访问组](/docs/v2.0/users#local-access-groups)
