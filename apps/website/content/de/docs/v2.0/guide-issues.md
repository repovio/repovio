---
title: 'Issues'
description: 'Durchsuchen Sie synchronisierte Issues, Filter und schreibgeschützte Details.'
---

<a id="browse-and-filter"></a>

## Durchsuchen und filtern

Öffnen Sie **Übersicht → Issues**. Listen, Zusammenfassungen, Filteroptionen und Details verwenden
Repository-Mitgliedschaften. Suche nach Titel oder Nummer; Filtern Sie nach Anbieter, Repository, Lebenszyklus, Autor,
Beauftragter, Meilenstein, Labels und aktualisierter Zeit, sofern verfügbar. Aktualisierte Datumsgrenzen sind inklusive
UTC. Mehrere ausgewählte Labels müssen alle übereinstimmen. Ändern Sie die Sortierung, die sichtbaren Spalten und die
Paginierung mit den Tabellensteuerelementen. Zusammenfassungskarten zählen offene, kürzlich aktualisierte, zugewiesene
und veraltete Issues. Bei der ersten Synchronisierung werden alle offenen und geschlossenen Issues gelesen, die in den
letzten 90 Tagen aktualisiert wurden. Veraltetheit hilft, unbeaufsichtigte offene Arbeit zu finden; Der Anbieterstatus
wird dadurch nicht geändert.

<a id="inspect-details"></a>

## Details prüfen

Wählen Sie eine Zeile aus, um deren Repovio-Detailseite zu öffnen. Überprüfen Sie Identität, Repository, Autor,
Beauftragte, Labels, Meilenstein, Anbieterstatus, Zeitstempel und bereinigte Markdown-Beschreibung. Der verknüpfte
Workflow-Kontext wird angezeigt, sofern verfügbar. Eingebetteter HTML-Code und unsicheres Markup werden entfernt.
Kommentare, Reaktionen, Anhänge und Codeunterschiede werden nicht synchronisiert. Verwenden Sie den Anbieterlink zum
Kommentieren, Zuweisen, Kennzeichnen, Schließen, Überprüfen, Genehmigen oder Zusammenführen. Repovio führt keinen dieser
Schreibvorgänge durch.

<a id="synchronization-and-failures"></a>

## Synchronisation und Fehler

Signierte Webhooks stellen Repository-spezifische Lesevorgänge nach einem 15-sekündigen Zusammenführungsfenster in die
Warteschlange; Der 30-minütige Abgleich deckt verpasste Ereignisse ab. Bei einer Browseraktualisierung werden
gespeicherte Daten neu geladen. Wenn ein Datensatz fehlt, löschen Sie die Filter, überprüfen Sie die
Repository-Aktivierung und -Mitgliedschaft und überprüfen Sie [Jobs](/docs/v2.0/guide-jobs). Durch die Aufbewahrung
können alte geschlossene Datensätze entfernt werden. Eine nicht zugängliche Detailseite kann auf einen widerrufenen
Zugriff oder einen entfernten Datensatz hinweisen; zurück zur Liste. Anforderungsfehler nach der API-Wiederherstellung
wiederholen.
