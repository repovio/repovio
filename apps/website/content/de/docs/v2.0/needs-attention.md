---
title: 'Handlungsbedarf'
description: 'Untersuchen Sie Workflow-Kontexte, deren letzte abgeschlossene Ausführung fehlgeschlagen ist.'
---

<a id="current-failures"></a>

## Aktuelle Ausfälle

Öffnen Sie **Workflow wird ausgeführt → Erfordert Aufmerksamkeit**. Im Gegensatz zu historischen fehlgeschlagenen
Ausführungen behält diese Warteschlange umsetzbare Workflow-Kontexte bei, deren letzte abgeschlossene Ausführung
fehlgeschlagen ist. Bei einer neueren erfolgreichen Ausführung, einer geschlossenen zugehörigen Änderung oder einer
zusammengeführten Änderung wird der Kontext nach der Synchronisierung entfernt. Ältere verzweigungsbezogene Ausführungen
können mit der Pull-/Merge-Anforderung verknüpft werden, die beim Start aktiv war. Das Seitenleisten-Badge verwendet
dieselbe berechtigungsbezogene Warteschlange.

Durchsuchen und verwenden Sie die verfügbaren Tabellensteuerelemente, um den Workflow-/Repository-Kontext einzugrenzen.
Öffnen Sie den externen Ausführungslink für Protokolle und Korrekturen. Öffnen Sie die zugehörige Änderung, sofern
vorhanden. Repovio führt Workflows niemals erneut aus, bricht sie ab, bearbeitet sie oder sendet sie weiter.

<a id="diagnose-missing-or-stale-entries"></a>

## Fehlende oder veraltete Einträge diagnostizieren

Ein leeres Ergebnis kann nach einem erfolgreichen Ersetzungslauf korrekt sein. Für ältere Fehler verwenden Sie
[Alle Läufe](/docs/v2.0/workflow-runs). Löschen Sie Filter und überprüfen Sie die Repository-Mitgliedschaften, bevor Sie
einen fehlenden Kontext als fehlende Daten behandeln. Anbieteraktionen werden asynchron beobachtet; Überprüfen Sie
[Jobs](/docs/v2.0/guide-jobs), ob der Status veraltet bleibt. Lade- und Anforderungsfehler sind von einer leeren
Warteschlange getrennt; Versuchen Sie es nach der API-Wiederherstellung erneut.
