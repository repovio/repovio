---
title: '提供商 OAuth 设置'
description: '注册 OAuth 应用程序并为 Repovio 配置只读提供商身份验证。'
---

> 存档源快照。产品标签使用Repovio。使用此版本标记部署文件中的配置标识符和容器引用，保持不变。

Repovio 通过 OAuth 或个人访问令牌 (PAT) 连接提供商帐户。当至少配置了一个提供商 OAuth 客户端时，OAuth 可用。如果没有任何配置的 OAuth 客户端，提供商帐户屏幕仅提供 PAT 身份验证。 Repovio 仅将生成的凭证用于其只读提供程序 API，并在将其写入 PostgreSQL 之前对其进行加密。

<a id="register-oauth-applications"></a>

## 注册OAuth应用程序

为 Repovio 应连接的每个提供程序实例注册一个 OAuth 应用程序。在每个应用程序注册中设置来自 `OAUTH_CALLBACK_URL`
的确切回调 URL。对于本地安装，默认值为 `http://localhost:3001/api/v1/provider-accounts/oauth/callback`。

在 API 环境中配置客户端 ID 和客户端密钥，而不是在 Web 应用程序或 Git 中：

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

仅配置此安装所需的提供程序。客户端 ID 和密钥必须始终成对配置。 `GITLAB_OAUTH_BASE_URL`
标识已安装的 OAuth 应用程序的单个 GitLab 实例。配置 OAuth 客户端时，Forgejo 需要显式基本 URL。

<a id="read-scopes"></a>

## 读取范围

注册应用程序时使用这些范围：

- GitHub：`repo security_events`。在 Repovio 可以读取安全警报之前，必须重新授权现有的 OAuth 帐户。
- GitLab：`read_api read_user`。

细粒度 GitHub 个人访问令牌需要对 Dependabot 警报、代码扫描警报和秘密扫描警报进行读取访问。 GitLab 安全警报访问还取决于实例许可证和令牌所有者的项目角色；显示不可用的警报类型，而不会导致其他存储库同步范围失败。

- Forgejo：`read:repository`。
- Gitea：在 Gitea 提供商帐户表单中配置具有读取访问权限的个人访问令牌，包括实例基本 URL。 Repovio 目前不提供共享 Gitea
  OAuth 客户端，因为每个自托管实例都需要自己的应用程序注册。

Repovio 的适配器仅公开验证、发现、工作流同步和 Webhook 验证。它们不会创建、更新、分派、重新运行、取消或删除提供程序资源。 OAuth 客户端机密保留在 API 环境中，并且 Repovio
API 永远不会返回提供者令牌。
