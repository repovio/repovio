---
title: 'MCP 访问'
description: '将标头可配置的 MCP 客户端连接到 Repovio 的权限感知只读工作流程工具。'
---

Repovio 在 `/mcp`
公开无状态模型上下文协议端点。它提供对经过身份验证的用户可能在 Repovio 中看到的相同存储库、工作流运行、失败队列、批准队列、摘要和趋势的只读访问。

MCP服务器读取本地Repovio数据库。它不会调用提供者突变 API、启动同步、批准工作流程或更改 Repovio 配置。

同一个 `/mcp` 端点支持 Codex 等旧版客户端使用的 `2025-06-18` 协议和现代 `2026-07-28` 协议。
旧版客户端先调用 `initialize`，再发送 `notifications/initialized`；现代客户端在每次请求中发送协议元数据。
两者提供相同的七个只读工具，并使用当前用户的 Bearer 令牌验证每次请求。每次请求使用新的服务器实例，不保留 MCP 会话。

<a id="create-an-access-token"></a>

## 创建访问令牌

打开 **设置**，选择**MCP 访问**
选项卡，然后创建命名令牌。到期时间是可选的。从创建对话框中复制完整的令牌，因为 Repovio 仅显示一次并仅存储其 SHA-256 哈希值。

撤销令牌将在下一个请求时生效。删除其用户也会删除令牌。对用户角色或存储库成员资格的更改会立即应用，因为每个请求都会解析数据库的当前授权。

<a id="configure-a-client"></a>

## 配置客户端

使用公共 Repovio 源，后跟 `/mcp` 并在授权标头中发送令牌：

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

第一个版本针对支持自定义 HTTP 标头的 MCP 客户端，例如编辑器和命令行客户端。它不提供 OAuth 发现，也不声明与需要 MCP
OAuth 流的主机兼容。

切勿将令牌放置在 URL、查询参数、跟踪的配置文件、shell 历史记录或日志中。首选客户端的秘密存储或未版本化的环境变量。

<a id="available-tools"></a>

## 可用工具

| 工具                     | 目的                                       |
| ------------------------ | ------------------------------------------ |
| `list_repositories`      | 列出可见的跟踪存储库。                     |
| `get_repository`         | 读取一个可见的跟踪存储库。                 |
| `list_workflow_runs`     | 查询标准化可见工作流程运行。               |
| `list_needs_attention`   | 列出最新终端运行失败的工作流上下文。       |
| `list_awaiting_approval` | 列出等待提供商批准的当前可见运行。         |
| `get_dashboard_summary`  | 总结包含时间范围内可见的工作流程运行状况。 |
| `get_workflow_trend`     | 聚合可见的成功和失败趋势桶。               |

列表工具默认每页 25 个结果，最多接受 100 个。工具输出包含结构化 JSON 和匹配的文本表示形式。日期使用 ISO 8601 UTC 值。

服务器有意不通告 MCP 资源、提示、任务、订阅、提供程序操作或配置工具。

<a id="reverse-proxy-requirements"></a>

## 反向代理要求

- 将 `POST /mcp` 转发到 API 容器，而不将其重写为 `/api/v1/mcp`。
- 转发 `Authorization`、`Origin`、`Content-Type`、`Accept`、`MCP-Protocol-Version`、`Mcp-Method` 和 `Mcp-Name`。
- 在反向代理中使用 TLS，并且不记录授权标头或请求查询字符串。
- 将每个允许的浏览器源添加到 `CORS_ORIGIN`。本机客户端仍支持不带 `Origin` 标头的请求；当前来源必须与配置的允许列表匹配。

<a id="token-administration"></a>

## 代币管理

用户在“设置”下的“**MCP 访问**”选项卡中管理自己的令牌。系统管理员可以检查安全令牌元数据并从用户页面撤销令牌，但无法检索其哈希值或纯文本机密，也无法代表其他用户创建令牌。

<a id="manage-token-states"></a>

## 管理代币状态

令牌列表显示名称、状态、安全前缀、创建/上次使用的时间戳和可选的到期时间。名称最多可以包含 100 个字符。撤销需要确认。已撤销或过期的令牌无法验证未来的请求。空列表意味着该用户不存在令牌；加载错误会提供重试。在关闭一次性显示之前复制完整的新令牌。管理员令牌对话框仅允许列出/撤销，而不允许为其他用户创建。
