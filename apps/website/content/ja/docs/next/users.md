---
title: 'ユーザー'
description: 'ローカルおよび ID 管理のユーザー、ロール、削除、および MCP トークンの管理を確認します。'
---

<a id="review-accounts"></a>

## アカウントを確認する

システム管理者は、**管理 → ユーザー**
を開きます。この表には、ユーザー名、アバター/表示名、ロール、ローカル/OIDC の起点、および作成/更新されたタイムスタンプが表示されます。役割によるフィルター、並べ替え、列の変更、またはページ付けを行います。ビューアーまたはマネージャーのリポジトリ アクセスには、別の
[リポジトリのメンバーシップ](/docs/next/repositories)
が必要です。アイデンティティ プロバイダー グループは、これらのメンバーシップを作成しません。

<a id="provisioning-and-deletion"></a>

## プロビジョニングと削除

管理 → ユーザーの新規作成を選びます。一意なユーザー名、任意の氏名、12–256文字のパスワードと確認、役割を入力します。初期値は Viewer です。OIDC 有効時も作成できます。OIDC アカウントは提供元で登録され、ローカル名の一致では関連付けられません。

削除アクションは他のユーザーが使用でき、すぐに実行されます。アカウントを選択する前に確認してください。この API または画面から自分のアカウントを削除することはできません。 Repovio ユーザーを削除すると、ローカル アクセスが削除されます。 GitHub、GitLab、Forgejo、または Gitea のプロバイダー アカウントは削除されません。削除する前に、影響を受けるユーザーのアクセスを確認してください。

<a id="user-mcp-tokens"></a>

## ユーザー MCP トークン

ユーザーの MCP トークン ダイアログを開いて、トークンのメタデータを一覧表示するか、確認を行ってトークンを取り消します。管理者は、このダイアログからプレーンテキストのトークン値を取得したり、別のユーザーのトークンを作成したりすることはできません。ユーザーは
[MCPの設定](/docs/next/mcp)
で独自のトークンを作成します。空のリストとロード エラーは別のものです。 API リカバリ後に再試行してください。トークン値をサポート レポートやスクリーンショットにコピーしないでください。

<a id="local-user-api"></a>

## API を介してローカル ユーザーをプロビジョニングする

HTTPS 経由で API クライアントを使用して、管理者ベアラー認証を含む `POST /api/v1/users` と
`Content-Type: application/json`
を送信します。クライアントの保護された入力のプレースホルダーを置き換えて、次のリクエスト本文を指定します。

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

有効なロールは、`VIEWER`、`MANAGER`、および `SYSTEM_ADMIN`
です。必要なロールのみを割り当ててから、リポジトリ メンバーシップを個別に付与します。応答には、パスワードやそのハッシュではなく、安全なユーザー メタデータが含まれます。重複したユーザー名または無効なリクエストは、再試行する前に修正する必要があります。パスワードやベアラー トークンを追跡ファイル、シェル履歴、スクリーンショット、または発行レポートに保存しないでください。

<a id="create-and-reset-local-accounts"></a>

## ローカルアカウントの作成とリセット

ローカルアカウントのパスワードリセット操作では、管理者が旧パスワードなしで新しい値を設定できます。新パスワードと確認を入力します。既存 JWT セッションは無効化され、自分のリセットではログアウトします。OIDC アカウントには表示されません。MCP トークンは取り消しません。

<a id="local-access-groups"></a>

## ローカルアクセスグループ

管理 → ユーザーグループで作成、名前変更、削除、メンバー追加と削除を行います。名前は一意で空にできません。ユーザー検索とページ送りに対応し、複数グループへの所属が可能です。入れ子は使えません。削除は確認を求め、所属と継承権限を除去しますが直接割り当ては残します。

リポジトリのグループアクセスで Viewer または Manager を付与し、変更や削除ができます。直接権限と継承権限を合算し、Manager が優先します。管理には全体の Manager 役割も必要で、システム管理者は制限されません。取り消しは次の要求で有効ですが、別の権限があればアクセスは残ります。ローカルと OIDC アカウントを扱い、OIDC クレームからの同期は行いません。

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
