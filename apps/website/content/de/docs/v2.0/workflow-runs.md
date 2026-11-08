---
title: 'Alle Läufe'
description:
  'Durchsuchen, filtern und überprüfen Sie den gespeicherten Workflow-Verlauf, ohne die Ressourcen des Anbieters zu
  ändern.'
---

<a id="browse-retained-runs"></a>

## Durchsuchen Sie beibehaltene Läufe

Öffnen Sie **Übersicht → Workflow-Ausführungen → Alle Ausführungen**. Die Ergebnisse sind auf zugängliche Repositorys
und den beibehaltenen Verlauf beschränkt. Verwenden Sie Filter für Repository, Anbieter, Status und Dauer (die Dauer
wird in Sekunden eingegeben). Alle Läufe haben kein Textsuchfeld; Erfordert Aufmerksamkeit, fügt Suche und detaillierte
erstellte/gestartete Spalten hinzu. Sortieren Sie Spalten, ändern Sie sichtbare Spalten und paginieren Sie die
Ergebnisse. Filter löschen, wenn ein erwarteter Lauf fehlt.

Zeilen identifizieren den Workflow und das Repository, den Anbieter, den normalisierten Status, die Zeitstempel des
Anbieters und die Dauer, sofern bereitgestellt. Bei in der Warteschlange befindlichen oder noch nicht abgeschlossenen
Läufen fehlt möglicherweise die Abschlusszeit oder Enddauer. Normalisierte Zustände sind `queued`, `running`, `success`,
`failed`, `cancelled`, `skipped` und `unknown`. Ein unbekannter Zustand muss beim Anbieter überprüft werden.

<a id="open-a-run"></a>

## Öffne einen Lauf

Verwenden Sie die externe Zeilenaktion, um die Anbieterausführung und ihre Protokolle zu öffnen. Repovio bietet keinen
separaten bearbeitbaren Ausführungsbildschirm, lädt keine Anbieterartefakte herunter und synchronisiert keine
vollständigen Protokolle. Genehmigen, erneut ausführen, stornieren oder versenden nur beim Anbieter mit Ihrem
Anbieterkonto. Für aktuelle Ausfälle verwenden Sie [Handlungsbedarf](/docs/v2.0/needs-attention); Für Tore verwenden Sie
[Ausstehende Freigaben](/docs/v2.0/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Fehlender oder veralteter Verlauf

Eine leere Tabelle bedeutet, dass kein aufbewahrter Datensatz den Filtern und Ihren Berechtigungen entspricht. Durch die
Aufbewahrung können ältere Läufe entfernt werden. Überprüfen Sie die Repository-Aktivierung, Mitgliedschaften,
Workflow-Zulassungs-/Verweigerungsmuster und [Jobs](/docs/v2.0/guide-jobs). Bei einer Seitenaktualisierung werden
gespeicherte Daten neu geladen. Die dauerhafte Synchronisierungswarteschlange wird nicht umgangen. Versuchen Sie es
erneut mit Ladefehlern nach der API-Wiederherstellung.
