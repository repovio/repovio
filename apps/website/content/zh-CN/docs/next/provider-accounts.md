---
title: '提供商账户'
description: '连接和管理加密的只读提供商凭据。'
---

本页 PAT/OAuth 说明使用每个仓库单独配置的 Webhook。GitHub App 连接使用一个中央 Webhook，并通过 GitHub
App 对话框进行设置。

<a id="access-and-list"></a>

## 访问和列表

系统管理员打开**管理→提供商帐户**。该表显示名称、提供程序类型、基本 URL、启用状态和上次同步。按类型/启用进行过滤、排序、更改列和分页。其他角色不管理提供商帐户。令牌和 OAuth 机密永远不会在列表数据中返回。

<a id="connect-a-provider"></a>

## 连接提供商

选择
**添加提供商**，然后选择 GitHub、GitLab、Forgejo 或 Gitea。输入可识别的名称和正确的实例基本 URL； Gitea 需要一个。从 API 报告配置的身份验证方法中进行选择。如果没有匹配的 OAuth 客户端，请使用个人访问令牌。**验证并添加提供商**在存储 PAT 凭据之前检查它们。**连接提供商**
重定向到提供商同意并返回成功或失败通知。

仅使用 [提供商 OAuth 设置](/docs/next/provider-oauth) 中的读取范围。提供者OAuth连接存储库数据；它与
[OIDC 用户登录](/docs/next/authentication)
是分开的。 Repovio 加密静态凭证，并且从不提供提供者资源突变，即使上游令牌可以授权写入也是如此。

<a id="maintain-connections"></a>

## 保持连接

启用或禁用行来控制参与。当请求完成时，挂起的行操作会阻止冲突的操作。禁用保留配置。删除立即执行；在选择删除操作之前，请考虑相关的跟踪数据。如果提供程序所有权或凭据必须通过当前屏幕未公开的流程进行更改，则创建替换连接。

与[存储库](/docs/next/repositories)分开添加存储库； webhook 配置属于单个跟踪存储库，而不是提供商帐户。空发现可能意味着没有存储库、不正确的实例、读取范围不足或凭据无效。区分认证选项加载失败、验证错误、OAuth回调通知、API失败；重试之前纠正原因。检查作业是否存在持续的同步失败。

[设置 GitHub App](/docs/next/github-app)

GitLab 连接现在支持原地 OAuth 转换和重新授权。替换现有连接前，请参阅
[GitLab 连接生命周期](/docs/next/provider-oauth#gitlab-connection-lifecycle)；重新授权会保留跟踪数据与启用状态。
