---
title: 'Dashboard'
description: 'Lesen Sie den aktuellen Workflow-Zustand, Arbeitszusammenfassungen und historische Diagramme.'
---

<a id="scope-and-date-range"></a>

## Geltungsbereich und Datumsbereich

Jede Karte und jedes Diagramm verwendet nur Repositorys, die der angemeldete Benutzer lesen darf. Wählen Sie **Letzte 7
Tage**,**Letzte 30 Tage** oder**Letzte 90 Tage** für historische Statistiken. Der Zeitbereich ändert die Gesamtzahl der
abgeschlossenen Läufe, Erfolgs-/Fehlertrends, Dauer und Statusverteilung. Die aktuellen Warteschlangen- und
Arbeitsaufgabenzahlen bleiben Zusammenfassungen des aktuellen Status. Wählen Sie **Aktualisieren**, um das Dashboard neu
zu laden; Die Steuerung bleibt beschäftigt, bis ihre Anforderungen erledigt sind.

<a id="summary-and-navigation"></a>

## Zusammenfassung und Navigation

Die Workflow-Zusammenfassung enthält die Anzahl der Erfolge/Abschlüsse, die Anzahl der aktiven
Warteschlangen/Ausführungen, die mittlere abgeschlossene Dauer, aktuelle Fehler, die Anzahl der wartenden Genehmigungen
und die Gesamtlaufzeit. Befolgen Sie aktuelle Fehler gemäß [Handlungsbedarf](/docs/next/needs-attention) oder
ausstehende Genehmigungen gemäß [Ausstehende Freigaben](/docs/next/awaiting-approval). Issue- und
Pull-Request-Zusammenfassungen sind mit ihren eigenen gefilterten Listen verknüpft. Manager und Administratoren sehen
außerdem Zusammenfassungen der Sicherheitswarnungen für die von ihnen verwalteten Repositorys.

Die Active-Runs-Karte öffnet einen entfernbaren `preset=active`-Filter; Aktuelle Arbeitsaufgabenkarten öffnen auch
entfernbare Voreinstellungen. Manuelle Filterwechsel geben die Voreinstellung frei.

Das Trenddiagramm vergleicht erfolgreiche und fehlgeschlagene abgeschlossene Läufe im Zeitverlauf.
Statusverteilungsgruppen normalisierte Zustände. **Letzte Ausführungen** zeigt die aktuelle Workflow-Aktivität mit Links
zum Anbieter. Es handelt sich nicht um einen eingebetteten Anbieterprotokoll-Viewer. Repovio kann Workflows von keinem
Dashboard-Widget aus genehmigen oder erneut ausführen.

<a id="empty-and-partial-results"></a>

## Leere und unvollständige Ergebnisse

Keine abgeschlossenen Läufe im ausgewählten Zeitraum führen zu leeren Diagrammen. Null aktuelle Ausfälle unterscheiden
sich von einer fehlenden Anbieterverbindung. Wenn eine Anfrage fehlschlägt, weist ein Fehlerbanner auf die teilweise
Auslastung hin, während verfügbare Abschnitte weiterhin sichtbar bleiben. Aktualisieren Sie nach der Wiederherstellung
oder überprüfen Sie [Jobs](/docs/next/guide-jobs) und die letzte Synchronisierung des Repositorys.
