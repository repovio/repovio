---
title: 'Repovio のデプロイ'
description: 'Repovio の実稼働展開、TLS プロキシ、バックアップ、復元、アップグレード、ロールバックのガイダンス。'
---

> アーカイブされたソース スナップショット。製品ラベルは Repovio に正規化されています。この履歴リリースでは、タグ付けされたデプロイメント ファイルからの構成識別子とコンテナー参照を変更せずに使用します。

Repovio の Compose スタックは PostgreSQL を開始し、Prisma 移行を 1 回適用してから、API と Web アプリケーションを開始します。 TLS は終了しません。 Web サービスと API サービスを、パブリック ホスト名と証明書を所有するリバース プロキシの背後に配置します。

<a id="prerequisites"></a>

## 前提条件

- Docker Compose v2 を使用した Docker エンジン。
- パブリック ホスト名の DNS レコード。
- TLS 証明書を取得および更新するリバース プロキシ。
- 導入管理者のみが読み取り可能なプライベート サーバー ディレクトリ。

Compose スタックは、正規化されたユーザー プロファイル画像を含む PostgreSQL データを、タグ付き Compose ファイル内で構成された名前付き PostgreSQL ボリュームに保持します。意図的にすべての Repovio データを削除する場合を除き、このボリュームを削除しないでください。

<a id="first-deployment"></a>

## 最初の展開

### ステップ 1: リリースされた Repovio バージョンをチェックアウトし、プライベート環境ファイルを作成します。

```bash
cp .env.example .env
chmod 600 .env
```

### ステップ 2: `.env` のすべてのプレースホルダー、特に `POSTGRES_PASSWORD`、両方のデータベース URL、`AUTH_JWT_SECRET`、および

`TOKEN_ENCRYPTION_KEY`。以下を使用して暗号化キーを生成します。

```bash
openssl rand -base64 32
```

### ステップ 3: 外部から見える URL を設定します。 `https://repovio.example.com` でのデプロイメントの場合は、次を使用します。

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### ステップ 4: リバース プロキシが同じホスト上で実行されている場合、コンテナ ポートをループバックにバインドします。

リリースの `.env.example` の API 変数と Web ポート変数をそれぞれ値 `127.0.0.1:3001` と `127.0.0.1:3000`
で使用します。履歴変数名は、現在の Repovio リリースとは異なります。

それ以外の場合は、ホスト ファイアウォールを使用してポート 3000 および 3001 へのアクセスを制限します。 PostgreSQL コンテナは決して公開しないでください。

### ステップ 5: `.env` 内のタグ付き `.env.example` からリリース選択変数を正確なリリース済みイメージ ペアに設定し、スタックを開始します。

```bash
docker compose pull
docker compose up --detach --wait
```

以降のすべての Compose コマンドで同じ API と Web バージョンが使用されるように、その値を `.env` に保持します。

### ステップ 6: API 正常性エンドポイントをローカルで確認します。

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### ステップ 7: パブリック Repovio URL を開き、[初回実行の 1 回限りのセットアップ](/docs/v1.0/authentication) を入力して最初の URL を作成します

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

プロキシは、HTTP を HTTPS にリダイレクトし、ローカル ポリシーに従ってアップストリーム接続を検証し、パブリック ホスト名を保存する必要があります。
`OAUTH_CALLBACK_URL` に設定された同じ HTTPS コールバック URL を使用して OAuth プロバイダーを構成します。

<a id="upgrading"></a>

## アップグレード中

この過去のリリースに同梱されている正確な構成とイメージ参照を使用してください。現在のブランドのアップグレード手順は、新しい Repovio リリースに移行する場合にのみ適用されます。名前を変更した構成識別子を古い Compose ファイルにコピーしないでください。

### ステップ 1: イメージを変更する前に、データベースのバックアップを作成して確認します。

### ステップ 2: タグ付き `.env.example` のリリース選択変数を、`.env` の正確なリリース バージョンに設定します。

### ステップ 3: リリースを引っ張って適用します。

```bash
docker compose pull
docker compose up --detach --wait
```

`migrate` サービスは、API が開始される前に保留中の Prisma 移行を適用します。更新するたびに検査してください。

```bash
docker compose logs migrate
```

### ステップ 4: 更新が完了したと判断する前に、正常性エンドポイントとプロキシが提供するダッシュボードを確認します。

<a id="database-backup"></a>

## データベースのバックアップ

展開ディレクトリからバックアップを実行します。これにより、認証情報を出力したりコマンド ラインに入力したりせずに、PostgreSQL カスタム形式のダンプがホストに書き込まれます。

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

その後、`docker compose logs migrate`
と API 健全性エンドポイントを確認します。スキーマ変更をロールバックするときに、互換性のある Repovio バージョンによって作成されたダンプを復元します。

<a id="rollback"></a>

## ロールバック

### ステップ 1: アップグレードが失敗する直前に作成されたバックアップを保持します。

### ステップ 2: リリース選択変数を、`.env` 内のタグ付き `.env.example` から、既知の正常な最後のイメージ バージョンに設定します。

### ステップ 3: `docker compose pull` および `docker compose up --detach --wait` を実行します。

### ステップ 4: 新しいリリースで互換性のないデータベースが移行された場合は、API と Web を停止し、互換性のあるバックアップを復元してから、

以前のイメージ バージョンを再度開始します。

`docker compose down --volumes`
を更新またはロールバック コマンドとして使用しないでください。指定された PostgreSQL ボリュームが削除されます。
