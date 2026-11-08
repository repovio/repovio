---
title: '密码'
description: '更改本地密码并了解会话失效和恢复。'
---

<a id="change-a-password"></a>

## 更改密码

对于本地帐户，请打开
**设置 → 常规 → 更改密码**。输入当前密码、12 至 256 个字符的新密码以及匹配确认。提交一次，等待完成。无效的当前密码、短密码或不匹配的确认必须在重试之前更正。

成功的更改会返回当前浏览器的替换令牌，并使帐户的其他现有会话无效。其他设备必须使用新密码重新登录。这仅更改 Repovio 帐户，而不更改提供商 PAT、OAuth 凭证、通知凭证或 MCP 令牌配置。

<a id="oidc-and-forgotten-passwords"></a>

## OIDC 和忘记密码

OIDC 管理的帐户没有本地密码形式。更改该提供商的身份提供商密码。 Repovio 故意没有基于电子邮件的重置流程。部署操作员可以使用记录的
[本地恢复命令](/docs/next/authentication#reset-a-forgotten-password)；它拒绝 OIDC 帐户并使现有会话无效。切勿将替换密码放入 shell 历史记录或问题报告中。

<a id="local-user-and-group-management"></a>

## 创建和重置本地账户

本地账户行的重置密码操作允许系统管理员在不知道旧密码时设置新密码。输入并确认密码。旧 JWT 会话失效，重置自己的账户会退出登录。OIDC 账户没有该操作。MCP 令牌不被撤销。

[本地访问组](/docs/next/users#local-access-groups)
