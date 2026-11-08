---
title: 'Erstmaliges Setup'
description: 'Erstellen Sie den ersten lokalen Administrator und verstehen Sie die einmalige Einrichtung.'
---

<a id="before-setup"></a>

## Vor der Einrichtung

Stellen Sie die API, die Webanwendung und PostgreSQL mit [Einsatz](/docs/next/deployment) bereit. Öffnen Sie die
Installations-URL. Wenn kein Benutzer vorhanden ist, leitet Repovio den Browser an `/auth/setup` weiter. Bestehende
Installationen behalten ihre Konten und öffnen stattdessen die Anmeldung. Setup erstellt ein lokales Repovio-Konto, kein
Anbieterkonto.

<a id="create-the-administrator"></a>

## Erstellen Sie den Administrator

Geben Sie einen optionalen Vor- und Nachnamen, einen eindeutigen Benutzernamen, ein Passwort und eine
Passwortbestätigung ein. Passwörter erfordern mindestens 12 Zeichen. Senden Sie das Setup-Formular einmal ab und warten
Sie auf die Anfrage. Nach erfolgreicher Einrichtung meldet sich der erste Systemadministrator an. Bei
Validierungsfehlern steht das Formular zur Korrektur zur Verfügung. Wenn ein anderer Betreiber die Einrichtung zuerst
abgeschlossen hat, fahren Sie mit einem vorhandenen Konto mit [anmelden](/docs/next/sign-in) fort.

<a id="continue-configuration"></a>

## Konfiguration fortsetzen

Schließen Sie einen [Anbieterkonto](/docs/next/provider-accounts) an, wählen Sie [Repositories](/docs/next/repositories)
aus und überprüfen Sie [Synchronisationsjobs](/docs/next/guide-jobs). Lokale Benutzer können über die geschützte API
erstellt werden; Auf der Seite „Benutzer“ werden Konten aufgelistet und das Löschen sowie der MCP-Zugriff verwaltet.
Alternativ können Sie [OIDC](/docs/next/authentication) für vom Identitätsanbieter verwaltete Konten konfigurieren. Neue
Nicht-Administratoren benötigen explizite Repository-Mitgliedschaften.

Wenn die Einrichtung fehlschlägt, überprüfen Sie die API-/Datenbankverfügbarkeit und die Bereitstellungsprotokolle, ohne
Anmeldeinformationen zu veröffentlichen. Setzen Sie die Datenbank nicht zurück, um die Einrichtung zu wiederholen.
Informationen zu einem vorhandenen lokalen Administrator finden Sie unter
[Passwortwiederherstellung](/docs/next/authentication#reset-a-forgotten-password).

<a id="local-user-and-group-management"></a>

## Lokale Konten erstellen und zurücksetzen

Unter Administration → Benutzer in der Toolbar Neuer Benutzer wählen. Eindeutigen Benutzernamen, optional Vor- und
Nachnamen, Passwort mit 12–256 Zeichen samt Bestätigung und eine Rolle angeben; Standard ist Leseberechtigung. Das
Erstellen bleibt bei aktiviertem OIDC verfügbar. OIDC-Konten entstehen beim Identitätsanbieter und werden nicht anhand
gleicher lokaler Benutzernamen verknüpft.

[Lokale Zugriffsgruppen](/docs/next/users#local-access-groups)
