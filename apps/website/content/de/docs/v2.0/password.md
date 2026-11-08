---
title: 'Passwort'
description:
  'Ändern Sie ein lokales Passwort und verstehen Sie die Ungültigmachung und Wiederherstellung von Sitzungen.'
---

<a id="change-a-password"></a>

## Ändern Sie ein Passwort

Für ein lokales Konto öffnen Sie **Einstellungen → Allgemein → Passwort ändern**. Geben Sie das aktuelle Passwort, ein
neues Passwort mit 12 bis 256 Zeichen und eine entsprechende Bestätigung ein. Einmal absenden und auf den Abschluss
warten. Ein ungültiges aktuelles Passwort, ein kurzes Passwort oder eine nicht übereinstimmende Bestätigung müssen vor
einem erneuten Versuch korrigiert werden.

Eine erfolgreiche Änderung gibt ein Ersatztoken für den aktuellen Browser zurück und macht die anderen vorhandenen
Sitzungen des Kontos ungültig. Andere Geräte müssen sich erneut mit dem neuen Passwort anmelden. Dadurch wird nur das
Repovio-Konto geändert, nicht jedoch die PATs des Anbieters, die OAuth-Anmeldeinformationen, die
Benachrichtigungsanmeldeinformationen oder die MCP-Token-Konfiguration.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC und vergessene Passwörter

Von OIDC verwaltete Konten verfügen nicht über ein lokales Passwortformular. Ändern Sie das Passwort des
Identitätsanbieters bei diesem Anbieter. Repovio verfügt bewusst über keinen E-Mail-basierten Reset-Flow. Ein
Bereitstellungsbetreiber kann das dokumentierte
[lokaler Wiederherstellungsbefehl](/docs/v2.0/authentication#reset-a-forgotten-password) verwenden; Es lehnt OIDC-Konten
ab und macht bestehende Sitzungen ungültig. Fügen Sie niemals ein Ersatzkennwort in den Shell-Verlauf oder einen
Problembericht ein.

<a id="local-user-and-group-management"></a>

## Lokale Konten erstellen und zurücksetzen

Bei lokalen Konten setzt die Zeilenaktion Passwort zurücksetzen ein neues Passwort ohne Kenntnis des bisherigen. Neues
Passwort und Bestätigung eingeben. Bestehende JWT-Sitzungen werden ungültig; beim eigenen Konto folgt die Abmeldung.
OIDC-Konten bieten diese Aktion nicht. MCP-Tokens bleiben bestehen.

[Lokale Zugriffsgruppen](/docs/v2.0/users#local-access-groups)
