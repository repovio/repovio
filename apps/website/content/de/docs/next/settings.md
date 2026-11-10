---
title: 'Einstellungen'
description: 'Hier finden Sie persönliche Einstellungen sowie Authentifizierungs- und Systemkontrollen nur für Administratoren.'
---

<a id="settings-tabs"></a>

## Registerkarten „Einstellungen“.

Öffnen Sie **Einstellungen** im Benutzermenü. Jeder authentifizierte Benutzer kann auf**Allgemein** und**MCP**
zugreifen. Systemadministratoren sehen auch **Authentifizierung** und**System**. Die Administratorgruppierung der
Seitenleiste hindert andere angemeldete Benutzer nicht daran, ihre persönlichen Einstellungen über das Benutzermenü zu
öffnen.

Allgemein enthält [Profil](/docs/next/profile), [Avatar](/docs/next/avatar) und für lokale Konten
[Passwort](/docs/next/password). Von OIDC verwaltete Benutzer sehen anstelle lokaler Profil-/Passwortformulare einen
Hinweis zur Identitätsverwaltung, können ihren Avatar jedoch weiterhin bearbeiten. [MCP](/docs/next/mcp) verwaltet
persönliche Lesezugriffstoken.

<a id="related-preferences"></a>

## Verwandte Einstellungen

[Sprache](/docs/next/language) und [Aussehen](/docs/next/appearance) werden aus den App-/Benutzersteuerelementen
ausgewählt. Administratoren konfigurieren [OIDC-Authentifizierung](/docs/next/authentication) und
[Systemvorgaben](/docs/next/settings-system) in ihren jeweiligen Registerkarten. Ein fehlender Tab kann für Ihre Rolle
richtig sein; Durch das Ändern einer URL wird keine Autorisierung gewährt. Versuchen Sie fehlgeschlagene
Einstellungsanfragen erst erneut, nachdem Sie die API-Konnektivität überprüft haben.

<a id="repository-settings"></a>

## Repository-Einstellungen

Die Repository-Konfiguration ist von den persönlichen Einstellungen getrennt. Systemadministratoren wechseln dort zwischen Allgemein, Webhook, Workflow-Filter, Mitglieder und Gruppenzugriff. Direkte Adressen und die Lebensdauer von Entwürfen erläutert der Abschnitt
[Bereiche der Repository-Einstellungen](/docs/next/repositories#repository-settings-sections).
