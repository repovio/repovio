---
title: '用户'
description: '查看本地和身份管理的用户、角色、删除和 MCP 令牌管理。'
---

> 存档源快照。产品标签使用Repovio。使用此版本标记部署文件中的配置标识符和容器引用，保持不变。

<a id="review-accounts"></a>

## 审核账户

系统管理员打开**管理→用户**。该表显示用户名、头像/显示名称、角色、本地/OIDC 来源以及创建/更新的时间戳。按角色过滤、排序、更改列或分页。查看者或管理者的存储库访问需要单独的
[存储库成员资格](/docs/v1.0/repositories)；身份提供者组不会创建这些成员资格。

<a id="provisioning-and-deletion"></a>

## 配置和删除

用户页面没有创建用户或编辑用户表单。其他本地用户是通过仅限管理员的受保护用户 API 使用用户名、密码和角色创建的。 OIDC 用户通过配置的身份登录进行配置。有关映射和帐户分离，请参阅
[验证](/docs/v1.0/authentication)。请勿根据您自己的“设置”页面上是否存在可编辑配置文件来推断用户编辑操作。

删除操作可供其他用户使用并立即执行；选择帐户之前先检查该帐户。您无法通过此 API 或屏幕删除自己的帐户。删除 Repovio 用户会删除本地访问权限；它不会删除 GitHub、GitLab、Forgejo 或 Gitea 上的任何提供商帐户。删除之前检查受影响用户的访问权限。

<a id="user-mcp-tokens"></a>

## 用户 MCP 代币

打开用户的 MCP 令牌对话框以列出令牌元数据或在确认后撤销令牌。管理员无法通过此对话框检索纯文本令牌值或创建其他用户的令牌。用户在[MCP设置](/docs/v1.0/mcp)中创建自己的代币。空列表和加载错误是截然不同的； API 恢复后重试。切勿将令牌值复制到支持报告或屏幕截图中。

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
