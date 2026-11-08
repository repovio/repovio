---
title: 'プロバイダー OAuth セットアップ'
description: 'OAuth アプリケーションを登録し、Repovio の読み取り専用プロバイダー認証を構成します。'
---

> アーカイブされたソース スナップショット。製品ラベルはRepovioを使用します。このリリースのタグ付きデプロイメント ファイルの構成識別子とコンテナー参照を変更せずに使用します。

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
