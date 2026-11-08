---
title: 'Einrichtung des Anbieters OAuth'
description:
  'Registrieren Sie OAuth-Anwendungen und konfigurieren Sie die schreibgeschützte Anbieterauthentifizierung für Repovio.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

Repovio verbindet Anbieterkonten über OAuth oder ein persönliches Zugriffstoken (PAT). OAuth ist verfügbar, wenn
mindestens ein Provider-OAuth-Client konfiguriert ist. Ohne konfigurierte OAuth-Clients bietet der
Anbieter-Konto-Bildschirm nur PAT-Authentifizierung. Repovio verwendet die resultierenden Anmeldeinformationen nur für
seine schreibgeschützten Anbieter-APIs und verschlüsselt sie, bevor sie in PostgreSQL geschrieben werden.

<a id="register-oauth-applications"></a>

## Registrieren Sie OAuth-Anwendungen

Registrieren Sie eine OAuth-Anwendung für jede Anbieterinstanz, mit der Repovio eine Verbindung herstellen soll. Legen
Sie in jeder Anwendungsregistrierung die genaue Rückruf-URL von `OAUTH_CALLBACK_URL` fest. Für eine lokale Installation
ist der Standardwert `http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Konfigurieren Sie die Client-ID und das Client-Geheimnis in der API-Umgebung, niemals in der Webanwendung oder Git:

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

Konfigurieren Sie nur die Anbieter, die diese Installation benötigt. Client-IDs und Geheimnisse müssen immer als Paare
konfiguriert werden. `GITLAB_OAUTH_BASE_URL` identifiziert die einzelne GitLab-Instanz für die installierte
OAuth-Anwendung. Forgejo benötigt eine explizite Basis-URL, wenn sein OAuth-Client konfiguriert ist.

<a id="read-scopes"></a>

## Lesebereiche

Verwenden Sie bei der Registrierung der Anwendung diese Bereiche:

- GitHub: `repo security_events`. Vorhandene OAuth-Konten müssen erneut autorisiert werden, bevor Repovio
  Sicherheitswarnungen lesen kann.
- GitLab: `read_api read_user`.

Fein abgestufte persönliche Zugriffstoken GitHub benötigen Lesezugriff auf Dependabot-Warnungen, Code-Scan-Warnungen und
geheime Scan-Warnungen. Der Zugriff auf Sicherheitswarnungen GitLab hängt außerdem von der Instanzlizenz und der
Projektrolle des Token-Eigentümers ab. Nicht verfügbare Warnungstypen werden angezeigt, ohne dass andere
Repository-Synchronisierungsbereiche fehlschlagen.

- Forgejo: `read:repository`.
- Gitea: Konfigurieren Sie ein persönliches Zugriffstoken mit Lesezugriff im Gitea-Anbieter-Konto-Formular,
  einschließlich der Instanz-Basis-URL. Repovio bietet derzeit keinen gemeinsam genutzten Gitea OAuth-Client an, da jede
  selbst gehostete Instanz eine eigene Anwendungsregistrierung benötigt.

Die Adapter von Repovio bieten nur Validierung, Erkennung, Workflow-Synchronisierung und Webhook-Überprüfung. Sie
erstellen, aktualisieren, versenden, wiederholen, stornieren oder löschen keine Anbieterressourcen.
OAuth-Client-Geheimnisse bleiben in der API-Umgebung und Anbieter-Tokens werden niemals von der Repovio-API
zurückgegeben.
