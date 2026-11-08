---
title: '浏览器推送'
description: '启用每个设备的通知并了解服务器和浏览器要求。'
---

> 存档源快照。产品标签使用Repovio。使用此版本标记部署文件中的配置标识符和容器引用，保持不变。

<a id="server-requirements"></a>

## 服务器要求

浏览器推送是本机传输，不使用 Apprise。部署操作员配置所有三个设置：

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

使用 `npx web-push generate-vapid-keys` 生成 VAPID 密钥对。主题是 `mailto:` 或 `https:`
URI。保密私钥。如果没有完整配置，浏览器推送会显示为不可用。使用安全的浏览器上下文以及支持 Service Worker 和 Push
API 的浏览器。

<a id="enable-or-disable-this-device"></a>

## 启用或禁用该设备

使用**在此设备上启用**并在请求时授予浏览器的通知权限。订阅属于当前用户和浏览器。管理员在浏览器推送通道中选择接收用户；每个接收者都需要一个启用的设备。拒绝浏览器权限会阻止订阅；调整网站的浏览器权限并根据需要重试。在发送测试之前检查可用性/设备数量和报告的错误。

禁用推送会删除该设备的订阅，而不是其他设备。端点和密钥使用非秘密指纹进行加密和重复数据删除。 HTTP
404/410 响应会删除过期的订阅。浏览器不可用、服务器配置缺失、权限被拒绝或订阅请求失败需要修复相应原因；仅刷新无法授予浏览器权限。请参阅
[通知发送历史](/docs/v1.0/notification-history) 进行尝试。
