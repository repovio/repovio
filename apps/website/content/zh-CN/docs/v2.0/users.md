---
title: '用户'
description: '查看本地和身份管理的用户、角色、删除和 MCP 令牌管理。'
---

<a id="review-accounts"></a>

## 审核账户

系统管理员打开**管理→用户**。该表显示用户名、头像/显示名称、角色、本地/OIDC 来源以及创建/更新的时间戳。按角色过滤、排序、更改列或分页。查看者或管理者的存储库访问需要单独的
[存储库成员资格](/docs/v2.0/repositories)；身份提供者组不会创建这些成员资格。

<a id="provisioning-and-deletion"></a>

## 配置和删除

在管理 → 用户工具栏选择新建用户。输入唯一用户名、可选姓名、12–256 字符密码及确认，并选择角色，默认 Viewer。启用 OIDC 后仍可创建。OIDC 身份由身份提供程序配置，不会因用户名相同而与本地账户关联。

删除操作可供其他用户使用并立即执行；选择帐户之前先检查该帐户。您无法通过此 API 或屏幕删除自己的帐户。删除 Repovio 用户会删除本地访问权限；它不会删除 GitHub、GitLab、Forgejo 或 Gitea 上的任何提供商帐户。删除之前检查受影响用户的访问权限。

<a id="user-mcp-tokens"></a>

## 用户 MCP 代币

打开用户的 MCP 令牌对话框以列出令牌元数据或在确认后撤销令牌。管理员无法通过此对话框检索纯文本令牌值或创建其他用户的令牌。用户在[MCP设置](/docs/v2.0/mcp)中创建自己的代币。空列表和加载错误是截然不同的； API 恢复后重试。切勿将令牌值复制到支持报告或屏幕截图中。

<a id="local-user-api"></a>

## 通过 API 配置本地用户

使用 API 客户端通过 HTTPS 发送带有管理员承载身份验证的 `POST /api/v1/users` 和
`Content-Type: application/json`。提供此请求正文，替换客户端受保护输入中的占位符：

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

有效角色为 `VIEWER`、`MANAGER` 和
`SYSTEM_ADMIN`。仅分配所需的角色，然后单独授予存储库成员资格。响应包含安全的用户元数据，而不是密码或其哈希值。重试之前必须更正重复的用户名或无效的请求。不要将密码或不记名令牌存储在跟踪文件、shell 历史记录、屏幕截图或问题报告中。

<a id="create-and-reset-local-accounts"></a>

## 创建和重置本地账户

本地账户行的重置密码操作允许系统管理员在不知道旧密码时设置新密码。输入并确认密码。旧 JWT 会话失效，重置自己的账户会退出登录。OIDC 账户没有该操作。MCP 令牌不被撤销。

<a id="local-access-groups"></a>

## 本地访问组

打开管理 → 用户组创建、重命名或删除组并增删成员。组名必须唯一且非空。用户选择支持搜索和分页，一个用户可以加入多个组，不支持嵌套。删除需要确认，会移除成员关系和组授权，但保留直接分配。

在仓库的组访问区域分配 Viewer 或 Manager，修改或移除授权。直接与继承授权取并集，Manager 优先。管理仍需全局 Manager 角色，系统管理员不受限制。移除在下一请求生效，其他授权仍可保留访问。组支持本地和 OIDC 账户，不从 OIDC 声明同步。

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
