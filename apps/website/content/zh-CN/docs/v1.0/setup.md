---
title: '首次运行设置'
description: '创建第一个本地管理员并了解一次性设置。'
---

> 存档源快照。产品标签使用Repovio。使用此版本标记部署文件中的配置标识符和容器引用，保持不变。

<a id="before-setup"></a>

## 设置之前

使用 [部署](/docs/v1.0/deployment)
部署 API、Web 应用程序和 PostgreSQL。打开安装网址。当不存在用户时，Repovio 将浏览器定向到
`/auth/setup`。现有安装保留其帐户并改为开放登录。安装程序创建本地 Repovio 帐户，而不是提供商帐户。

<a id="create-the-administrator"></a>

## 创建管理员

输入可选的名字和姓氏、唯一的用户名、密码和密码确认。密码至少需要 12 个字符。提交一次设置表格并等待请求；成功设置登录第一个系统管理员。验证错误使表格可供更正。如果其他操作员先完成设置，请使用现有帐户继续
[登入](/docs/v1.0/sign-in)。

<a id="continue-configuration"></a>

## 继续配置

连接[提供商帐户](/docs/v1.0/provider-accounts)，选择[存储库](/docs/v1.0/repositories)，检查[同步作业](/docs/v1.0/guide-jobs)。可以通过受保护的API创建本地用户；用户页面列出帐户并管理删除和 MCP 访问。或者为身份提供商管理的帐户配置
[OIDC](/docs/v1.0/authentication)。新的非管理员需要明确的存储库成员身份。

如果设置失败，请检查 API/数据库可用性和部署日志，而无需发布凭据。不要重置数据库来重复设置。请参阅
[密码恢复](/docs/v1.0/authentication#reset-a-forgotten-password) 了解现有本地管理员。
