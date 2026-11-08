---
title: '设置 GitHub App'
description: '注册并连接自己的 GitHub App，使用加密凭据和只读安装访问。'
---

<a id="register-app"></a>

## 注册应用

每个 Repovio 部署使用一个 GitHub.com App；PAT 和 OAuth 仍可使用。以账户或组织所有者身份打开 Settings、Developer
settings、GitHub Apps、New GitHub App。设置唯一名称和 Repovio 首页。跨账户安装选择 Any
account；私有应用只能安装到所属账户。此集成不需要 OAuth 客户端密钥、回调 URL 或设置 URL。

<a id="permissions-and-events"></a>

## 权限和事件

将下面的核心仓库权限设置为 Read-only；Metadata 读取权限自动授予。仅在需要且可用时添加可选安全权限。订阅列出的事件；GitHub 自动发送安装生命周期事件。即使应用具有写权限，Repovio 也只请求只读安装令牌。

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## 配置 Repovio

启用 Webhook 并使用下面的公共 HTTPS 地址。PUBLIC_URL 必须指向外部可访问的部署。生成至少 16 个字符的随机 Webhook 密钥，在 GitHub 和 Repovio 中填写相同值。在 GitHub 生成 RSA 私钥并下载 PEM 文件。在 Repovio 管理、提供商账户、GitHub
App 中填写 App
ID、slug、完整私钥和 Webhook 密钥，然后验证并保存。API 验证身份并将两个密钥加密保存到 PostgreSQL。妥善保管部署加密密钥；已保存的密钥不会返回浏览器。

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## 安装并连接

在 GitHub 安装应用，选择账户或组织以及所需仓库。返回 Repovio，刷新安装列表并连接目标账户。已连接或暂停的安装不能重复连接。列表来自已配置应用，不信任浏览器回调中的安装 ID。随后在仓库页面添加跟踪。安装令牌自动续期；初始导入和定期轮询补充 Webhook 同步。

如果名称与现有 PAT 或 OAuth 账户重复，请在连接前修改本地账户名称。

<a id="rotate-and-disconnect"></a>

## 轮换与断开

在 GitHub 生成新私钥并保存到 Repovio，确认同步成功后再删除旧私钥。同步更新两侧 Webhook 密钥；旧密钥签名立即失效。密钥字段留空会保留原值。更换应用身份或删除配置前，先删除关联提供商账户；这也会删除依赖的跟踪数据，请提前导出。删除本地配置不会卸载 GitHub 上的应用。

<a id="troubleshooting"></a>

## 故障排查

配置失败时检查 App
ID、slug 和 PEM 格式。签名失败时检查共享密钥、HTTPS 可达性及代理是否保留原始请求体。列表为空时检查仓库选择和读取权限并刷新。暂停或删除安装会保留历史数据；在 GitHub 恢复访问后刷新列表。缺少可选安全权限不会阻止其他同步。通过 Jobs 检查状态。Webhook 失败时仍会轮询。模拟测试不能验证真实 GitHub 安装；实时验证需要测试应用。

## 另请参阅

- [提供商账户](/docs/v2.0/provider-accounts)
- [提供商 OAuth 设置](/docs/v2.0/provider-oauth)
- [提供商 Webhook](/docs/v2.0/provider-webhooks)
