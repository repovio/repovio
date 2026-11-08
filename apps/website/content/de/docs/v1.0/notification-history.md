---
title: 'Zustellhistorie'
description: 'Überprüfen Sie die Benachrichtigungsergebnisse und die sicheren Zustellungsdetails pro Versuch.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="review-deliveries"></a>

## Lieferungen überprüfen

Nur Systemadministratoren können **Benachrichtigungen → Lieferverlauf** öffnen. Die Tabelle unterscheidet
Ereigniszustellungen von Tests und zeigt Ereignistyp, Repository, Betreff-/Anbieter-Link, Kanal, Status, Versuchsanzahl,
nächster Versuch und bereinigter Endfehler. Filtern Sie nach Art/Status und verwenden Sie Sortierung, Spaltensteuerung
und Paginierung.

Öffnen Sie eine Zustellung für ihren Betreff, den Anforderer (sofern vorhanden), den Kanal, den Status sowie den
Zeitstempel pro Versuch, die Gerätebezeichnung und den Fehler. Geheimnisse, Rohtransportziele und
Anbieteranmeldeinformationen werden niemals zurückgegeben. Browser-Push-Übermittlungen können Versuche für separate
abonnierte Geräte enthalten.

<a id="interpret-outcomes"></a>

## Ergebnisse interpretieren

Der Zeitpunkt „Ausstehend/Wiederholung“ beschreibt eine dauerhafte Zustellungsarbeit, nicht eine Workflow-Warteschlange
des Anbieters. Ein erfolgreicher Versuch bestätigt, dass das Transportunternehmen die Lieferung angenommen hat. Ein
Fehler erfordert eine Untersuchung der Kanalkonfiguration und des Zieldienstes. In dieser Verlaufsansicht gibt es keine
Aktionen zum erneuten Ausführen, Abbrechen oder manuellen Wiederholen. Korrigieren Sie [Kanal](/docs/v1.0/notifications)
und verwenden Sie seine Testaktion, um die Konfiguration zu überprüfen.

Eine leere Tabelle kann Filter oder keine zurückgehaltenen Lieferungen widerspiegeln. Eine fehlgeschlagene
Listen-/Detailanfrage wird separat angezeigt; Versuchen Sie es nach der Wiederherstellung erneut. Die anfängliche
Synchronisierung führt möglicherweise absichtlich zu keinen Lebenszykluslieferungen. Der externe Link des Betreffs
öffnet den Anbieterkontext, ohne Repovio Schreibzugriff zu gewähren.
