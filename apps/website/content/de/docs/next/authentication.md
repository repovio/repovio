---
title: 'Authentifizierung'
description: 'Konfigurieren Sie die lokale Authentifizierung, die optionale OpenID Connect-Anmeldung und die
  Kontowiederherstellung.'
---

<a id="first-run-setup"></a>

## Erstmaliges Setup

Öffnen Sie nach der Bereitstellung einer neuen Installation deren öffentliche URL. Repovio leitet jede Anfrage an
`/auth/setup` um, bis das erste Konto existiert. Geben Sie einen optionalen Vor- und Nachnamen, einen eindeutigen
Benutzernamen und ein Passwort mit mindestens 12 Zeichen ein. Das Konto wird als Systemadministrator erstellt und sofort
angemeldet.

Das Setup kann nur einmal erfolgreich sein. Nachdem der erste Benutzer vorhanden ist, leitet `/auth/setup` zu
`/auth/signin` weiter. Bestehende Installationen behalten ihre aktuellen Benutzer während Upgrades und zeigen das Setup
nicht erneut an.

<a id="openid-connect-single-sign-on"></a>

## OpenID Connect Single Sign-On

Repovio unterstützt zusätzlich zur lokalen Anmeldung einen optionalen OpenID Connect-Anbieter. Ein Systemadministrator
konfiguriert es unter **Einstellungen → Authentifizierung**. Diese Anmeldung unterscheidet sich vom GitHub-, GitLab-,
Forgejo- und Gitea-Anbieter OAuth: OIDC identifiziert einen Repovio-Benutzer, während der Anbieter OAuth nur Lesezugriff
auf Anbieterressourcen gewährt.

Legen Sie die genaue extern erreichbare API-Rückruf-URL fest, bevor Sie den Anbieter konfigurieren:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Registrieren Sie den Wert von `OIDC_CALLBACK_URL` als zulässigen Umleitungs-URI beim Identitätsanbieter. Konfigurieren
Sie den Aussteller, die Client-ID, das optionale Client-Geheimnis, die Bereiche und den Gruppenanspruch in Repovio. Die
API akzeptiert das Client-Geheimnis beim Speichern, gibt jedoch nie seinen Wert zurück. Im Ruhezustand wird es mit
`TOKEN_ENCRYPTION_KEY` verschlüsselt. Speichern Sie die Konfiguration, bevor Sie **Verbindung prüfen** verwenden. Nicht
gespeicherte Änderungen deaktivieren diese Prüfung. Bestätigen Sie, dass die Erkennung erfolgreich ist, bevor Sie sich
auf die OIDC-Anmeldung verlassen.

Für den Emittenten und seine Endpunkte ist HTTPS erforderlich. **HTTP-Aussteller zulassen** ist nur für isolierte
Labornetzwerke gedacht; Es darf niemals für eine über das Internet erreichbare Bereitstellung aktiviert werden. Die
lokale Kennwortanmeldung bleibt als Wiederherstellungspfad verfügbar, auch wenn OIDC aktiviert ist.

Das Formular zeigt außerdem die Rückruf-URL zum Kopieren, konfigurierte/beobachtete Gruppen und separate Steuerelemente
zum Ersetzen oder Löschen des gespeicherten Client-Geheimnisses. Wenn Sie den Ersatz deaktiviert lassen, bleibt das
gespeicherte Geheimnis erhalten. Lade-, Speicher- und Verbindungsprüfungsfehler werden separat gemeldet. Korrigieren Sie
die ungültige Konfiguration und speichern Sie sie erneut, bevor Sie die Verbindungsprüfung erneut versuchen.

<a id="groups-roles-and-identities"></a>

### Gruppen, Rollen und Identitäten

Der Gruppen-Claim kann ein exakter Name oder ein durch Punkte getrennter Pfad wie `realm_access.groups` sein. Ordnen Sie
exakte, groß-/kleinschreibungssensitive Gruppenwerte den drei Repovio-Rollen zu. Bei mehreren Treffern gilt
`SYSTEM_ADMIN` vor `MANAGER` vor `VIEWER`. Fehlende oder nicht zugeordnete Gruppen werden abgewiesen, sofern die
Viewer-Freigabe für nicht zugeordnete Benutzer nicht ausdrücklich aktiviert ist. Fehlerhafte Claims und Gruppenüberläufe
werden immer abgewiesen.

Ein OIDC-Konto ist nur durch das verifizierte Emittenten- und Betreffpaar verknüpft. Repovio verknüpft niemals ein
OIDC-Login mit einem lokalen Konto per E-Mail-Adresse oder Benutzername. Bei jeder erfolgreichen Anmeldung werden Vor-
und Nachnamen aus verifizierten Ansprüchen synchronisiert; Anmeldename, Profilnamen und Passwort können nicht lokal
geändert werden. Repository-Mitgliedschaften bleiben in Repovio verwaltet und werden niemals von
Identitätsanbietergruppen abgeleitet.

Sicherheitsrelevante Konfigurations- oder Rollenänderungen machen vorhandene OIDC-Bearer-Token ungültig. Eine Änderung
nur des Anzeigenamens macht bestehende OIDC-Token nicht ungültig. Wenn eine Identitätsanbietergruppe deaktiviert oder
entfernt wird, erhält das betroffene Konto keine neue Sitzung. Nach der nächsten abgewiesenen Anmeldung werden auch
seine bisherigen Sitzungen ungültig.

<a id="provider-examples"></a>

### Anbieterbeispiele

Provider-Anleitungen: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Erstellen Sie für Authentik einen OAuth2/OpenID-Anbieter mit Autorisierungscodefluss, der genauen Rückruf-URL oben und
den Bereichen `openid`, `profile` und `email`. Fügen Sie eine Bereichszuordnung hinzu, die den ausgewählten
Gruppenanspruch als Array von Gruppennamen zurückgibt, hängen Sie den Anbieter an eine Anwendung an und kopieren Sie
dann den Aussteller, die Client-ID und das Client-Geheimnis der Anwendung in Repovio.

Aktivieren Sie für einen anderen standardkonformen Anbieter den Autorisierungscodefluss, fordern Sie S256 PKCE an,
registrieren Sie die genaue Rückruf-URL und fügen Sie einen stabilen `sub` sowie den konfigurierten Gruppenanspruch in
das ID-Token oder die UserInfo-Antwort ein. Repovio akzeptiert nur asymmetrische ID-Token-Signaturen und lehnt nicht
signierte und HMAC-signierte Token ab.

<a id="oidc-keycloak"></a>

#### Keycloak

Erstellen Sie in der Keycloak-Administrationskonsole den Realm repovio und einen OpenID-Connect-Client namens repovio.
Aktivieren Sie Client authentication und Standard flow; deaktivieren Sie Implicit flow und Direct access grants. Tragen
Sie die exakte Callback-URL unten unter Valid redirect URIs ein und verlangen Sie S256 unter Proof Key for Code
Exchange. Behalten Sie RS256 bei. Kopieren Sie das Client-Geheimnis aus Credentials.

Erstellen Sie im dedizierten Client-Scope einen Group-Membership-Mapper: Token Claim Name groups, Full group path aus,
Add to ID token an. Erstellen Sie repovio-admins, repovio-managers und repovio-viewers und weisen Sie Benutzer zu.
Binden Sie profile und email als Standard-Client-Scopes ein. Speichern Sie in Repovio die Werte unten und ordnen Sie
jeden vollständigen Gruppennamen der passenden Rolle zu. Realm-Rollen sind keine Gruppenmitgliedschaften.

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

Referenzen: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Registrieren Sie unter Entra ID → App registrations eine Single-Tenant-Anwendung. Fügen Sie eine Web-Plattform mit der
exakten Callback-URL unten hinzu; aktivieren Sie keine implizite ID-Token-Ausgabe. Kopieren Sie Application (client) ID
und Directory (tenant) ID. Erstellen Sie ein Client-Geheimnis und kopieren Sie dessen Value, nicht die Secret-ID.
Verwenden Sie die Tenant-ID im v2-Issuer; nicht common oder organizations.

Fügen Sie unter Token configuration einen groups-Claim für Sicherheitsgruppen zu ID-Token hinzu und wählen Sie Group ID.
Erstellen Sie drei Sicherheitsgruppen, weisen Sie Benutzer zu und ordnen Sie deren Objekt-IDs in Repovio SYSTEM_ADMIN,
MANAGER und VIEWER zu. Anzeigenamen passen nicht zu GUID-Claims. Das Filtern nach zugewiesenen Gruppen kann eine
entsprechende Entra-Lizenz erfordern. Entra unterstützt S256 PKCE und asymmetrisch signierte ID-Token. Erneuern Sie das
Client-Geheimnis vor Ablauf.

Lässt Entra Gruppen wegen Token-Grenzen aus, lehnt Repovio die Überlaufmarker auch bei aktivierter Viewer-Freigabe für
nicht zugeordnete Benutzer ab. Es folgt keinen externen Claim-Quellen und fragt Microsoft Graph nicht ab. Reduzieren Sie
die ausgegebenen Mitgliedschaften oder konfigurieren Sie unterstützte Gruppenfilter; Graph-Berechtigungen sind keine
Lösung.

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

Referenzen:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Erstellen Sie eine Regular Web Application. Setzen Sie Allowed Callback URLs auf die exakte Callback-URL unten,
aktivieren Sie Authorization Code, verwenden Sie S256 PKCE und wählen Sie RS256 für ID-Token-Signaturen. Setzen Sie
Token Endpoint Authentication Method auf Basic. Kopieren Sie Client-ID und Client-Geheimnis. Übernehmen Sie den Issuer
aus der Discovery des gewählten Tenants oder der eigenen Domain einschließlich abschließendem Schrägstrich; mischen Sie
keine Domains.

Erstellen Sie eine Login / Post Login Action mit dem Beispiel unten. Ersetzen Sie REPLACE_WITH_REPOVIO_CLIENT_ID,
veröffentlichen Sie die Action und binden Sie sie in den Login-Flow ein. Pflegen Sie administrativ für jeden Benutzer
app_metadata.repovio_groups als Array mit repovio-admins, repovio-managers oder repovio-viewers. Verwenden Sie keine
benutzerveränderbaren user_metadata zur Autorisierung. Auth0 gibt diese Gruppen nicht automatisch aus; ein Claim nur im
Access-Token reicht nicht. Tragen Sie in Repovio den gesamten namespaced Claim als exakten Gruppen-Claim-Namen ein und
ordnen Sie die drei Werte ihren Rollen zu.

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

Referenzen: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Prüfung und Fehlerdiagnose

Registrieren Sie bei jedem Provider OIDC_CALLBACK_URL exakt, fordern Sie openid profile email an und verwenden Sie
Authorization Code mit S256 PKCE und asymmetrischer Signatur. Speichern Sie Issuer, Client-ID, Client-Geheimnis, Scopes
und Gruppen-Claim unter Einstellungen → Authentifizierung und führen Sie Verbindung prüfen aus. Erfolgreiche Discovery
prüft keine Gruppen-Claims eines Benutzers.

Testen Sie getrennte Benutzer für SYSTEM_ADMIN, MANAGER und VIEWER sowie einen nicht zugeordneten Benutzer, der bei
deaktivierter Viewer-Freigabe abgewiesen werden muss. Prüfen Sie bei Fehlern die exakte Gruppenschreibweise,
Keycloak-Pfadeinstellungen, Entra-Objekt-IDs und den namespaced Auth0-Claim im ID-Token. Behalten Sie einen lokalen
Administrator zur Wiederherstellung. OIDC-Gruppen vergeben nur globale Rollen; Repository-Zugriff benötigt eigene
Repovio-Zuweisungen. Konfigurieren Sie jeweils nur einen Identitätsanbieter.

<a id="oidc-api-contract"></a>

### OIDC API-Vertrag

| Methode      | Pfad                         | Zugriff             | Zweck                                                                                |
| ------------ | ---------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `GET`        | `/api/v1/auth/oidc/status`   | Öffentlich          | Gibt nur die effektive Verfügbarkeit und den optionalen Anbieternamen zurück.        |
| `GET`        | `/api/v1/auth/oidc/start`    | Öffentlich          | Startet einen browsergebundenen Autorisierungscode und eine S256-PKCE-Transaktion.   |
| `GET`        | `/api/v1/auth/oidc/callback` | Öffentlich          | Validiert die Anbieterantwort und leitet mit einem einmaligen Fragmentcode weiter.   |
| `POST`       | `/api/v1/auth/oidc/exchange` | Öffentlich          | Verbraucht den Fragmentcode einmal und gibt den normalen Träger `AuthResult` zurück. |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Systemadministrator | Liest oder aktualisiert geheimnissichere OIDC-Einstellungen.                         |
| `POST`       | `/api/v1/auth/oidc/check`    | Systemadministrator | Überprüft die gespeicherte Discovery-Konfiguration, ohne sie zu ändern.              |

Der Rückruf platziert niemals ein Träger-JWT in einer URL. Sein undurchsichtiger Austauschcode läuft nach 60 Sekunden ab
und kann nur einmal verwendet werden. Anbieterfehler werden auf stabile Fehlercodes reduziert, bevor sie den Browser
oder die Protokolle erreichen.

<a id="change-your-password"></a>

## Ändern Sie Ihr Passwort

Öffnen Sie, während Sie angemeldet sind, **Einstellungen → Allgemein → Passwort ändern**. Geben Sie das aktuelle
Passwort, das neue Passwort und dessen Bestätigung ein. Repovio behält die Anmeldung des aktuellen Browsers mit einem
Ersatzzugriffstoken bei und macht die von jeder anderen angemeldeten Sitzung gehaltenen Token ungültig.

<a id="reset-a-forgotten-password"></a>

## Setzen Sie ein vergessenes Passwort zurück

Repovio verzichtet bewusst auf eine E-Mail-basierte Passwortzurücksetzung. Ein Bereitstellungsadministrator kann ein
lokales Konto aus dem Verzeichnis mit `compose.yml` zurücksetzen. Lesen Sie das Ersatzkennwort, ohne es zurückzugeben
oder im Shell-Verlauf zu speichern, und senden Sie es dann über die Standardeingabe an den API-Container:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Ersetzen Sie `USERNAME` durch den genauen Login-Benutzernamen. Der Befehl erfordert ein Passwort zwischen 12 und 256
Zeichen, aktualisiert nur das lokale Konto und macht alle vorhandenen Zugriffstoken ungültig. Melden Sie sich
anschließend erneut mit dem neuen Passwort an. Der Befehl lehnt von OIDC verwaltete Konten ab, da diese kein lokales
Kennwort haben.

<a id="local-user-and-group-management"></a>

## Lokale Zugriffsgruppen

Im Bereich Gruppenzugriff eines Repositorys eine Gruppe mit Leseberechtigung oder Repository-Verwaltung zuweisen, Rolle
ändern oder Zuweisung entfernen. Direkte und geerbte Rechte werden kombiniert; Manager gewinnt vor Viewer.
Verwaltungsrechte benötigen weiterhin die globale Manager-Rolle; Systemadministration bleibt uneingeschränkt. Entzug
wirkt beim nächsten Request, sofern kein anderer Zugriff verbleibt. Gruppen sind lokal, unterstützen lokale sowie
OIDC-Konten und werden nicht aus OIDC-Claims synchronisiert.

[Lokale Zugriffsgruppen](/docs/next/users#local-access-groups)
