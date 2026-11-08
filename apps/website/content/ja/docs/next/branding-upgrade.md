---
title: 'Repovio ブランドのアップグレード'
description: 'Repovio 名に移動するときに、データベース データと資格情報を保持します。'
---

この名前変更は破壊的な構成変更です。以前の製品接頭辞が付いたすべての環境変数を、`REPOVIO_ENV_FILE`、`REPOVIO_VERSION`、`REPOVIO_API_PORT`、`REPOVIO_WEB_PORT`
など、`REPOVIO_` 接頭辞に更新します。 `ghcr.io/repovio/repovio-api` および `ghcr.io/repovio/repovio-web`
の API と Web イメージを使用します。

先に以前の PostgreSQL 17 リリースで名前変更を完了してください。現在の Compose 設定は PostgreSQL
18 用です。使用前に[別途 PostgreSQL 18 へのアップグレード](/docs/next/postgresql-18-upgrade)を行ってください。PostgreSQL
17 のファイルを PostgreSQL 18 サービスにマウントしてはいけません。以下は保存した PostgreSQL 17 の設定で、`compose.yml`
と `compose.upgrade.yml` を含みます。名前変更だけでは変換不要ですが、メジャーバージョンの更新は別の操作です。

## PostgreSQL データを保存する

1. 既存のデータベースをバックアップし、展開を変更する前にバックアップを復元できることを確認します。
2. 実行中の PostgreSQL コンテナを `docker inspect <postgres-container>` で検査し、`/var/lib/postgresql/data`
   にマウントされた正確な名前付きボリュームを記録します。ボリュームを削除せずに、古いアプリケーションと PostgreSQL コンテナを停止します。
3. 新しいデプロイメント環境の `REPOVIO_POSTGRES_VOLUME` をその正確なボリューム名に設定します。
   `docker volume inspect <recorded-volume>` を使用して存在することを確認します。新規インストールのデフォルトは
   `repovio-postgres` です。既存のインストールのボリュームを誤って置き換えてはなりません。
4. `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`TOKEN_ENCRYPTION_KEY`、および `AUTH_JWT_SECRET`
   を変更しないでください。 PostgreSQL を同じメジャー バージョンに保ちます。開始する前に、`docker compose config`
   を非公開で確認してください。その出力には解決されたシークレットが含まれており、決して共有したりコミットしたりしてはなりません。
5. アップグレードには `docker compose -f compose.yml -f compose.upgrade.yml`
   を使用します。このオーバーライドでは名前付きボリュームが存在する必要があるため、ボリュームのスペルが間違っていても、空の代替ボリュームをサイレントに初期化することはできません。まず PostgreSQL を起動し、既存のデータベースを確認してから、移行サービスとアプリケーションを開始します。この名前変更の一環として、`docker compose down --volumes`
   を実行したり、古いボリュームを削除したり、空のデータベースを初期化したりしないでください。

ブランド化によるデータ変換は必要ありません。データベースの資格情報と暗号化キーは、既存のデータを読み取るために引き続き不可欠です。以前の展開は、その構成と保持されたボリュームを使用して復元できます。同時ライターを避けてください。

## 認証とブラウザの状態

デフォルトの JWT 発行者は `repovio`
になりました。アップグレード後に再度サインインしてください。明示的に構成された発行者も意図的に更新する必要があります。既存のブラウザ設定、通知状態、Cookie、およびストレージ キーはインポートされません。言語/テーマを再度選択し、必要に応じて PWA を再インストールし、ブラウザ通知を再度有効にします。必要に応じて、アイデンティティ プロバイダーの表示名と外部アプリケーション構成を更新します。コールバック ルートは変更されません。古いサイト データは、新しいインストールが機能することを確認した後にのみ消去してください。

以前の MCP トークンを取り消し、代わりのトークンを作成します。名前が変更されたトークン プレフィックスは、意図的にエイリアスとして受け入れられません。
