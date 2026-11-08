---
title: 'Einstellungen'
description:
  'Hier finden Sie persönliche Einstellungen sowie Authentifizierungs- und Systemkontrollen nur für Administratoren.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="settings-tabs"></a>

## Registerkarten „Einstellungen“.

Öffnen Sie **Einstellungen** im Benutzermenü. Jeder authentifizierte Benutzer kann auf**Allgemein** und**MCP**
zugreifen. Systemadministratoren sehen auch **Authentifizierung** und**System**. Die Administratorgruppierung der
Seitenleiste hindert andere angemeldete Benutzer nicht daran, ihre persönlichen Einstellungen über das Benutzermenü zu
öffnen.

Allgemein enthält [Profil](/docs/v1.0/profile), [Avatar](/docs/v1.0/avatar) und für lokale Konten
[Passwort](/docs/v1.0/password). Von OIDC verwaltete Benutzer sehen anstelle lokaler Profil-/Passwortformulare einen
Hinweis zur Identitätsverwaltung, können ihren Avatar jedoch weiterhin bearbeiten. [MCP](/docs/v1.0/mcp) verwaltet
persönliche Lesezugriffstoken.

<a id="related-preferences"></a>

## Verwandte Einstellungen

[Sprache](/docs/v1.0/language) und [Aussehen](/docs/v1.0/appearance) werden aus den App-/Benutzersteuerelementen
ausgewählt. Administratoren konfigurieren [OIDC-Authentifizierung](/docs/v1.0/authentication) und
[Systemvorgaben](/docs/v1.0/settings-system) in ihren jeweiligen Registerkarten. Ein fehlender Tab kann für Ihre Rolle
richtig sein; Durch das Ändern einer URL wird keine Autorisierung gewährt. Versuchen Sie fehlgeschlagene
Einstellungsanfragen erst erneut, nachdem Sie die API-Konnektivität überprüft haben.
