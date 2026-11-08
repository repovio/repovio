---
title: 'Code-Scan-Warnungen'
description: 'Überprüfen Sie Code-Scan-Warnungen mit Repository-weitem Verwaltungszugriff.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="access-and-provider-support"></a>

## Zugang und Anbieterunterstützung

Öffnen Sie **Übersicht → Sicherheitswarnungen → Code-Scan-Warnungen**. Manager benötigen Verwaltungszugriff auf das
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
„Mittel“, „Niedrig“, „Informativ“ und „Unbekannt“. Zu den Codefiltern gehören außerdem Scanner, Regeln und eine
spezielle Dateipfadauswahl. Aktualisierte Datumsgrenzen und artspezifische Textsuche helfen dabei, große Listen
einzugrenzen. Wählen Sie einen Befund aus, um Scanner, Regel, Schweregrad, sicheren Dateispeicherort und Befundstatus zu
überprüfen. Repovio speichert nur Metadaten auf der Zulassungsliste; Unformatierte Payloads, Anmeldeinformationen,
Token-Fragmente und geheime Werte des Anbieters werden niemals beibehalten. Fehlende Felder können eher auf die
Fähigkeiten des Anbieters als auf einen Verarbeitungsfehler hinweisen.

Verwenden Sie **Im Anbieter öffnen** zur Untersuchung und Behebung. Repovio schließt, löst, öffnet oder bearbeitet keine
Warnungen. Der erste erfolgreiche Lesevorgang pro Repository und Warnungsart erstellt eine stille Baseline. Später
geöffnete, gelöste, verworfene oder erneut geöffnete Übergänge können abonnierte
[Benachrichtigungskanäle](/docs/v1.0/notifications) auslösen.

<a id="empty-unavailable-and-stale-data"></a>

## Leere, nicht verfügbare und veraltete Daten

Löschen Sie die Filter und überprüfen Sie die Managementmitgliedschaft, wenn keine Ergebnisse angezeigt werden.
Überprüfen Sie [Jobs](/docs/v1.0/guide-jobs) auf nicht unterstützte Typen oder Berechtigungswarnungen. Bestehende GitHub
OAuth-Konten müssen möglicherweise erneut mit `security_events` autorisiert werden. siehe
[Anbieter OAuth](/docs/v1.0/provider-oauth). Versuchen Sie fehlgeschlagene Ladevorgänge nach der Wiederherstellung
erneut. Das Fehlen sichtbarer Ergebnisse ist kein Beweis dafür, dass der Anbieter das Repository gescannt hat oder dass
jeder Alarmtyp unterstützt wird.
