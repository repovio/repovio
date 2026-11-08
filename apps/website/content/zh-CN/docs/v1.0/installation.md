---
title: 'Repovio 用户指南'
description: '开始使用 Repovio 查看存储库、工作流程状态和所需的审批操作。'
---

> 存档源快照。产品标签使用Repovio。使用此版本标记部署文件中的配置标识符和容器引用，保持不变。

Repovio 是只读工作流程状态仪表板。它允许授权用户检查存储库活动，而无需在 GitHub、GitLab、Forgejo 或 Gitea 中创建、重新运行、批准或删除任何内容。

<a id="before-you-begin"></a>

## 开始之前

您需要 Repovio 安装的 URL 以及本地或配置的 OIDC 帐户。第一个管理员完成一次性设置；其他本地用户通过受保护的 API 进行配置，或者用户通过配置的 OIDC 登录。对提供商数据的访问取决于您的角色和存储库成员身份；登录不会自动公开每个配置的存储库。

Repovio 使用三个应用程序角色：

- **查看者** 可以检查显式分配的存储库、工作流程、问题和拉取请求。
- **经理** 具有读取权限，并且可以检查成员身份也是**经理**
  的存储库的安全警报。 通知通道、订阅、测试和历史记录由系统管理员全局管理。
- **系统管理员**可以访问每个存储库并管理提供者帐户、存储库、成员资格、用户、MCP 令牌和应用程序默认值。

应用程序角色从不授予对 GitHub、GitLab、Forgejo 或 Gitea 的写访问权限。如果操作更改提供程序状态，Repovio 将打开提供程序界面而不是执行该操作。

<a id="recommended-first-session"></a>

## 推荐第一节

1. [登入](/docs/v1.0/sign-in)，学习[导航](/docs/v1.0/navigation)，并尝试[搜索](/docs/v1.0/search)。
2. 查看
   [仪表板](/docs/v1.0/guide-dashboard)、[所有运行](/docs/v1.0/workflow-runs)、[需要注意](/docs/v1.0/needs-attention) 和
   [等待批准](/docs/v1.0/awaiting-approval)。
3. 检查[问题](/docs/v1.0/guide-issues)
   和[拉取请求](/docs/v1.0/guide-pull-requests)。4、打开[存储库](/docs/v1.0/repositories)了解一下可以看到的数据。
4. 管理员配置[通知渠道](/docs/v1.0/notifications)和[事件订阅](/docs/v1.0/notification-rules)。

然后系统管理员应继续执行
[管理和设置](/docs/v1.0/provider-accounts)。部署、提供程序注册、Webhook 设置、备份和恢复均从相应的手册页面链接。

<a id="when-a-page-is-empty-or-unavailable"></a>

## 当页面为空或不可用时

空页面可能意味着没有同步匹配的提供程序数据，过滤器排除所有结果，或者您的帐户没有存储库的成员资格。清除活动过滤器并首先检查存储库选择。加载错误消息意味着无法检索所请求的数据；重试页面操作，并要求安装管理员检查 API 和同步作业（如果错误仍然存​​在）。
