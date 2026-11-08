---
title: 'Erstmaliges Setup'
description: 'Erstellen Sie den ersten lokalen Administrator und verstehen Sie die einmalige Einrichtung.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="before-setup"></a>

## Vor der Einrichtung

Stellen Sie die API, die Webanwendung und PostgreSQL mit [Einsatz](/docs/v1.0/deployment) bereit. Öffnen Sie die
Installations-URL. Wenn kein Benutzer vorhanden ist, leitet Repovio den Browser an `/auth/setup` weiter. Bestehende
Installationen behalten ihre Konten und öffnen stattdessen die Anmeldung. Setup erstellt ein lokales Repovio-Konto, kein
Anbieterkonto.

<a id="create-the-administrator"></a>

## Erstellen Sie den Administrator

Geben Sie einen optionalen Vor- und Nachnamen, einen eindeutigen Benutzernamen, ein Passwort und eine
Passwortbestätigung ein. Passwörter erfordern mindestens 12 Zeichen. Senden Sie das Setup-Formular einmal ab und warten
Sie auf die Anfrage. Nach erfolgreicher Einrichtung meldet sich der erste Systemadministrator an. Bei
Validierungsfehlern steht das Formular zur Korrektur zur Verfügung. Wenn ein anderer Betreiber die Einrichtung zuerst
abgeschlossen hat, fahren Sie mit einem vorhandenen Konto mit [anmelden](/docs/v1.0/sign-in) fort.

<a id="continue-configuration"></a>

## Konfiguration fortsetzen

Schließen Sie einen [Anbieterkonto](/docs/v1.0/provider-accounts) an, wählen Sie [Repositories](/docs/v1.0/repositories)
aus und überprüfen Sie [Synchronisationsjobs](/docs/v1.0/guide-jobs). Lokale Benutzer können über die geschützte API
erstellt werden; Auf der Seite „Benutzer“ werden Konten aufgelistet und das Löschen sowie der MCP-Zugriff verwaltet.
Alternativ können Sie [OIDC](/docs/v1.0/authentication) für vom Identitätsanbieter verwaltete Konten konfigurieren. Neue
Nicht-Administratoren benötigen explizite Repository-Mitgliedschaften.

Wenn die Einrichtung fehlschlägt, überprüfen Sie die API-/Datenbankverfügbarkeit und die Bereitstellungsprotokolle, ohne
Anmeldeinformationen zu veröffentlichen. Setzen Sie die Datenbank nicht zurück, um die Einrichtung zu wiederholen.
Informationen zu einem vorhandenen lokalen Administrator finden Sie unter
[Passwortwiederherstellung](/docs/v1.0/authentication#reset-a-forgotten-password).
