---
title: 'Abhängigkeitswarnungen'
description: 'Überprüfen Sie Abhängigkeitswarnungen mit Repository-weitem Verwaltungszugriff.'
---

<a id="access-and-provider-support"></a>

## Zugang und Anbieterunterstützung

Öffnen Sie **Übersicht → Sicherheitswarnungen → Abhängigkeitswarnungen**. Manager benötigen Verwaltungszugriff auf das
Repository; Systemadministratoren können alle Repositorys überprüfen. Zuschauer haben keinen Zugriff auf Alarmdaten. Für
Listen, Filteroptionen, Zähler, Details, Repository-Aktivität und Dashboard-Metriken gelten dieselben
Zugriffsbeschränkungen.

GitHub unterstützt diesen Warnungstyp über seine Sicherheits-APIs. GitLab ordnet Schwachstellen in den Bereichen
Dependency Scanning, SAST und Secret Detection den entsprechenden Alarmansichten zu, abhängig von Instanz-/Lizenz- und
Token-Berechtigungen. Forgejo und Gitea melden diese Typen derzeit als nicht unterstützt. Eine Warnung für einen nicht
verfügbaren Typ führt nicht dazu, dass andere Synchronisierungsbereiche fehlschlagen.

<a id="review-findings"></a>

## Überprüfen Sie die Ergebnisse

Verwenden Sie Such- und verfügbare Repository-, Anbieter-, Schweregrad- und Statusfilter, Sortierung, sichtbare Spalten
und Paginierung. Zu den Staaten gehören `OPEN`, `RESOLVED` und `DISMISSED`; Der Schweregrad umfasst „Kritisch“, „Hoch“,
„Mittel“, „Niedrig“, „Informativ“ und „Unbekannt“. Abhängigkeitsfilter umfassen außerdem Ökosystem, Paket und Manifest.
Aktualisierte Datumsgrenzen und artspezifische Textsuche helfen dabei, große Listen einzugrenzen. Wählen Sie einen
Befund aus, um den Paketnamen, das Ökosystem, den Schweregrad, die Metadaten der Schwachstelle und den Speicherort der
betroffenen Abhängigkeit zu überprüfen. Repovio speichert nur Metadaten auf der Zulassungsliste; Unformatierte Payloads,
Anmeldeinformationen, Token-Fragmente und geheime Werte des Anbieters werden niemals beibehalten. Fehlende Felder können
eher auf die Fähigkeiten des Anbieters als auf einen Verarbeitungsfehler hinweisen.

Verwenden Sie **Im Anbieter öffnen** zur Untersuchung und Behebung. Repovio schließt, löst, öffnet oder bearbeitet keine
Warnungen. Der erste erfolgreiche Lesevorgang pro Repository und Warnungsart erstellt eine stille Baseline. Später
geöffnete, gelöste, verworfene oder erneut geöffnete Übergänge können abonnierte
[Benachrichtigungskanäle](/docs/next/notifications) auslösen.

<a id="empty-unavailable-and-stale-data"></a>

## Leere, nicht verfügbare und veraltete Daten

Löschen Sie die Filter und überprüfen Sie die Managementmitgliedschaft, wenn keine Ergebnisse angezeigt werden.
Überprüfen Sie [Jobs](/docs/next/guide-jobs) auf nicht unterstützte Typen oder Berechtigungswarnungen. Bestehende GitHub
OAuth-Konten müssen möglicherweise erneut mit `security_events` autorisiert werden. siehe
[Anbieter OAuth](/docs/next/provider-oauth). Versuchen Sie fehlgeschlagene Ladevorgänge nach der Wiederherstellung
erneut. Das Fehlen sichtbarer Ergebnisse ist kein Beweis dafür, dass der Anbieter das Repository gescannt hat oder dass
jeder Alarmtyp unterstützt wird.

## Nicht verfügbare Warnungen untersuchen

Wähle unter **Jobs** neben einer Warnung **Details**. Andere Synchronisierungsbereiche wurden abgeschlossen; nicht
verfügbare Warnungen bedeuten nicht, dass das Repository keine Sicherheitsbefunde hat. Fehlende Berechtigungen und
nicht verfügbare oder deaktivierte Sicherheitsfunktionen können bei GitHub dieselbe Antwort verursachen. Die Warnung
belegt daher keine eindeutige Ursache. Prüfe die Sicherheitsfunktionen des Repositorys und die Leseberechtigungen der
Verbindung. GitHub-App-Installationen benötigen die optionale Berechtigung Dependabot alerts (`vulnerability_alerts`);
bestätige bei Bedarf aktualisierte Installationsberechtigungen in GitHub. Prüfe entsprechend die PAT-Berechtigungen
oder autorisiere die OAuth-Verbindung erneut. Versuche den Job anschließend erneut. Repovio ändert keine
Provider-Berechtigungen und aktiviert keine Sicherheitsfunktionen.
