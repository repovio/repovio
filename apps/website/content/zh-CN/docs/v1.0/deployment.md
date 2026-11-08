---
title: '部署Repovio'
description: 'Repovio 的生产部署、TLS 代理、备份、恢复、升级和回滚指南。'
---

> 存档源快照。产品标签已标准化为 Repovio。对于此历史版本，使用其标记部署文件中的配置标识符和容器引用不变。

Repovio 的 Compose 堆栈启动 PostgreSQL，应用一次 Prisma 迁移，然后启动 API 和 Web 应用程序。它不会终止 TLS。将 Web 和 API 服务置于拥有公共主机名和证书的反向代理后面。

<a id="prerequisites"></a>

## 先决条件

- 带有 Docker Compose v2 的 Docker 引擎。
- 公共主机名的 DNS 记录。
- 获取并更新 TLS 证书的反向代理。
- 私有服务器目录只能由部署管理员读取。

Compose 堆栈将 PostgreSQL 数据（包括规范化的用户个人资料图片）保留在标记的 Compose 文件中配置的命名 PostgreSQL 卷中。除非您有意删除所有 Repovio 数据，否则请勿删除此卷。

<a id="first-deployment"></a>

## 第一次部署

### 步骤1：查看已发布的Repovio版本并创建私有环境文件：

```bash
cp .env.example .env
chmod 600 .env
```

### 步骤 2：替换 `.env` 中的每个占位符，尤其是 `POSTGRES_PASSWORD`、数据库 URL、`AUTH_JWT_SECRET` 和

`TOKEN_ENCRYPTION_KEY`。使用以下命令生成加密密钥：

```bash
openssl rand -base64 32
```

### 步骤 3：设置外部可见的 URL。对于 `https://repovio.example.com` 的部署，请使用：

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### 步骤4：当反向代理运行在同一主机上时，将容器端口绑定到环回：

使用该版本的 `.env.example` 中的 API 和 Web 端口变量，其值分别为 `127.0.0.1:3001` 和
`127.0.0.1:3000`。历史变量名称与当前 Repovio 版本不同。

否则，请使用主机防火墙限制对端口 3000 和 3001 的访问。切勿暴露 PostgreSQL 容器。

### 步骤 5：将 `.env` 中标记的 `.env.example` 中的发布选择变量设置为精确发布的图像对，然后启动堆栈：

```bash
docker compose pull
docker compose up --detach --wait
```

将该值保留在 `.env` 中，以便以后的每个 Compose 命令都使用相同的 API 和 Web 版本。

### 步骤 6：在本地确认 API 运行状况端点：

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### 步骤 7：打开公共 Repovio URL 并填写 [一次性首次运行设置](/docs/v1.0/authentication) 以创建第一个

系统管理员。

<a id="reverse-proxy-and-tls"></a>

## 反向代理和 TLS

将公共 Web 源代理到端口 3000，并将 API 和 Socket.IO 路径代理到端口 3001。例如，Caddy 站点块可以使用：

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

代理必须将 HTTP 重定向到 HTTPS，根据其本地策略验证上游连接，并保留公共主机名。使用 `OAUTH_CALLBACK_URL`
中设置的相同 HTTPS 回调 URL 配置 OAuth 提供程序。

<a id="upgrading"></a>

## 升级

使用此历史版本附带的确切配置和图像参考。当前的品牌升级说明仅在迁移到较新的 Repovio 版本时适用；切勿将重命名的配置标识符复制到旧的 Compose 文件中。

### 第 1 步：在更改映像之前创建并验证数据库备份。

### 步骤 2：将发布选择变量从标记的 `.env.example` 设置为 `.env` 中的确切发布版本。

### 步骤 3：拉动并应用释放：

```bash
docker compose pull
docker compose up --detach --wait
```

`migrate` 服务在 API 启动之前应用待处理的 Prisma 迁移。每次更新后检查它：

```bash
docker compose logs migrate
```

### 步骤 4：在考虑更新完成之前验证运行状况端点和代理服务的仪表板。

<a id="database-backup"></a>

## 数据库备份

从部署目录运行备份。这会将 PostgreSQL 自定义格式转储写入主机，而无需打印凭据或将其放入命令行中：

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

将加密副本存储在主机之外，并定期在单独的系统上测试恢复。

<a id="database-restore"></a>

## 数据库恢复

恢复替换当前数据库对象。首先进行新的备份并安排停机时间。

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

然后，检查 `docker compose logs migrate` 和 API 运行状况端点。回滚架构更改时，还原由兼容的 Repovio 版本生成的转储。

<a id="rollback"></a>

## 回滚

### 步骤 1：保留升级失败之前所做的备份。

### 步骤 2：将发布选择变量从 `.env` 中标记的 `.env.example` 设置为最后一个已知良好的映像版本。

### 步骤 3：运行 `docker compose pull` 和 `docker compose up --detach --wait`。

### 步骤4：如果新版本迁移数据库不兼容，请停止API和Web，恢复兼容的备份，然后

再次启动之前的镜像版本。

切勿使用 `docker compose down --volumes` 作为更新或回滚命令：它会删除指定的 PostgreSQL 卷。
