---
title: 'Melden Sie sich an'
description: 'Verwenden Sie lokale Anmeldeinformationen oder OpenID Connect und beenden Sie eine Sitzung sicher.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="local-sign-in"></a>

## Lokale Anmeldung

Öffnen Sie `/auth/signin`, geben Sie den lokalen Benutzernamen und das Passwort ein und wählen Sie **Anmelden**. Warten
Sie, bis die Authentifizierung abgeschlossen ist. Bei abgelehnten Anmeldeinformationen bleiben Sie auf dem Formular.
Überprüfen Sie den Benutzernamen und fragen Sie den Bereitstellungsbetreiber nach
[Passwortwiederherstellung](/docs/v1.0/authentication#reset-a-forgotten-password). Repovio bietet keine
Passwortzurücksetzung per E-Mail.

Stattdessen wird bei einer Neuinstallation [Erstmaliges Setup](/docs/v1.0/setup) geöffnet. Nach der Authentifizierung
hängen Navigation und Ergebnisse von Ihrer Rolle und Ihren Repository-Mitgliedschaften ab. Ein leeres Dashboard bedeutet
nicht, dass die Anmeldung fehlgeschlagen ist.

<a id="openid-connect"></a>

## OpenID Connect

Wenn ein Administrator OIDC aktiviert, verwenden Sie die zusätzliche Anmeldeschaltfläche für den Anbieter. Schließen Sie
die Authentifizierung auf der eigenen Seite des Identitätsanbieters ab und lassen Sie den Rückruf abschließen. Eine
verweigerte Gruppenzuordnung, eine abgelaufene Transaktion oder ein Anbieterfehler geben einen Fehler zurück; einen
neuen Anmeldeversuch starten. OIDC verknüpft niemals ein bestehendes lokales Konto durch Abgleichen seiner
E-Mail-Adresse.

Die OIDC-Anmeldung erfolgt getrennt von den Provider-OAuth-Verbindungen. Es authentifiziert einen Repovio-Benutzer. Es
werden keine GitHub-, GitLab-, Forgejo- oder Gitea-Repositorys verbunden. Identitätsverwaltete Namen und Passwörter
müssen beim Identitätsanbieter geändert werden.

<a id="sign-out"></a>

## Abmelden

Wählen Sie im Benutzermenü die Option „Abmelden“. Durch das Abmelden wird die Browsersitzung entfernt, ohne dass
Repositorys gelöscht, Anbieteranmeldeinformationen geändert oder Anbieterressourcen geändert werden. Melden Sie sich auf
einem gemeinsam genutzten Gerät ab, wenn Sie fertig sind. Wenn eine API-Sitzung abläuft, melden Sie sich erneut an,
bevor Sie die fehlgeschlagene Aktion erneut versuchen. Die lokale Passwortanmeldung bleibt verfügbar, wenn OIDC
aktiviert ist.
