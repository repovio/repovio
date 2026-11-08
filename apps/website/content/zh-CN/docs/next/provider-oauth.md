---
title: '提供商 OAuth 设置'
description: '注册 OAuth 应用程序并为 Repovio 配置只读提供商身份验证。'
---

本页 PAT/OAuth 说明使用每个仓库单独配置的 Webhook。GitHub App 连接使用一个中央 Webhook，并通过 GitHub
App 对话框进行设置。

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

[设置 GitHub App](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## GitLab 连接生命周期

使用上方列出的准确回调 URL 和只读权限范围注册机密 GitLab
OAuth 应用。将客户端密钥保存在 API 环境中。此应用只能用于已配置的 GitLab 实例；其他实例需要相应的部署配置。

新建提供商账户时，选择**添加提供商**、GitLab 和 OAuth，然后完成授权同意。对于现有 GitLab 连接，选择**通过 GitLab
OAuth 连接**即可原地转换。托管 OAuth 连接提供**重新授权**操作。转换会绑定 GitLab 用户的数字 ID；后续授权必须使用同一 GitLab 用户，即使用户名已经更改。提供商账户的 ID、当前名称、启用状态，以及跟踪的仓库、成员关系、配置和历史记录均保持不变。取消或授权失败不会更改现有连接。

未保存刷新元数据的现有连接需要重新授权一次。Repovio 无法区分这些旧 OAuth 令牌和 PAT，因此升级不会自动重新标记或转换它们。

<a id="gitlab-token-recovery"></a>

## 令牌轮换与恢复

Repovio 一起加密访问令牌和刷新令牌，并在访问令牌剩余有效期不超过 60 秒时自动续期。每次成功轮换都会替换旧令牌对。如果刷新被拒绝并返回
`invalid_grant`，连接会标记为需要重新授权，并停止后续自动刷新，直到授权成功。使用**重新授权**即可，无需删除并重新创建连接。

网络错误、超时、速率限制和服务器故障沿用现有的重试与退避机制。缺失的客户端配置需要恢复；客户端身份更改需要重新授权，而实例不匹配会被拒绝。界面从不显示凭据或提供商原始错误。如果 GitLab 已轮换令牌，但响应丢失或数据库提交失败，旧令牌可能已失效。请重新授权以恢复；PostgreSQL 与 GitLab 无法原子提交此操作。

<a id="gitlab-oauth-rollout"></a>

## 部署与回滚

先应用增量数据库迁移，再部署匹配的 API 和 Web 版本。应用回滚时应保留新增列。旧版应用不会自动刷新 GitLab
OAuth 令牌，回滚也无法恢复已被 GitLab 作废的令牌。
