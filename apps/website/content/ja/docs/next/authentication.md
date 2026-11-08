---
title: '認証'
description: 'ローカル認証、任意の OpenID Connect サインイン、アカウント復旧を設定します。'
---

<a id="first-run-setup"></a>

## 初回実行のセットアップ

新しいインストールを展開した後、そのパブリック URL を開きます。 Repovio すべてのリクエストをにリダイレクトします
`/auth/setup`
最初のアカウントが存在するまで。オプションの姓名、一意のユーザー名、および 12 文字以上のパスワードを入力します。アカウントはシステム管理者として作成され、すぐにサインインされます。

セットアップは 1 回のみ成功します。最初のユーザーが存在した後、 `/auth/setup` にリダイレクトします
`/auth/signin`。既存のインストールでは、アップグレード中も現在のユーザーが保持され、セットアップは再度表示されません。

<a id="openid-connect-single-sign-on"></a>

## OpenID Connect シングル サインオン

Repovio は、ローカル サインインに加えて、オプションの OpenID
Connect プロバイダーを 1 つサポートします。システム管理者は、**設定 → 認証**
でこれを設定します。このログインは別のものです GitHub、 GitLab、 Forgejo、 そして Gitea プロバイダー OAuth:
OIDC を特定します Repovio ユーザー、プロバイダー OAuth プロバイダー リソースへの読み取りアクセスのみを許可します。

プロバイダーを構成する前に、外部から到達可能な API コールバック URL を正確に設定します。

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

の値を登録します `OIDC_CALLBACK_URL`
アイデンティティプロバイダーで許可されたリダイレクト URI として。発行者、クライアント ID、オプションのクライアント シークレット、スコープ、およびグループ クレームを構成します。 Repovio。 API は保存時にクライアント シークレットを受け入れますが、その値は返しません。保存時には暗号化されます
`TOKEN_ENCRYPTION_KEY`。
**接続の確認**を使用する前に構成を保存してください。変更が保存されていない場合は、そのチェックが無効になります。依存する前に検出が成功したことを確認してください OIDC サインイン。

発行者とそのエンドポイントには HTTPS が必要です。 **HTTP 発行者を許可**
は、隔離されたラボ ネットワークのみを対象としています。インターネットにアクセス可能な展開では決して有効にしてはいけません。ローカル パスワード サインインは、次の場合でも回復パスとして利用可能です。 OIDC 有効になっています。

このフォームには、コピー用のコールバック URL、設定/監視されたグループ、および保存されているクライアント シークレットを置換またはクリアするための個別のコントロールも表示されます。置換を無効のままにしておくと、保存されたシークレットが保持されます。ロード、保存、接続チェックの失敗は個別に報告されます。無効な構成を修正し、接続チェックを再試行する前に再度保存してください。

<a id="groups-roles-and-identities"></a>

### グループ、役割、およびアイデンティティ

グループ claim は正確な名前または `realm_access.groups`
のようなドット区切りパスです。大文字と小文字を区別する正確な値を指定します。複数一致時は
`SYSTEM_ADMIN`、`MANAGER`、`VIEWER`
の順です。グループ欠落や未一致は、未一致ユーザーへの Viewer 許可を明示的に有効にしない限り拒否されます。不正形式の claim とグループ数超過は常に拒否されます。

OIDC アカウントは、検証された発行者とサブジェクトのペアによってのみリンクされます。 Repovio は、電子メール アドレスやユーザー名によって OIDC ログインをローカル アカウントにリンクすることはありません。ログインが成功するたびに、検証済みのクレームから姓名が同期されます。ログイン名、プロファイル名、パスワードはローカルで変更できません。リポジトリ メンバーシップは Repovio で管理されたままとなり、アイデンティティ プロバイダー グループから派生することはありません。

セキュリティに関する設定やロールを変更すると、既存の OIDC bearer
token は無効になります。プロバイダーの表示名だけを変更しても、既存の OIDC
token は無効になりません。ID プロバイダーのグループを無効化または削除すると、対象アカウントは新しいセッションを取得できなくなり、次にログインが拒否された後で以前のセッションも無効になります。

<a id="provider-examples"></a>

### プロバイダーの例

プロバイダー別ガイド: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Authentik の場合、認可コード フロー、上記の正確なコールバック URL、および `openid`、`profile`、および `email`
スコープを使用して OAuth2/OpenID プロバイダーを作成します。選択したグループ クレームをグループ名の配列として返すスコープ マッピングを追加し、プロバイダーをアプリケーションにアタッチして、アプリケーションの発行者、クライアント ID、およびクライアント シークレットを Repovio にコピーします。

別の標準準拠プロバイダーの場合は、認証コード フローを有効にし、S256
PKCE を要求し、正確なコールバック URL を登録し、安定した `sub`
と構成されたグループ クレームを ID トークンまたは UserInfo 応答に含めます。 Repovio は、非対称 ID トークン署名のみを受け入れ、未署名トークンと HMAC 署名付きトークンを拒否します。

<a id="oidc-keycloak"></a>

#### Keycloak

Keycloak 管理コンソールで repovio realm と repovio という OpenID Connect クライアントを作成します。Client
authentication と Standard flow を有効にし、Implicit flow と Direct access
grants を無効にします。下記と完全一致するコールバックを Valid redirect
URIs に登録し、S256 を必須にして RS256 を維持します。Credentials からシークレットをコピーします。

クライアント専用 scope に Group Membership mapper を追加し、Token Claim Name を groups、Full group path を無効、Add to
ID
token を有効にします。profile と email をデフォルト scope に設定します。repovio-admins、repovio-managers、repovio-viewers を作成してユーザーを割り当て、完全なグループ名を Repovio の対応するロールにマッピングします。Realm ロールはグループ所属ではありません。

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

参考資料: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Entra ID → App
registrations でシングルテナントのアプリを登録します。Web プラットフォームに下記の正確なコールバックを追加し、暗黙的なトークン発行は有効にしません。Application
(client) ID と Directory (tenant)
ID をコピーします。クライアントシークレットを作成し、ID ではなく Value をコピーします。v2
issuer にはテナント ID を使用し、common や organizations は使いません。

Token configuration でセキュリティグループの groups claim を ID token に追加し、Group
ID を選択します。3 グループを作成してユーザーを割り当て、オブジェクト ID を SYSTEM_ADMIN、MANAGER、VIEWER に対応させます。表示名は GUID と一致しません。割り当て済みグループへの絞り込みには適切な Entra ライセンスが必要な場合があります。S256
PKCE と非対称署名を使用し、期限前にシークレットを更新します。

グループ数超過のマーカーは、未一致ユーザーの Viewer 許可を有効にしても Repovio が拒否します。外部 claim ソースや Microsoft
Graph は参照しません。出力する所属を減らすかグループをフィルターしてください。Graph 権限の付与では解決しません。

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

参考資料:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Regular Web Application を作成し、Allowed Callback URLs に正確なコールバックを登録します。Authorization Code と S256
PKCE を使用し、署名を RS256、Token Endpoint Authentication
Method を Basic にします。クライアント ID とシークレットをコピーします。使用するテナントまたは独自ドメインの discovery から issuer を取得し、末尾のスラッシュを維持します。ドメインを混在させないでください。

下記の Login / Post Login Action を作成し、REPLACE_WITH_REPOVIO_CLIENT_ID を置き換えてデプロイし、Login
flow に追加します。管理者が各ユーザーの app_metadata.repovio_groups を repovio-admins、repovio-managers、repovio-viewers を含む配列として設定します。ユーザーが変更できる user_metadata を認可に使用しないでください。グループは自動出力されず、access
token だけへの claim 追加では不十分です。Repovio には namespaced
claim の完全な名前を入力し、3 値を対応ロールにマッピングします。

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

参考資料: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### 検証とトラブルシューティング

どのプロバイダーでも OIDC_CALLBACK_URL を正確に登録し、openid profile email を要求して Authorization Code、S256
PKCE、非対称署名を使用します。設定 → 認証で issuer、クライアント ID、シークレット、scopes、グループ claim を保存して接続確認します。Discovery 成功だけではユーザーのグループは検証されません。

SYSTEM_ADMIN、MANAGER、VIEWER、および未割り当てユーザーを別々にテストします。未一致 Viewer 許可が無効なら未割り当てユーザーは拒否される必要があります。失敗時は正確なグループ名、Keycloak パス設定、Entra オブジェクト ID、Auth0 の namespaced
ID-token
claim を確認します。復旧用のローカル管理者を保持します。OIDC グループはグローバルロールのみを付与し、リポジトリ権限は別途必要です。設定できるプロバイダーは一つです。

<a id="oidc-api-contract"></a>

### OIDC API コントラクト

| 方法         | パス                         | アクセス       | 目的                                                                             |
| ------------ | ---------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | パブリック     | 有効な可用性とオプションのプロバイダー名のみを返します。                         |
| `GET`        | `/api/v1/auth/oidc/start`    | パブリック     | ブラウザバインドされた認証コードと S256 PKCE トランザクションを開始します。      |
| `GET`        | `/api/v1/auth/oidc/callback` | パブリック     | プロバイダーの応答を検証し、ワンタイム フラグメント コードでリダイレクトします。 |
| `POST`       | `/api/v1/auth/oidc/exchange` | パブリック     | フラグメント コードを 1 回消費し、通常のベアラー `AuthResult` を返します。       |
| `GET`、`PUT` | `/api/v1/auth/oidc/config`   | システム管理者 | シークレットセーフな OIDC 設定を読み取りまたは更新します。                       |
| `POST`       | `/api/v1/auth/oidc/check`    | システム管理者 | 保存された検出設定を変更せずに確認します。                                       |

コールバックは URL にベアラー JWT を配置しません。その不透明な交換コードは 60 秒後に期限切れになり、使用できるのは 1 回だけです。プロバイダーのエラーは、ブラウザーやログに到達する前に安定したエラー コードに変換されます。

<a id="change-your-password"></a>

## パスワードを変更してください

サインインしているときに、**[設定] → [一般] → [パスワードの変更]**
を開きます。現在のパスワード、新しいパスワード、およびその確認を入力します。 Repovio は、現在のブラウザーを置換アクセス トークンでサインインしたままにし、他のすべてのサインイン セッションで保持されているトークンを無効にします。

<a id="reset-a-forgotten-password"></a>

## 忘れたパスワードをリセットする

Repovio には、意図的に電子メールベースのパスワード リセットがありません。デプロイメント管理者は、`compose.yml`
を含むディレクトリからローカル アカウントをリセットできます。置換パスワードをエコーしたりシェル履歴に保存したりせずに読み取り、標準入力経由で API コンテナに送信します。

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

`USERNAME`
を正確なログイン ユーザー名に置き換えます。このコマンドには 12 ～ 256 文字のパスワードが必要で、そのローカル アカウントのみが更新され、既存のアクセス トークンはすべて無効になります。その後、新しいパスワードを使用して再度サインインします。このコマンドは、ローカル パスワードがないため、OIDC で管理されているアカウントを拒否します。

<a id="local-user-and-group-management"></a>

## ローカルアクセスグループ

リポジトリのグループアクセスで Viewer または Manager を付与し、変更や削除ができます。直接権限と継承権限を合算し、Manager が優先します。管理には全体の Manager 役割も必要で、システム管理者は制限されません。取り消しは次の要求で有効ですが、別の権限があればアクセスは残ります。ローカルと OIDC アカウントを扱い、OIDC クレームからの同期は行いません。

[ローカルアクセスグループ](/docs/next/users#local-access-groups)
