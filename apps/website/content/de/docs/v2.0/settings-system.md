---
title: 'Systemeinstellungen'
description: 'Konfigurieren Sie unabhängige Aufbewahrungsrichtlinien und das Standardformat für Datum und Uhrzeit.'
---

<a id="administrator-access"></a>

## Administratorzugriff

Nur Systemadministratoren können **Einstellungen → System** öffnen. Beim Laden wird ein Skelett angezeigt; Ein
fehlgeschlagener Ladevorgang führt zu einem Fehler und einem erneuten Versuch anstelle von bearbeitbaren Standardwerten,
die aus fehlenden Daten abgeleitet werden. Warten Sie auf die Einstellungsanfrage, bevor Sie die Änderungen speichern.

<a id="retention-defaults"></a>

## Aufbewahrungsvorgaben

Legen Sie separate Standardaufbewahrungsfristen für Workflow-Ausführungen, Probleme und Pull Requests fest. Jeder Wert
muss zwischen 1 und 3650 Tagen liegen. Ein Repository kann jeden entsprechenden Wert unabhängig überschreiben; Durch
eine Überschreibung eines leeren Repositorys wird dieser Systemstandard wiederhergestellt. Die Aufbewahrung wirkt sich
auf den lokal gespeicherten Verlauf aus, nicht auf anbieterseitige Datensätze. Durch die Verkürzung der Aufbewahrung
können ältere gespeicherte Daten gelöscht werden. Überprüfen Sie daher zunächst die Berichts- und
Untersuchungsanforderungen.

Die Aufbewahrungs- und Nachverfolgungskontrollen für das Repository sind in [Repositories](/docs/v2.0/repositories)
dokumentiert. Eine fehlende historische Zeile kann eher auf die Aufbewahrung als auf eine fehlgeschlagene
Anbietersynchronisierung zurückzuführen sein.

<a id="datetime-formatting"></a>

## Datums-/Uhrzeitformatierung

Legen Sie das Standardformat für Datum und Uhrzeit fest und überprüfen Sie die Live-Vorschau vor dem Speichern. Die
Auswahl des Gebietsschemas steuert weiterhin den übersetzten Schnittstellentext und die vom Gebietsschema abhängige
Formatierung. Einmal speichern; Erfolg und Validierungs-/API-Fehler werden separat gemeldet. Versuchen Sie es nach der
Korrektur oder API-Wiederherstellung erneut. Eine Formatierungseinstellung ändert niemals die Zeitstempel des
ursprünglichen Anbieters.
