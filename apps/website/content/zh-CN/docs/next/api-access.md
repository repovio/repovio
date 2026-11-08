---
title: 'API访问'
description: '打开已安装的 API 文档并使用特定于版本的静态 API 参考。'
---

<a id="installed-api-documentation"></a>

## 安装的API文档

每个 Repovio API 服务器在 `/docs`
上提供其交互式 API 文档。在本地开发中，打开`http://localhost:3001/docs`。 REST 端点使用 `/api/v1` 基本路径。

对于部署，请使用外部可访问的 API 源和反向代理配置的路径。例如，如果 API 服务器在 `https://repovio.example.com`
处公开，则其文档可以在 `https://repovio.example.com/docs`
处公开。 Web应用程序不会自动代理此路由；如果您想公开它，请显式配置您的代理。 `/api/v1/docs` 不是文档路径。

安装的参考描述了正在运行的应用程序。从该交互式参考发出的请求使用您的实例，并且需要为每个操作记录的身份验证和权限。有关登录和帐户配置，请参阅
[验证](/docs/next/authentication)。 MCP 访问令牌适用于 [MCP 客户](/docs/next/mcp)，而不是一般的 REST 不记名令牌。

<a id="static-release-reference"></a>

## 静态释放参考

本网站上的 [API参考](/docs/next/api-reference)
是根据所选版本的确切应用程序版本生成的只读快照。它不需要运行Repovio实例，并且不发送API请求。选择与您的安装相匹配的版本；已安装的
`/docs` 页面对于您正在运行的构建仍然具有权威性。

按方法、路径或描述搜索，检查参数和响应架构，或从参考页面下载完整的 OpenAPI
JSON。模式标识符和 API 描述保留生成合约的语言。
