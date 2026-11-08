---
title: 将 PostgreSQL 17 升级至 18
description: 将数据迁移到独立的新 PostgreSQL 18 卷并验证恢复结果。
---

当前 Compose 栈使用 `postgres:18-alpine`，并将命名卷挂载到 `/var/lib/postgresql`。PostgreSQL
18 将集群存储在版本专属子目录中，不能直接使用 PostgreSQL
17 的数据文件。参阅[官方镜像文档](https://hub.docker.com/_/postgres)。

本流程创建应用数据库转储，并将其恢复到**独立的新卷**，需要维护窗口。不要与[品牌更名](/docs/v2.0/branding-upgrade)同时进行；先在之前的 PostgreSQL
17 版本上完成更名。更新源码不会自动执行生产数据库迁移。

<a id="before-maintenance"></a>

## 维护前准备

- 保留旧版本的完整配置、`.env` 和准确的 PostgreSQL
  17 卷名。将 Compose 文件保留在旧版本目录，以正确解析相对绑定挂载和环境文件路径。
- 保持 `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`TOKEN_ENCRYPTION_KEY` 和 `AUTH_JWT_SECRET`
  不变。此密钥用于解密现有的提供商和通知凭据。
- 为转储、旧卷和新卷预留足够空间。将备份和 `.env` 作为秘密保护。
- 此流程假定使用 Repovio 的单一数据库角色。维护前单独清点自定义角色、授权、扩展和额外数据库；不要假设应用转储也备份了它们。
- 使用一次性副本演练恢复和验证。`pnpm test:postgres-upgrade` 使用真实应用迁移和纯合成数据，不验证具体部署的备份。

<a id="stop-writers-and-back-up-postgresql-17"></a>

## 停止写入并备份 PostgreSQL 17

在**旧版本目录**中使用其 PostgreSQL 17
Compose 配置运行以下命令。同时停止其他外部写入进程。在恢复和验证全部完成前不要启动新应用。

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

私下记录基准数量。通过实际恢复验证转储，不能只检查文件大小。保留旧卷和旧配置。绝不要执行 `docker compose down --volumes`
或删除任何一个数据卷。

<a id="restore-into-postgresql-18"></a>

## 恢复到 PostgreSQL 18

在**新版本目录**中保留相同的凭据和密钥。将 `backup` 设置为上述备份的绝对路径。选择唯一的新卷名，将其保存为新 `.env` 中的
`REPOVIO_POSTGRES_VOLUME`，必须与 PostgreSQL 17 卷名不同。使用外部卷覆盖配置以拒绝拼写错误或不存在的卷名。

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

必须使用真正全新且为空的卷；如果名称已存在，请另选名称，不要复用未知数据。入口脚本拒绝旧数据布局，包括错误挂载到新根目录的 PostgreSQL
17 卷；不会转换数据。若恢复失败，保留转储和旧卷，调查错误并换另一个全新空卷重试。不要反复向部分恢复的数据库导入。

比较基准数量和有代表性的关联。验证登录、权限、通知配置，以及使用保留密钥解密凭据。私下检查 API 健康状态和日志。重启 PostgreSQL
18，在维护结束前确认数据仍然存在。经过测试的默认数据目录为 `/var/lib/postgresql/18/docker`。

<a id="recovery"></a>

## 恢复旧版本

新应用产生写入之前，可以停止新栈，以原始 PostgreSQL
17 卷和配置重启完整旧版本。绝不要让两套应用同时写入。保留新卷用于诊断；PostgreSQL 17 绝不能打开 PostgreSQL 18 数据文件。

产生新写入后，旧卷已过时；返回旧卷会丢失这些写入。应先规划数据协调或经单独测试的恢复方案。将 PostgreSQL
18 转储恢复到 17 并非可靠的降级保证。在操作员明确结束恢复窗口之前，保留两个卷和所有备份。

<a id="disposable-verification"></a>

## 使用临时资源验证

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

测试创建名称唯一的容器、网络和卷；在两个主版本上执行真实 Prisma 迁移；验证首次初始化和影子数据库创建；拒绝错误挂载的旧卷；恢复转储；比较所有公共表；解密合成凭据；验证重启持久性及旧数据未变。清理仅删除测试创建的资源，不使用现有容器、卷、数据库或凭据。设置
`REPOVIO_TEST_API_IMAGE` 可使用其他本地构建的应用镜像。
