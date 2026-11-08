---
title: 'プロバイダー OAuth セットアップ'
description: 'OAuth アプリケーションを登録し、Repovio の読み取り専用プロバイダー認証を構成します。'
---

このページの PAT/OAuth 手順ではリポジトリごとの Webhook を使用します。GitHub
App 接続では中央の Webhook を一つ使用し、専用ダイアログで設定します。

Repovio プロバイダーアカウントを接続します OAuth またはパーソナル アクセス トークン (PAT)。 OAuth 少なくとも 1 つのプロバイダーがあれば利用可能です OAuth クライアントが構成されています。何も設定されていない状態で OAuth クライアントの場合、プロバイダー アカウント画面では PAT 認証のみが提供されます。 Repovio 結果として得られる資格情報のいずれかを読み取り専用プロバイダ API にのみ使用し、書き込む前に暗号化します。 PostgreSQL。

<a id="register-oauth-applications"></a>

＃＃ 登録する OAuth アプリケーション

1 つ登録する OAuth すべてのプロバイダー インスタンスのアプリケーション Repovio 接続する必要があります。正確なコールバック URL を設定します。
`OAUTH_CALLBACK_URL` 各アプリケーションの登録で。ローカル インストールの場合、デフォルトは次のとおりです。
`http://localhost:3001/api/v1/provider-accounts/oauth/callback`。

クライアント ID とクライアント シークレットは、Web アプリケーションや Git ではなく、API 環境で構成します。

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

このインストールに必要なプロバイダーのみを構成します。クライアント ID とシークレットは常にペアとして構成する必要があります。
`GITLAB_OAUTH_BASE_URL`
単一のものを特定します GitLab インストールされたインスタンス OAuth 応用。 Forgejo 明示的なベース URL が必要な場合、 OAuth クライアントが構成されています。

<a id="read-scopes"></a>

## 読み取りスコープ

アプリケーションを登録するときは、次のスコープを使用します。

- GitHub:
  `repo security_events`。既存 OAuth 前にアカウントを再認証する必要があります Repovio セキュリティ警告を読み取ることができます。
- GitLab: `read_api read_user`。

詳細な GitHub パーソナル アクセス トークンには、Dependabot アラート、コード スキャン アラート、およびシークレット スキャン アラートへの読み取りアクセスが必要です。 GitLab セキュリティ アラートへのアクセスは、インスタンス ライセンスとトークン所有者のプロジェクト ロールにも依存します。使用できないアラート タイプは、他のリポジトリ同期スコープに失敗することなく表示されます。

- Forgejo: `read:repository`。
- Gitea: インスタンス ベース URL を含む、Gitea プロバイダー アカウント フォームで読み取りアクセスを持つパーソナル アクセス トークンを構成します。すべての自己ホスト型インスタンスには独自のアプリケーション登録が必要であるため、Repovio は現在、共有 Gitea
  OAuth クライアントを提供していません。

Repovio のアダプターは、検証、検出、ワークフロー同期、および Webhook 検証のみを公開します。プロバイダー リソースの作成、更新、ディスパッチ、再実行、キャンセル、削除は行いません。 OAuth クライアント シークレットは API 環境に残り、プロバイダー トークンは Repovio
API によって返されることはありません。

[GitHub App の設定](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## GitLab 接続のライフサイクル

上記の正確なコールバック URL と読み取りスコープを使用して、機密 GitLab
OAuth アプリケーションを登録してください。クライアントシークレットは API 環境に保存します。このアプリケーションを利用できるのは設定済みの GitLab インスタンスのみです。別のインスタンスには対応するデプロイ設定が必要です。

新しいプロバイダーアカウントでは、**プロバイダーを追加**、GitLab、OAuth を選択して同意を完了します。既存の GitLab 接続では、**GitLab
OAuth で接続**を選択してそのまま変換できます。管理対象の OAuth 接続には**再認可**が表示されます。変換時に GitLab ユーザーの数値 ID が関連付けられ、以後はユーザー名が変わっても同じ GitLab ユーザーで認可する必要があります。プロバイダーアカウントの ID、現在の名前と有効状態、追跡中のリポジトリ、メンバーシップ、設定、履歴は保持されます。同意のキャンセルや失敗で既存の接続は変更されません。

更新メタデータが保存されていない既存の接続には、一度の再認可が必要です。Repovio はこれらの古い OAuth トークンと PAT を区別できないため、アップグレード時に自動で分類変更や変換を行いません。

<a id="gitlab-token-recovery"></a>

## トークンのローテーションと復旧

Repovio はアクセストークンと更新トークンをまとめて暗号化し、有効期限の残りが 60 秒以下になるとアクセストークンを自動更新します。ローテーションが成功するたびに以前のペアを置き換えます。`invalid_grant`
で更新が拒否されると、接続は再認可が必要な状態になり、認可が成功するまで自動更新を停止します。**再認可**を使用してください。接続の削除と再作成は不要です。

ネットワークエラー、タイムアウト、レート制限、サーバー障害には既存の再試行とバックオフを使用します。不足しているクライアント設定は復元してください。クライアント ID の変更には再認可が必要で、インスタンスの不一致は拒否されます。認証情報やプロバイダーの生のエラーは表示しません。GitLab がトークンを更新した後に応答が失われたり、データベースへのコミットが失敗したりすると、以前のトークンが無効になっている可能性があります。再認可して復旧してください。PostgreSQL と GitLab はこの処理をアトミックにコミットできません。

<a id="gitlab-oauth-rollout"></a>

## ロールアウトとロールバック

まず追加型のデータベースマイグレーションを適用し、その後に対応する API と Web のバージョンをデプロイします。アプリケーションをロールバックしても追加列は保持してください。旧バージョンは GitLab
OAuth トークンを自動更新せず、ロールバックで GitLab が無効化したトークンを復元することもできません。
