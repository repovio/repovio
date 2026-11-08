---
title: 'Repository-Synchronisierungsjobs'
description: 'Überwachen und starten Sie manuell Repovio-Repository-Synchronisierungsjobs.'
---

Öffnen Sie **Jobs** im Abschnitt**Operations**, um die Synchronisierungsarbeit für jedes aktivierte Repository zu
überprüfen, auf das Sie zugreifen können. Die Zusammenfassung zeigt laufende, wartende, fehlgeschlagene und inaktive
Jobs. Die Tabelle identifiziert das Repository, den Anbieter, die synchronisierten Domänen, die aktuelle Phase, den
Elementfortschritt, den Versuch und die neueste sichere Fehlermeldung.

<a id="read-job-state"></a>

## Auftragsstatus lesen

- **Leerlauf** bedeutet, dass für das Repository keine Synchronisierung in der Warteschlange steht oder ausgeführt wird.
- **Ausstehend** bedeutet, dass die dauerhafte Anforderung auf die geplante Zeit oder einen verfügbaren Worker wartet.
- **Running** zeigt die aktive Phase und den Artikelfortschritt an, wenn der Anbieter eine messbare Gesamtsumme meldet.
- **Fehlgeschlagen** behält eine sichere Fehlerzusammenfassung und Versuchsanzahl bei, bis das Repository erneut in die
  Warteschlange gestellt wird. – **Warnung** bedeutet, dass andere Bereiche abgeschlossen wurden, während eine oder
  mehrere Arten von Sicherheitswarnungen nicht verfügbar waren.

Die Spalte „Bereiche“ gibt an, ob der Job Workflows, Issues, Pull-Requests, Sicherheitswarnungen oder eine Kombination
davon liest. Eine Wartezeit kann sich auf Webhook-Zusammenführung, Wiederholungs-Backoff oder Anweisungen zur
Ratenbegrenzung des Anbieters beziehen. Durch wiederholtes Aktualisieren der Seite wird die geplante Zeit nicht nach
vorne verschoben.

<a id="start-or-retry-synchronization"></a>

## Synchronisierung starten oder erneut versuchen

Ein Systemadministrator kann jeden derzeit inaktiven, fehlgeschlagenen oder Warnauftrag mit **Alle ausführen** starten
oder **Ausführen** oder**Wiederholen** für eine Repository-Zeile verwenden. Aufträge, die bereits ausstehen oder
ausgeführt werden, werden nicht erneut in die Warteschlange gestellt. Die initiierende Schaltfläche bleibt in ihrem
Ladezustand, bis die Anforderung abgeschlossen ist. Folgen Sie dann der Zeile, während sie sich durch „Ausstehend“,
„Wird ausgeführt“ und „Leerlauf“ oder „Fehler“ bewegt.

Manuelle Jobs verwenden dieselbe dauerhafte, schreibgeschützte Anbietersynchronisierungswarteschlange wie geplante
Abstimmungen und überprüfte Webhooks. Sie rufen Anbieterdaten ab, können jedoch keine Repositorys, Workflows, Issues
oder Pull Requests ändern.

Erfolgreiche Jobs kehren in den **Leerlauf** zurück und werden nicht als Ausführungsverlauf gespeichert. Fehlgeschlagene
Jobs bleiben sichtbar, bis sie durch einen späteren Webhook, einen Abgleichszyklus oder einen manuellen
Wiederholungsversuch erneut in die Warteschlange gestellt werden. Wenn ein Wiederholungsversuch weiterhin fehlschlägt,
überprüfen Sie das Anbieterkonto, die Lesebereiche, die Basis-URL und den Ratenbegrenzungsstatus in
[Verwaltung und Einstellungen](/docs/v2.0/provider-accounts), bevor Sie es erneut versuchen.

<a id="refresh-and-table-controls"></a>

## Aktualisierungs- und Tabellensteuerelemente

Jobs werden alle fünf Sekunden automatisch aktualisiert. Die Tabelle ist standardmäßig auf zehn Zeilen pro Seite
eingestellt und merkt sich die Seitengröße. „Alle ausführen“ umfasst inaktive, fehlgeschlagene und Warnungsjobs.
Ausstehende/laufende Zeilen können nicht erneut in die Warteschlange gestellt werden. Anfängliche und
Hintergrundladefehler werden getrennt von Jobfehlern angezeigt. Sortierung und Paginierung helfen bei der Inspektion
größerer Installationen.
