---
title: '存储库 Webhook 设置'
description: '为 GitHub、GitLab、Forgejo 和 Gitea 存储库配置签名的只读 Webhook。'
---

本页 PAT/OAuth 说明使用每个仓库单独配置的 Webhook。GitHub App 连接使用一个中央 Webhook，并通过 GitHub
App 对话框进行设置。

Repovio 可以接收签名的 Webhook，以比正常轮询间隔更早同步跟踪的存储库。它从不通过提供者 API 创建、更新、删除或测试 Webhook。管理员在 GitHub、GitLab、Forgejo 或 Gitea 中手动配置每个存储库 Webhook。

打开 **Repositories**，选择一个跟踪的存储库，然后使用其**Repository webhook**
卡。该卡显示存储库特定的回调 URL，生成或接受签名密钥，并报告最后接受的交付。 Repovio 永远不会将该配置发送给提供商。

Webhook 是一种优化，而不是事实来源。签名的有效负载必须标识回调 URL 选择的存储库。然后，Repovio 通过配置的只读提供程序适配器读取当前数据。接受的交付将进入持久存储库同步队列； 15 秒内收到的交付将被合并。默认回退轮询间隔为 30 分钟。

<a id="configure-a-repository-webhook"></a>

## 配置存储库 webhook

1. 将存储库添加到 Repovio 并打开其 **Repository webhook** 卡。
2. 复制回调URL。
3. 生成唯一的高熵签名密钥或粘贴提供商提供的准确签名令牌。切勿重复使用访问令牌或其他存储库的秘密。
4. 保守秘密。 Repovio 使用 AES-256-GCM 对其进行加密，并且永远不会通过 API 返回它。
5. 在该存储库的提供程序设置中配置回调 URL 和密钥。
6. 保持 TLS 验证启用并发送测试交付。

稳定回调使用 `/api/webhooks/<provider>/<repository-id>`。版本化的 `/api/v1/webhooks/<provider>/<repository-id>`
回调也可用。不再接受 Repovio
0.2.9 及更早版本的提供商帐户回调 URL。升级后，使用其存储库回调和新的存储库密钥重新创建每个 Webhook。

成功交付返回 HTTP `202` 和 `{ "accepted": true }`。重复的提供商传递 ID 返回
`{ "accepted": true, "duplicate": true }`，并且不会将另一个同步排入队列。未知或禁用的存储库、禁用的提供程序帐户、丢失的机密、无效的签名、不匹配的提供程序存储库 ID 和丢失的交付 ID 都会被拒绝，而不暴露配置详细信息。

排队同步在 API 重新启动后仍然有效。多个实例使用数据库租用，并且不会同时同步同一提供程序帐户。速率限制标头会延迟受影响帐户的工作，而有界重试会处理暂时性故障。

<a id="github-actions"></a>

## GitHub 行动

1. 打开存储库的 **设置 → Webhooks** 并选择**添加 Webhook**。
2. 使用 `https://repovio.example.com/api/webhooks/github/<repository-id>` 作为负载 URL。
3. 选择 `application/json`，粘贴存储库机密，然后订阅 **工作流程运行** (`workflow_run`)。
4. 保持 SSL 验证启用并保存 Webhook。

Repovio 在原始主体上验证 `X-Hub-Signature-256` 并使用 `X-GitHub-Delivery` 实现幂等性。请参阅 GitHub 的
[Webhook 事件文档](https://docs.github.com/en/webhooks/webhook-events-and-payloads)。

<a id="gitlab-pipelines"></a>

## GitLab 管道

1. 打开项目的 **设置 → Webhooks** 并选择**添加新的 webhook**。
2. 使用 `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` 作为 URL。
3. 生成**签名令牌**并将其完整值（包括 `whsec_`）保存在 Repovio 存储卡中。
4. 选择 **管道事件**，保持启用 SSL 验证，保存并发送测试交付。

Repovio 验证标准 Webhooks HMAC-SHA256 签名，并更喜欢 `webhook-id` 的幂等性。旧实例仍支持旧版 `X-Gitlab-Token` 和
`X-Gitlab-Event-UUID` 标头。请参阅 GitLab 的
[网络钩子文档](https://docs.gitlab.com/user/project/integrations/webhooks/)。

<a id="forgejo-actions"></a>

## Forgejo 行动

1. 打开存储库的 **设置 → Webhooks** 并添加本机**Forgejo** JSON Webhook。
2. 使用 `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` 作为目标 URL。
3. 粘贴存储库机密并选择 **推送事件** 以及任何可用的操作事件。
4. 保持 TLS 验证启用并保存 Webhook。

Repovio验证`X-Forgejo-Signature`并使用`X-Forgejo-Delivery`实现幂等性。 Gitea 兼容头仍然接受 Forgejo 兼容性。请参阅 Forgejo
[网络钩子文档](https://forgejo.org/docs/latest/user/repository/webhooks/)。

<a id="gitea-actions"></a>

## Gitea 行动

1. 打开存储库的 **设置 → Webhooks** 并添加本机**Gitea** JSON Webhook。
2. 使用 `https://repovio.example.com/api/webhooks/gitea/<repository-id>` 作为目标 URL。
3. 粘贴存储库机密并选择 **推送事件** 以及任何可用的工作流程事件。
4. 保持 TLS 验证启用并保存 Webhook。

Repovio 在原始主体上验证 `X-Gitea-Signature` 并使用 `X-Gitea-Delivery` 实现幂等性。请参阅 Gitea
[网络钩子文档](https://docs.gitea.com/usage/repository/webhooks/)。

<a id="troubleshooting"></a>

## 故障排除

- `401`
  表示 Repovio 无法验证存储库、提供程序类型、机密、签名、有效负载存储库 ID 或交付 ID。确认回调的存储库 UUID 和确切的秘密。
- 当提供商重试交付时，预计会出现 `202` 和 `duplicate: true`。
- 成功下发仅触发只读同步；它永远不会修改提供者的工作流程。
- 检查 `/api/health` 的持久提供程序同步状态。
- 将 `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` 设置为 30 分钟后备。
- `SCHEDULER_ENABLED=false` 保留排队的请求，但暂停回退排队和处理。

[设置 GitHub App](/docs/v2.0/github-app)
