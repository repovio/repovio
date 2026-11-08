---
title: PostgreSQL 17 から 18 へのアップグレード
description: 独立した新しい PostgreSQL 18 ボリュームにデータを移し、復元を検証します。
---

現在の Compose スタックは `postgres:18-alpine` を使用し、名前付きボリュームを `/var/lib/postgresql`
にマウントします。PostgreSQL 18 はバージョン固有のサブディレクトリにクラスタを保存します。PostgreSQL
17 のファイルはそのまま使用できません。[公式イメージの説明](https://hub.docker.com/_/postgres)を参照してください。

この手順ではアプリケーションのデータベースダンプを作成し、**独立した新しいボリューム**へ復元します。メンテナンス時間が必要です。[ブランド名変更](/docs/next/branding-upgrade)とは同時に実施せず、先に以前の PostgreSQL
17 リリースで名前変更を完了してください。ソース更新で本番移行が自動実行されることはありません。

<a id="before-maintenance"></a>

## メンテナンス前の準備

- 以前のリリースの設定一式、`.env`、正確な PostgreSQL
  17 ボリューム名を保存してください。相対バインドマウントや環境ファイルが正しく解決されるよう、Compose ファイルを旧リリースのディレクトリに残します。
- `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`TOKEN_ENCRYPTION_KEY`、`AUTH_JWT_SECRET`
  を変更しないでください。鍵は既存のプロバイダーと通知の認証情報の復号に必要です。
- ダンプと新旧ボリュームの空き容量を確保します。バックアップと `.env` は機密情報として保護します。
- Repovio の単一データベースロールを前提とします。独自のロール、権限、拡張機能、追加データベースを別途確認してください。アプリケーションのダンプに含まれるとは限りません。
- 使い捨てコピーで復元と検証を練習します。`pnpm test:postgres-upgrade`
  は実際の移行と合成データだけを使い、個々の環境のバックアップを検証しません。

<a id="stop-writers-and-back-up-postgresql-17"></a>

## 書き込み停止と PostgreSQL 17 のバックアップ

**以前のリリースのディレクトリ**で、その PostgreSQL 17
Compose 設定を使って実行します。外部の書き込み処理も停止します。復元と検証が終わるまで新しいアプリケーションを起動しないでください。

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

基準件数を非公開で記録します。サイズ確認だけでなく実際の復元でダンプを検証します。旧ボリュームと設定を保存してください。`docker compose down --volumes`
の実行や、どちらかのデータボリュームの削除は厳禁です。

<a id="restore-into-postgresql-18"></a>

## PostgreSQL 18 への復元

**新しいリリースのディレクトリ**でも認証情報と鍵を保持します。`backup`
にバックアップの絶対パスを指定します。固有の新しいボリューム名を選び、新しい `.env` の `REPOVIO_POSTGRES_VOLUME`
に保存します。PostgreSQL
17 の名前とは異なる必要があります。外部ボリュームの上書き設定で誤記や存在しない名前を拒否します。

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

本当に新しい空のボリュームを使用します。名前が既に存在する場合は別の名前にしてください。エントリーポイントは新しいルートに誤ってマウントされた PostgreSQL
17 ボリュームを含め、旧データ配置を拒否し、変換は行いません。復元失敗時はダンプと旧ボリュームを残して原因を調査し、別の新しい空ボリュームで再試行します。途中まで復元したデータベースへの繰り返し復元は避けてください。

基準件数と代表的な関連を比較します。ログイン、権限、通知設定、保持した鍵による復号を検証します。API の正常性とログを非公開で確認します。PostgreSQL
18 を再起動してデータの保持を確認してからメンテナンスを終了します。検証済みの既定ディレクトリは
`/var/lib/postgresql/18/docker` です。

<a id="recovery"></a>

## 以前の状態への復旧

新しい書き込みが始まる前なら、新スタックを停止し、元の PostgreSQL
17 ボリュームと設定で以前の完全なリリースを再起動できます。両方のスタックから同時に書き込ませないでください。新ボリュームは診断用に保存します。PostgreSQL
17 で PostgreSQL 18 のデータファイルを開いてはいけません。

新しい書き込み後は旧ボリュームが古くなり、戻すと追加の書き込みが失われます。先にデータの整合処理か別途検証済みの復旧を計画します。PostgreSQL
18 のダンプを 17 へ戻せる保証はありません。運用担当者が復旧期間の終了を明示するまで、両方のボリュームとバックアップを保持します。

<a id="disposable-verification"></a>

## 使い捨てリソースでの検証

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

テストは固有名のコンテナ、ネットワーク、ボリュームを作成し、両メジャーバージョンで実際の Prisma 移行を適用します。新規初期化、シャドウデータベース作成、不正な旧ボリュームの拒否、ダンプ復元、全公開テーブルの比較、合成認証情報の復号、再起動後の保持、旧データの不変性を確認します。削除するのはテスト自身のリソースだけです。既存のコンテナ、ボリューム、データベース、認証情報は使用しません。別のローカルビルドイメージには
`REPOVIO_TEST_API_IMAGE` を指定します。
