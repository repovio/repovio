---
title: 'GitHub App einrichten'
description: 'Eigene GitHub App mit verschlüsselten Zugangsdaten und lesendem Installationszugriff registrieren und verbinden.'
---

<a id="register-app"></a>

## App registrieren

Verwende eine GitHub.com-App pro Repovio-Installation. PAT und OAuth bleiben verfügbar. Öffne als Konto- oder
Organisationsinhaber die GitHub-Einstellungen, Developer settings, GitHub Apps und New GitHub App. Wähle einen
eindeutigen Namen und deine Repovio-Startseite. Für mehrere Konten wähle Any account. Eine private App lässt sich nur im
Besitzerkonto installieren. OAuth-Client-Secret, Callback-URL und Setup-URL werden für diese Integration nicht benötigt.

<a id="permissions-and-events"></a>

## Berechtigungen und Ereignisse

Setze die folgenden grundlegenden Repository-Berechtigungen auf Read-only; Metadata ist automatisch lesbar. Ergänze
optionale Sicherheitsberechtigungen nur für benötigte und verfügbare Funktionen. Abonniere die genannten Ereignisse.
GitHub sendet Installationsereignisse automatisch. Repovio beschränkt erzeugte Installation-Tokens auf Leserechte, auch
wenn die registrierte App mehr Rechte besitzt.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
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

## Repovio konfigurieren

Aktiviere Webhooks in der GitHub App. Nutze den öffentlichen HTTPS-Endpunkt unten; PUBLIC_URL muss auf die extern
erreichbare Repovio-Installation zeigen. Erzeuge ein zufälliges Webhook-Geheimnis mit mindestens 16 Zeichen und
hinterlege denselben Wert auf GitHub und in Repovio. Generiere auf GitHub einen RSA-Schlüssel und lade die PEM-Datei
herunter. Öffne in Repovio Verwaltung, Anbieter-Konten, GitHub App. Trage App-ID, App-Slug, vollständigen privaten
Schlüssel und Webhook-Geheimnis ein und wähle Prüfen und speichern. Die API prüft die App-Identität und verschlüsselt
beide Geheimnisse in PostgreSQL. Sichere den Verschlüsselungsschlüssel der Installation; gespeicherte Geheimnisse werden
nie an den Browser zurückgegeben.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Installieren und verbinden

Wähle Auf GitHub installieren, ein Konto oder eine Organisation und nur die benötigten Repositories. Kehre zu Repovio
zurück, aktualisiere die Installationen und verbinde das gewünschte Konto. Gesperrte oder bereits verbundene
Installationen sind nicht erneut verbindbar. Die Liste stammt von der konfigurierten App; einer Installations-ID aus
einem Browser-Callback wird nicht vertraut. Füge Repositories anschließend in der Repository-Ansicht hinzu. Repovio
erneuert kurzlebige Installation-Tokens automatisch. Erstimport und regelmäßiges Polling ergänzen die durch Webhooks
ausgelöste Synchronisierung.

Passe den lokalen Kontonamen vor dem Verbinden an, falls bereits ein PAT- oder OAuth-Konto denselben Namen hat.

<a id="rotate-and-disconnect"></a>

## Rotieren und trennen

Erzeuge zur Schlüsselrotation einen Ersatzschlüssel auf GitHub, speichere ihn in Repovio und prüfe die Synchronisierung,
bevor du den alten Schlüssel auf GitHub löschst. Ändere das Webhook-Geheimnis auf beiden Seiten zusammen; Signaturen mit
dem alten Geheimnis werden sofort abgewiesen. Leere Geheimnisfelder behalten gespeicherte Werte. Lösche verbundene
Anbieter-Konten, bevor du die App-Identität ersetzt oder die Konfiguration entfernst. Das Löschen eines Kontos entfernt
auch abhängige Tracking-Daten; exportiere benötigte Daten vorher. Lokales Entfernen deinstalliert die App nicht auf
GitHub.

<a id="troubleshooting"></a>

## Fehler beheben

Prüfe bei Einrichtungsfehlern App-ID, Slug und PEM-Format. Prüfe bei Signaturfehlern das gemeinsame Geheimnis, die
HTTPS-Erreichbarkeit und unveränderte Request-Bytes am Reverse Proxy. Prüfe bei leerer Discovery die Repository-Auswahl
und Leserechte und aktualisiere die Installationen. Entfernte oder gesperrte Installationen erscheinen als nicht
verfügbar; vorhandene Daten bleiben erhalten. Stelle den Zugriff auf GitHub wieder her und aktualisiere die Liste.
Fehlende optionale Sicherheitsrechte blockieren andere Sync-Bereiche nicht. Prüfe Jobs für den Sync-Status. Polling
bleibt bei Webhook-Ausfällen aktiv. Live-Verhalten benötigt eine echte Test-App; Mock-Tests bestätigen keine
GitHub-Installation.

## Siehe auch

- [Anbieter-Konten](/docs/next/provider-accounts)
- [Provider-OAuth einrichten](/docs/next/provider-oauth)
- [Provider-Webhooks](/docs/next/provider-webhooks)
