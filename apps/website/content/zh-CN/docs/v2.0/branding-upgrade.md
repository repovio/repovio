---
title: 'Repovio品牌升级'
description: '移动到 Repovio 名称时保留数据库数据和凭据。'
---

此重命名是一项重大配置更改。将每个以前以产品为前缀的环境变量更新为 `REPOVIO_` 前缀，包括
`REPOVIO_ENV_FILE`、`REPOVIO_VERSION`、`REPOVIO_API_PORT` 和
`REPOVIO_WEB_PORT`。使用`ghcr.io/repovio/repovio-api`和`ghcr.io/repovio/repovio-web`下的API和Web图像。

先在之前的 PostgreSQL 17 版本上完成品牌更名。当前 Compose 配置使用 PostgreSQL
18；使用前请完成[独立的 PostgreSQL 18 升级](/docs/v2.0/postgresql-18-upgrade)。绝不要将 PostgreSQL
17 文件挂载到 PostgreSQL 18 服务。以下步骤使用保留的 PostgreSQL 17 配置，包括其 `compose.yml` 和
`compose.upgrade.yml`。品牌更名本身无需数据转换；PostgreSQL 主版本升级是另一项操作。

## 保留PostgreSQL数据

1. 更改部署之前，备份现有数据库并确认备份可以恢复。
2. 使用 `docker inspect <postgres-container>` 检查正在运行的 PostgreSQL 容器，并记录在 `/var/lib/postgresql/data`
   上安装的确切命名卷。停止旧应用程序和 PostgreSQL 容器而不删除卷。
3. 将新部署环境中的 `REPOVIO_POSTGRES_VOLUME` 设置为该确切的卷名称。使用 `docker volume inspect <recorded-volume>`
   确认其存在。新安装默认为`repovio-postgres`；它不能意外地替换现有安装的卷。4、保留`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`TOKEN_ENCRYPTION_KEY`、`AUTH_JWT_SECRET`不变。 使 PostgreSQL 保持相同的主要版本。开始前请私下查看`docker compose config`；它的输出包含已解析的秘密，并且绝不能共享或提交。5、使用`docker compose -f compose.yml -f compose.upgrade.yml`进行升级。此覆盖要求指定的卷存在，因此拼写错误的卷无法静默初始化空替换。首先启动PostgreSQL并验证现有数据库，然后启动迁移服务和应用程序。切勿在此重命名过程中运行
   `docker compose down --volumes`、删除旧卷或初始化空白数据库。

品牌不需要进行数据转换。数据库凭据和加密密钥对于读取现有数据仍然至关重要。可以使用其配置和保留卷来恢复以前的部署；避免并发作家。

## 身份验证和浏览器状态

默认的 JWT 颁发者现在是
`repovio`；升级后重新登录。还必须刻意更新显式配置的发行者。不会导入现有的浏览器首选项、通知状态、cookie 和存储密钥。再次选择您的语言/主题，如有必要，重新安装 PWA，然后重新启用浏览器通知。在适当的情况下更新身份提供商的显示名称和外部应用程序配置；回调路线不变。仅在确认新安装有效后才清除过时的站点数据。

撤销以前的 MCP 令牌并创建替换：故意不接受重命名的令牌前缀作为别名。
