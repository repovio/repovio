---
title: 'Benachrichtigungskanäle'
description: 'Erstellen Sie globale Benachrichtigungsziele, abonnieren Sie Ereignisse und testen Sie die Zustellung.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="access-and-channel-list"></a>

## Zugriff und Kanalliste

Öffnen Sie **Operationen → Benachrichtigungen → Kanäle**. Kanäle sind globale Repovio-Konfigurationen, keine
Repository-eigene Managerkonfiguration. Systemadministratoren erstellen, bearbeiten, testen, aktivieren/deaktivieren und
löschen Kanäle. Der Repository-Manager-Status gewährt keine Kanalverwaltung. In der Tabelle werden Name, Typ, sichere
Zielmetadaten, abonnierte Ereignisse, aktivierter Status und Aktualisierungszeit angezeigt. Verwenden Sie
Typ-/aktivierte Filter, Sortierung, Spaltenoptionen und Paginierung.

<a id="create-a-destination"></a>

## Erstellen Sie ein Ziel

Wählen Sie **Kanal hinzufügen**, geben Sie einen Namen ein, wählen Sie einen Typ aus und konfigurieren Sie das Ziel:

- **E-Mail:** SMTP-Host/-Port, Transportsicherheit, Absender, optionale Authentifizierung und Empfänger.
- **Gotify:** Server-URL, Anwendungstoken und Priorität.
- **ntfy:** Server, Thema, optionale Authentifizierung/Token und Priorität.
- **Discord:** Webhook-Ziel.
- **Benutzerdefinierte Apprise-URL:** eine unterstützte Apprise-Dienst-URL.
- **Browser-Push:** Empfängerbenutzer; Jeder Empfänger muss [ihr Gerät](/docs/v1.0/browser-push) aktivieren.

Konfigurieren Sie [Ereignisabonnements und Vorschau](/docs/v1.0/notification-rules) im selben Dialog. Speichern Sie und
warten Sie auf die Anfrage, bevor Sie schließen. Bei Validierungs- oder Speicherfehlern steht das Formular zur Korrektur
zur Verfügung.

<a id="edit-test-and-remove"></a>

## Bearbeiten, testen und entfernen

Das Ziel ist im Ruhezustand verschlüsselt. Sie können es speichern, aber nicht wieder lesen. Beim Bearbeiten bleiben die
gespeicherten Anmeldeinformationen erhalten, es sei denn, **Zielkonfiguration ersetzen** ist ausgewählt. Der Kanaltyp
kann nicht geändert werden; Erstellen Sie stattdessen einen neuen Kanal. Ein migrierter Kanal mit der Markierung
**Neukonfiguration erforderlich** kann erst wieder aktiviert werden, wenn sein Ziel ersetzt wird. Browser-Push-Kanäle
nutzen Benutzerabonnements und lehnen ein Transportzielgeheimnis ab.

Verwenden Sie die Testaktion der Zeile, um eine echte Benachrichtigung an das konfigurierte Ziel zu senden. Es werden
keine Anbieterdaten geändert. Überprüfen Sie das Ergebnis in [Lieferhistorie](/docs/v1.0/notification-history).
Deaktivieren Sie einen Kanal, um die Zustellung zu unterbrechen, oder löschen Sie ihn, wenn er nicht mehr benötigt wird.
Der Löschvorgang wird sofort ausgeführt. Fügen Sie niemals Anmeldeinformationen in Screenshots oder Supportberichte ein.

E-Mail, Gotify, ntfy, Discord und benutzerdefinierte Ziele verwenden die gebündelte Apprise-CLI der API. Ein separater
Apprise-Server ist nicht erforderlich. Wenn eine Anfrage fehlschlägt, versuchen Sie es nach der API-Wiederherstellung
erneut. Eine leere Liste bedeutet, dass keine sichtbaren konfigurierten Kanäle den Filtern entsprechen. Löschen Sie die
Filter oder erstellen Sie einen Kanal. Details zu Lieferfehlern enthalten nur bereinigte Fehler.
