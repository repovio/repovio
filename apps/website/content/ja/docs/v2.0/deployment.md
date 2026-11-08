---
title: 'Repovio のデプロイ'
description: 'Repovio の実稼働展開、TLS プロキシ、バックアップ、復元、アップグレード、ロールバックのガイダンス。'
---

RepovioCompose スタックが開始されます PostgreSQL、Prisma 移行を一度適用してから、API と Web アプリケーションを開始します。 TLS は終了しません。 Web サービスと API サービスを、パブリック ホスト名と証明書を所有するリバース プロキシの背後に配置します。

<a id="prerequisites"></a>

## 前提条件

- Docker Compose v2 を使用した Docker エンジン。
- パブリック ホスト名の DNS レコード。
- TLS 証明書を取得および更新するリバース プロキシ。
- 導入管理者のみが読み取り可能なプライベート サーバー ディレクトリ。

Compose スタックは存続します PostgreSQL 正規化されたユーザープロフィール写真を含むデータを、その名前付きファイルに保存します。
`repovio-postgres` 音量。意図的にすべてを削除する場合を除き、このボリュームを削除しないでください。 Repovio データ。

<a id="first-deployment"></a>

## 最初の展開

### ステップ 1: リリースされたものを確認する Repovio バージョンを確認し、プライベート環境ファイルを作成します。

```bash
cp .env.example .env
chmod 600 .env
```

### ステップ 2: すべてのプレースホルダーを置き換えます `.env`、 特に `POSTGRES_PASSWORD`、両方のデータベース URL、 `AUTH_JWT_SECRET`、 そして

`TOKEN_ENCRYPTION_KEY`。以下を使用して暗号化キーを生成します。

```bash
openssl rand -base64 32
```

### ステップ 3: 外部から見える URL を設定します。デプロイメントの場合、 `https://repovio.example.com`、 使用：

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### ステップ 4: リバース プロキシが同じホスト上で実行されている場合、コンテナ ポートをループバックにバインドします。

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

それ以外の場合は、ホスト ファイアウォールを使用してポート 3000 および 3001 へのアクセスを制限します。決して暴露しないでください PostgreSQL 容器。

### ステップ 5: 設定する `REPOVIO_VERSION` で `.env` 正確にリリースされたイメージ ペアに設定し、スタックを開始します。

```bash
docker compose pull
docker compose up --detach --wait
```

その値を保持しておいてください `.env`
したがって、以降のすべての Compose コマンドは同じ API と Web バージョンを使用します。

### ステップ 6: API 正常性エンドポイントをローカルで確認します。

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### ステップ 7: 一般に公開する Repovio URL を入力して、 [初回実行の 1 回限りのセットアップ](/docs/v2.0/authentication) 最初のものを作成する

システム管理者。

<a id="reverse-proxy-and-tls"></a>

## リバースプロキシとTLS

パブリック Web オリジンをポート 3000 にプロキシし、API および Socket.IO パスをポート 3001 にプロキシします。たとえば、Caddy サイト ブロックは次のものを使用できます。

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

プロキシは、HTTP を HTTPS にリダイレクトし、ローカル ポリシーに従ってアップストリーム接続を検証し、パブリック ホスト名を保存する必要があります。設定する OAuth 同じ HTTPS コールバック URL が設定されているプロバイダー
`OAUTH_CALLBACK_URL`。

<a id="upgrading"></a>

## アップグレード中

<a id="migrating-an-earlier-installation"></a>

### 以前のインストールの移行

フォローしてください [ブランドのアップグレード](/docs/v2.0/branding-upgrade)
名前を変更したスタックを開始する前に。セット `REPOVIO_POSTGRES_VOLUME`
正確な既存のボリューム名に変更します。データベースの資格情報と暗号化キーを保存します。ブランド化のためにデータベースのコピーやリセットは必要ありません。

### ステップ 1: イメージを変更する前に、データベースのバックアップを作成して確認します。

### ステップ 2: 設定する `REPOVIO_VERSION` 正確なリリースバージョンに `.env`。

### ステップ 3: リリースを引っ張って適用します。

```bash
docker compose pull
docker compose up --detach --wait
```

の `migrate` サービスは、API が開始される前に保留中の Prisma 移行を適用します。更新するたびに検査してください。

```bash
docker compose logs migrate
```

### ステップ 4: 更新が完了したと判断する前に、正常性エンドポイントとプロキシが提供するダッシュボードを確認します。

<a id="database-backup"></a>

## データベースのバックアップ

展開ディレクトリからバックアップを実行します。これは、 PostgreSQL 資格情報を印刷したりコマンドラインに入力したりせずに、カスタム形式のダンプをホストに送信します。

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

暗号化されたコピーをオフホストに保存し、別のシステムで定期的に復元をテストします。

<a id="database-restore"></a>

## データベースの復元

復元すると、現在のデータベース オブジェクトが置き換えられます。まず新しいバックアップを作成し、ダウンタイムをスケジュールします。

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

その後、確認してください `docker compose logs migrate`
そして API ヘルスエンドポイント。互換性のあるソフトウェアによって作成されたダンプを復元する Repovio スキーマ変更をロールバックするときのバージョン。

<a id="rollback"></a>

## ロールバック

### ステップ 1: アップグレードが失敗する直前に作成されたバックアップを保持します。

### ステップ 2: 設定する `REPOVIO_VERSION` で `.env` 最後の正常なイメージバージョンに。

### ステップ 3: 実行 `docker compose pull` そして `docker compose up --detach --wait`。

### ステップ 4: 新しいリリースで互換性のないデータベースが移行された場合は、API と Web を停止し、互換性のあるバックアップを復元してから、

以前のイメージ バージョンを再度開始します。

`docker compose down --volumes`
を更新またはロールバック コマンドとして使用しないでください。指定された PostgreSQL ボリュームが削除されます。
