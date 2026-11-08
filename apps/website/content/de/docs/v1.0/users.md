---
title: 'Benutzer'
description:
  'Überprüfen Sie lokale und identitätsverwaltete Benutzer, Rollen, Löschvorgänge und die Verwaltung von MCP-Token.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="review-accounts"></a>

## Konten überprüfen

Systemadministratoren öffnen **Administration → Benutzer**. Die Tabelle zeigt Benutzername, Avatar/Anzeigename, Rolle,
lokale/OIDC-Herkunft und erstellte/aktualisierte Zeitstempel. Nach Rolle filtern, sortieren, Spalten ändern oder
paginieren. Der Repository-Zugriff für einen Viewer oder Manager erfordert einen separaten
[Repository-Mitgliedschaft](/docs/v1.0/repositories); Identitätsanbietergruppen erstellen diese Mitgliedschaften nicht.

<a id="provisioning-and-deletion"></a>

## Bereitstellung und Löschung

Auf der Seite „Benutzer“ gibt es kein Formular zum Erstellen oder Bearbeiten von Benutzern. Zusätzliche lokale Benutzer
werden über die nur für Administratoren geschützte Benutzer-API unter Verwendung von Benutzername, Kennwort und Rolle
erstellt. OIDC-Benutzer werden über eine konfigurierte Identitätsanmeldung bereitgestellt. Informationen zur Zuordnung
und Kontentrennung finden Sie unter [Authentifizierung](/docs/v1.0/authentication). Schließen Sie keine
Benutzerbearbeitungsaktion aus dem Vorhandensein eines bearbeitbaren Profils auf Ihrer eigenen Einstellungsseite ab.

Die Löschaktion ist für andere Benutzer verfügbar und wird sofort ausgeführt; Überprüfen Sie das Konto, bevor Sie es
auswählen. Sie können Ihr eigenes Konto nicht über diese API oder diesen Bildschirm löschen. Durch das Löschen eines
Repovio-Benutzers wird der lokale Zugriff entfernt. Es werden keine Anbieterkonten unter GitHub, GitLab, Forgejo oder
Gitea gelöscht. Überprüfen Sie vor dem Löschen den Zugriff des betroffenen Benutzers.

<a id="user-mcp-tokens"></a>

## Benutzer MCP-Token

Öffnen Sie das MCP-Token-Dialogfeld eines Benutzers, um Token-Metadaten aufzulisten oder ein Token mit Bestätigung zu
widerrufen. Administratoren können über dieses Dialogfeld keine Klartext-Tokenwerte abrufen oder das Token eines anderen
Benutzers erstellen. Benutzer erstellen ihre eigenen Token in [MCP-Einstellungen](/docs/v1.0/mcp). Leere Listen und
Ladefehler sind unterschiedlich; Versuchen Sie es nach der API-Wiederherstellung erneut. Kopieren Sie niemals Tokenwerte
in Supportberichte oder Screenshots.

<a id="local-user-api"></a>

## Stellen Sie einen lokalen Benutzer über die API bereit

Verwenden Sie einen API-Client über HTTPS, um `POST /api/v1/users` mit Administrator-Bearer-Authentifizierung und
`Content-Type: application/json` zu senden. Geben Sie diesen Anforderungstext an und ersetzen Sie Platzhalter in den
geschützten Eingaben des Clients:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Gültige Rollen sind `VIEWER`, `MANAGER` und `SYSTEM_ADMIN`. Weisen Sie nur die erforderliche Rolle zu und gewähren Sie
dann separat Repository-Mitgliedschaften. Die Antwort enthält sichere Benutzermetadaten, nicht das Passwort oder seinen
Hash. Ein doppelter Benutzername oder eine ungültige Anfrage muss vor einem erneuten Versuch korrigiert werden.
Speichern Sie Passwörter oder Bearer-Tokens nicht in nachverfolgten Dateien, im Shell-Verlauf, in Screenshots oder in
Problemberichten.
