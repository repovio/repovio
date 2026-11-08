---
title: 'リポジトリ Webhook のセットアップ'
description: 'GitHub、GitLab、Forgejo、および Gitea リポジトリの署名付き読み取り専用 Webhook を構成します。'
---

このページの PAT/OAuth 手順ではリポジトリごとの Webhook を使用します。GitHub
App 接続では中央の Webhook を一つ使用し、専用ダイアログで設定します。

Repovio は、署名付き Webhook を受信して​​、通常のポーリング間隔より早く追跡対象リポジトリを同期できます。プロバイダー API を介して Webhook を作成、更新、削除、テストすることはありません。管理者は、GitHub、GitLab、Forgejo、または Gitea ですべてのリポジトリ Webhook を手動で構成します。

**リポジトリ** を開き、追跡対象のリポジトリを選択し、その**リポジトリ Webhook**
カードを使用します。このカードは、リポジトリ固有のコールバック URL を表示し、署名シークレットを生成または受け入れ、最後に受け入れられた配信を報告します。 Repovio がその構成をプロバイダーに送信することはありません。

Webhook は最適化であり、真実の情報源ではありません。署名されたペイロードは、コールバック URL によって選択されたリポジトリを識別する必要があります。次に、Repovio は、構成された読み取り専用プロバイダー アダプターを通じて現在のデータを読み取ります。受け入れられた配信は、永続的なリポジトリ同期のキューに入れられます。 15 秒以内に受信した配信は結合されます。デフォルトのフォールバック ポーリング間隔は 30 分です。

<a id="configure-a-repository-webhook"></a>

## リポジトリ Webhook を構成する

1. リポジトリを Repovio に追加し、その **リポジトリ Webhook** カードを開きます。
2. コールバック URL をコピーします。
3. 一意の高エントロピー署名シークレットを生成するか、プロバイダーから提供された正確な署名トークンを貼り付けます。アクセス トークンや別のリポジトリのシークレットを再利用しないでください。
4. シークレットを保存します。 Repovio は AES-256-GCM で暗号化し、API を通じて返すことはありません。
5. リポジトリのプロバイダー設定でコールバック URL とシークレットを構成します。
6. TLS 検証を有効にしたまま、テスト配信を送信します。

安定したコールバックは `/api/webhooks/<provider>/<repository-id>` を使用します。バージョン管理された
`/api/v1/webhooks/<provider>/<repository-id>` コールバックも使用できます。 Repovio
0.2.9 以前のプロバイダー アカウント コールバック URL は受け入れられなくなりました。アップグレード後、リポジトリ コールバックと新しいリポジトリ シークレットを使用してすべての Webhook を再作成します。

配信が成功すると、HTTP `202` と `{ "accepted": true }`
が返されます。プロバイダー配信 ID が繰り返されると、`{ "accepted": true, "duplicate": true }`
が返され、別の同期はキューに入れられません。不明または無効なリポジトリ、無効なプロバイダー アカウント、シークレットの欠落、無効な署名、プロバイダー リポジトリ ID の不一致、配信 ID の欠落は、構成の詳細を公開することなく拒否されます。

キューに入れられた同期は API の再起動後も存続します。複数のインスタンスはデータベース リースを使用し、同じプロバイダー アカウントを同時に同期しません。レート制限ヘッダーは影響を受けるアカウントの作業を遅らせますが、制限付き再試行は一時的なエラーを処理します。

<a id="github-actions"></a>

## GitHub アクション

1. リポジトリの **設定 → Webhook** を開き、**Webhook の追加** を選択します。
2. ペイロード URL として `https://repovio.example.com/api/webhooks/github/<repository-id>` を使用します。
3. `application/json` を選択し、リポジトリのシークレットを貼り付け、**ワークフローの実行**
   (`workflow_run`) をサブスクライブします。
4. SSL 検証を有効のままにし、Webhook を保存します。

Repovio は、生の本体に対して `X-Hub-Signature-256` を検証し、冪等性のために `X-GitHub-Delivery`
を使用します。 GitHubの[Webhook イベントのドキュメント](https://docs.github.com/en/webhooks/webhook-events-and-payloads)を参照してください。

<a id="gitlab-pipelines"></a>

## GitLab パイプライン

1. プロジェクトの **設定 → Webhook** を開き、**新しい Webhook の追加** を選択します。
2. URLとして`https://repovio.example.com/api/webhooks/gitlab/<repository-id>`を使用します。
3. **署名トークン**を生成し、`whsec_` を含むその完全な値を Repovio リポジトリ カードに保存します。
4. [**パイプライン イベント**] を選択し、SSL 検証を有効にして保存し、テスト配信を送信します。

Repovio は標準 Webhook HMAC-SHA256 署名を検証し、冪等性のために `webhook-id` を優先します。レガシー `X-Gitlab-Token`
および `X-Gitlab-Event-UUID`
ヘッダーは、古いインスタンスでも引き続きサポートされます。 GitLabの[Webhook ドキュメント](https://docs.gitlab.com/user/project/integrations/webhooks/)を参照してください。

<a id="forgejo-actions"></a>

## Forgejo アクション

1. リポジトリの **[設定] → [Webhook]** を開き、ネイティブ**Forgejo** JSON Webhook を追加します。
2. ターゲット URL として `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` を使用します。
3. リポジトリのシークレットを貼り付け、**プッシュ イベント** と利用可能なアクション イベントを選択します。
4. TLS 検証を有効にしたまま、Webhook を保存します。

Repovio は `X-Forgejo-Signature` を検証し、冪等性のために `X-Forgejo-Delivery`
を使用します。 Gitea 互換ヘッダーは、Forgejo 互換性のために引き続き受け入れられます。 Forgejo
[Webhook ドキュメント](https://forgejo.org/docs/latest/user/repository/webhooks/) を参照してください。

<a id="gitea-actions"></a>

## Gitea アクション

1. リポジトリの **[設定] → [Webhook]** を開き、ネイティブ**Gitea** JSON Webhook を追加します。
2. ターゲット URL として `https://repovio.example.com/api/webhooks/gitea/<repository-id>` を使用します。
3. リポジトリのシークレットを貼り付け、**イベントのプッシュ** と利用可能なワークフロー イベントを選択します。
4. TLS 検証を有効にしたまま、Webhook を保存します。

Repovio は、生の本体に対して `X-Gitea-Signature` を検証し、冪等性のために `X-Gitea-Delivery` を使用します。 Gitea
[Webhook ドキュメント](https://docs.gitea.com/usage/repository/webhooks/) を参照してください。

<a id="troubleshooting"></a>

## トラブルシューティング

- `401`
  は、Repovio がリポジトリ、プロバイダー タイプ、シークレット、署名、ペイロード リポジトリ ID、または配信 ID を検証できなかったことを意味します。コールバックのリポジトリ UUID と正確なシークレットを確認します。
- プロバイダーが配信を再試行する場合、`202` と `duplicate: true` が予期されます。
- 配信が成功すると、読み取り専用同期のみがトリガーされます。プロバイダーのワークフローを変更することはありません。
- `/api/health` で永続的なプロバイダーの同期ステータスを確認します。
- `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` を 30 分のフォールバックに設定します。
- `SCHEDULER_ENABLED=false`
  はキューに入れられたリクエストを保持しますが、フォールバックのキューイングと処理を一時停止します。

[GitHub App の設定](/docs/next/github-app)
