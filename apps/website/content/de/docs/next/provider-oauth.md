---
title: 'Einrichtung des Anbieters OAuth'
description: 'Registrieren Sie OAuth-Anwendungen und konfigurieren Sie die schreibgeschützte Anbieterauthentifizierung für Repovio.'
---

Die PAT-/OAuth-Anweisungen dieser Seite verwenden Webhooks pro Repository. GitHub-App-Verbindungen nutzen stattdessen
einen zentralen Webhook und werden über den GitHub-App-Dialog eingerichtet.

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

[GitHub App einrichten](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## Lebenszyklus von GitLab-Verbindungen

Registrieren Sie eine vertrauliche GitLab-OAuth-Anwendung mit der oben angegebenen exakten Callback-URL und den
Leseberechtigungen. Bewahren Sie das Client-Geheimnis in der API-Umgebung auf. Diese Anwendung kann nur die
konfigurierte GitLab-Instanz verwenden; eine andere Instanz benötigt eine dazu passende Bereitstellungskonfiguration.

Wählen Sie für ein neues Anbieter-Konto **Anbieter hinzufügen**, GitLab und OAuth und schließen Sie die Zustimmung ab.
Wählen Sie bei einer bestehenden GitLab-Verbindung **Mit GitLab OAuth verbinden**, um sie direkt umzustellen. Verwaltete
OAuth-Verbindungen bieten **Erneut autorisieren** an. Die Umstellung bindet die numerische GitLab-Benutzer-ID; spätere
Autorisierungen müssen denselben GitLab-Benutzer verwenden, auch wenn sich sein Benutzername ändert. ID, aktueller Name
und Aktivierungszustand des Anbieter-Kontos sowie verfolgte Repositories, Mitgliedschaften, Konfiguration und Verlauf
bleiben erhalten. Ein Abbruch oder eine fehlgeschlagene Zustimmung verändert die bestehende Verbindung nicht.

Bestehende Verbindungen ohne gespeicherte Aktualisierungsmetadaten benötigen eine neue Autorisierung. Repovio kann diese
älteren OAuth-Tokens nicht von PATs unterscheiden; ein Upgrade kennzeichnet sie daher nicht automatisch neu und stellt
sie nicht automatisch um.

<a id="gitlab-token-recovery"></a>

## Token-Rotation und Wiederherstellung

Repovio verschlüsselt Zugriffs- und Aktualisierungstokens gemeinsam und erneuert Zugriffstokens automatisch, sobald
höchstens 60 Sekunden verbleiben. Jede erfolgreiche Rotation ersetzt das vorherige Paar. Eine mit `invalid_grant`
abgelehnte Aktualisierung kennzeichnet die Verbindung als erneut zu autorisieren und unterdrückt weitere automatische
Aktualisierungen bis zur erfolgreichen Autorisierung. Verwenden Sie **Erneut autorisieren**; Löschen und Neuerstellen
sind nicht erforderlich.

Netzwerkfehler, Zeitüberschreitungen, Ratenbegrenzungen und Serverfehler verwenden das bestehende Wiederholungs- und
Backoff-Verhalten. Fehlende Client-Konfiguration muss wiederhergestellt werden; eine geänderte Client-Identität
erfordert eine neue Autorisierung, und eine abweichende Instanz wird abgelehnt. Zugangsdaten und unverarbeitete
Anbieterfehler werden niemals angezeigt. Rotiert GitLab die Tokens, während die Antwort verloren geht oder der
Datenbank-Commit fehlschlägt, können die alten Tokens bereits ungültig sein. Autorisieren Sie erneut; PostgreSQL und
GitLab können diesen Vorgang nicht atomar festschreiben.

<a id="gitlab-oauth-rollout"></a>

## Bereitstellung und Rollback

Wenden Sie zuerst die additive Datenbankmigration an und stellen Sie anschließend zusammenpassende API- und
Web-Versionen bereit. Behalten Sie die zusätzlichen Spalten bei einem Anwendungs-Rollback bei. Ältere
Anwendungsversionen aktualisieren GitLab-OAuth-Tokens nicht automatisch; ein Rollback kann bereits durch GitLab ungültig
gemachte Tokens nicht wiederherstellen.
