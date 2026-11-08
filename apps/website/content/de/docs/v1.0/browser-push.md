---
title: 'Browser-Push'
description: 'Aktivieren Sie Benachrichtigungen pro Gerät und verstehen Sie die Server- und Browseranforderungen.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="server-requirements"></a>

## Serveranforderungen

Browser Push ist ein nativer Transport und verwendet kein Apprise. Der Bereitstellungsbetreiber konfiguriert alle drei
Einstellungen:

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Generieren Sie ein VAPID-Schlüsselpaar mit `npx web-push generate-vapid-keys`. Der Betreff ist ein `mailto:`- oder
`https:`-URI. Halten Sie den privaten Schlüssel geheim. Ohne die vollständige Konfiguration wird Browser-Push als nicht
verfügbar angezeigt. Verwenden Sie einen sicheren Browserkontext und einen Browser, der Servicemitarbeiter und Push-API
unterstützt.

<a id="enable-or-disable-this-device"></a>

## Dieses Gerät aktivieren oder deaktivieren

Verwenden Sie **Auf diesem Gerät aktivieren** und erteilen Sie dem Browser auf Anfrage die
Benachrichtigungsberechtigung. Das Abonnement gehört dem aktuellen Benutzer und Browser. Ein Administrator wählt
Empfängerbenutzer in einem Browser-Push-Kanal aus; Jeder Empfänger benötigt ein aktiviertes Gerät. Durch die
Verweigerung der Browserberechtigung wird das Abonnement verhindert. Passen Sie die Browserberechtigungen der Website an
und versuchen Sie es bei Bedarf erneut. Überprüfen Sie die Verfügbarkeit/Geräteanzahl und gemeldete Fehler, bevor Sie
einen Test senden.

Durch die Deaktivierung von Push wird das Abonnement dieses Geräts entfernt, nicht das Abonnement anderer Geräte.
Endpunkte und Schlüssel werden mit einem nicht geheimen Fingerabdruck verschlüsselt und dedupliziert. HTTP
404/410-Antworten entfernen abgelaufene Abonnements. Bei einem nicht verfügbaren Browser, einer fehlenden
Serverkonfiguration, einer verweigerten Berechtigung oder einem Fehler bei der Abonnementanfrage muss die entsprechende
Ursache behoben werden. Durch die Aktualisierung allein kann keine Browserberechtigung erteilt werden. Siehe
[Lieferhistorie](/docs/v1.0/notification-history) für Versuche.
