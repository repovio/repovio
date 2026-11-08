---
title: 'Benutzer'
description:
  'Überprüfen Sie lokale und identitätsverwaltete Benutzer, Rollen, Löschvorgänge und die Verwaltung von MCP-Token.'
---

<a id="review-accounts"></a>

## Konten überprüfen

Systemadministratoren öffnen **Administration → Benutzer**. Die Tabelle zeigt Benutzername, Avatar/Anzeigename, Rolle,
lokale/OIDC-Herkunft und erstellte/aktualisierte Zeitstempel. Nach Rolle filtern, sortieren, Spalten ändern oder
paginieren. Der Repository-Zugriff für einen Viewer oder Manager erfordert einen separaten
[Repository-Mitgliedschaft](/docs/v2.0/repositories); Identitätsanbietergruppen erstellen diese Mitgliedschaften nicht.

<a id="provisioning-and-deletion"></a>

## Bereitstellung und Löschung

Unter Administration → Benutzer in der Toolbar Neuer Benutzer wählen. Eindeutigen Benutzernamen, optional Vor- und
Nachnamen, Passwort mit 12–256 Zeichen samt Bestätigung und eine Rolle angeben; Standard ist Leseberechtigung. Das
Erstellen bleibt bei aktiviertem OIDC verfügbar. OIDC-Konten entstehen beim Identitätsanbieter und werden nicht anhand
gleicher lokaler Benutzernamen verknüpft.

Die Löschaktion ist für andere Benutzer verfügbar und wird sofort ausgeführt; Überprüfen Sie das Konto, bevor Sie es
auswählen. Sie können Ihr eigenes Konto nicht über diese API oder diesen Bildschirm löschen. Durch das Löschen eines
Repovio-Benutzers wird der lokale Zugriff entfernt. Es werden keine Anbieterkonten unter GitHub, GitLab, Forgejo oder
Gitea gelöscht. Überprüfen Sie vor dem Löschen den Zugriff des betroffenen Benutzers.

<a id="user-mcp-tokens"></a>

## Benutzer MCP-Token

Öffnen Sie das MCP-Token-Dialogfeld eines Benutzers, um Token-Metadaten aufzulisten oder ein Token mit Bestätigung zu
widerrufen. Administratoren können über dieses Dialogfeld keine Klartext-Tokenwerte abrufen oder das Token eines anderen
Benutzers erstellen. Benutzer erstellen ihre eigenen Token in [MCP-Einstellungen](/docs/v2.0/mcp). Leere Listen und
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

<a id="create-and-reset-local-accounts"></a>

## Lokale Konten erstellen und zurücksetzen

Bei lokalen Konten setzt die Zeilenaktion Passwort zurücksetzen ein neues Passwort ohne Kenntnis des bisherigen. Neues
Passwort und Bestätigung eingeben. Bestehende JWT-Sitzungen werden ungültig; beim eigenen Konto folgt die Abmeldung.
OIDC-Konten bieten diese Aktion nicht. MCP-Tokens bleiben bestehen.

<a id="local-access-groups"></a>

## Lokale Zugriffsgruppen

Unter Administration → Benutzergruppen Gruppen erstellen, umbenennen oder löschen und Mitglieder hinzufügen oder
entfernen. Namen müssen eindeutig und nicht leer sein. Die Benutzerauswahl unterstützt Suche und Seiten; Benutzer dürfen
mehreren Gruppen angehören. Verschachtelte Gruppen sind nicht vorgesehen. Löschen erfordert Bestätigung und entfernt
Mitgliedschaften und Gruppenrechte, erhält aber direkte Zuweisungen.

Im Bereich Gruppenzugriff eines Repositorys eine Gruppe mit Leseberechtigung oder Repository-Verwaltung zuweisen, Rolle
ändern oder Zuweisung entfernen. Direkte und geerbte Rechte werden kombiniert; Manager gewinnt vor Viewer.
Verwaltungsrechte benötigen weiterhin die globale Manager-Rolle; Systemadministration bleibt uneingeschränkt. Entzug
wirkt beim nächsten Request, sofern kein anderer Zugriff verbleibt. Gruppen sind lokal, unterstützen lokale sowie
OIDC-Konten und werden nicht aus OIDC-Claims synchronisiert.

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
