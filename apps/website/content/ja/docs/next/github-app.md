---
title: 'GitHub App の設定'
description: '独自の GitHub App を登録し、暗号化した認証情報と読み取り専用のインストール権限で接続します。'
---

<a id="register-app"></a>

## アプリを登録

Repovio のデプロイごとに GitHub.com
App を一つ使用します。PAT と OAuth も引き続き利用できます。所有者として Settings、Developer settings、GitHub Apps、New
GitHub App を開きます。一意の名前と Repovio のホームページを設定します。複数アカウントでは Any
account を選択します。非公開アプリは所有アカウントにのみインストールできます。OAuth クライアントシークレット、コールバック URL、設定 URL は不要です。

<a id="permissions-and-events"></a>

## 権限とイベント

以下の基本リポジトリ権限を Read-only にします。Metadata は自動付与されます。必要かつ利用可能な場合のみ任意のセキュリティ権限を追加します。記載されたイベントを購読します。インストールのライフサイクルイベントは GitHub が自動送信します。アプリに書き込み権限があっても、Repovio は読み取り専用トークンだけを要求します。

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (vulnerability_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Repovio を設定

Webhook を有効にし、以下の公開 HTTPS エンドポイントを使用します。PUBLIC_URL は外部から接続可能なデプロイを指す必要があります。16 文字以上のランダムなシークレットを生成し、GitHub と Repovio に同じ値を設定します。GitHub で RSA 秘密鍵を生成し PEM ファイルを取得します。管理、プロバイダーアカウント、GitHub
App で App
ID、slug、秘密鍵全体、Webhook シークレットを入力し、検証して保存します。API はアプリの識別情報を確認し両方のシークレットを PostgreSQL に暗号化して保存します。デプロイの暗号化キーを保護してください。保存済みシークレットはブラウザーに返されません。

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## インストールと接続

GitHub でアプリをインストールし、アカウントまたは組織と必要なリポジトリのみを選択します。Repovio に戻り一覧を更新して接続します。停止中または接続済みのインストールは再接続できません。一覧は設定したアプリから取得し、コールバックのインストール ID は信頼しません。リポジトリ画面から追跡を追加します。トークンは自動更新され、初回インポートと定期ポーリングが Webhook を補完します。

既存の PAT または OAuth アカウントと名前が重複する場合は、接続前にローカル名を変更してください。

<a id="rotate-and-disconnect"></a>

## 更新と切断

GitHub で新しい秘密鍵を生成して保存し、同期を確認してから古い鍵を削除します。Webhook シークレットは両側で同時に変更します。古い署名は直ちに無効になります。空欄は既存シークレットを保持します。アプリ識別情報の変更や設定削除の前に接続済みアカウントを削除してください。依存する追跡データも削除されるため事前にエクスポートします。ローカル設定の削除は GitHub 上のアンインストールではありません。

<a id="troubleshooting"></a>

## 問題の解決

設定エラーでは App
ID、slug、PEM 形式を確認します。署名エラーでは共有シークレット、HTTPS、プロキシによる本文の保持を確認します。空の一覧ではリポジトリ選択と権限を確認して更新します。削除または停止されたインストールの履歴は保持されます。GitHub でアクセスを戻し一覧を更新してください。任意の安全権限不足は他の同期を妨げません。Jobs で状態を確認します。Webhook 障害時もポーリングは継続します。モックテストは実際のインストールを検証しないため、実動作確認にはテストアプリが必要です。

## 関連項目

- [プロバイダーアカウント](/docs/next/provider-accounts)
- [OAuth の設定](/docs/next/provider-oauth)
- [プロバイダー Webhook](/docs/next/provider-webhooks)
