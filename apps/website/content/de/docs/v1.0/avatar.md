---
title: 'Avatar'
description: 'Laden Sie Ihr Profilbild hoch, importieren Sie es, schneiden Sie es zu oder entfernen Sie es.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="choose-an-image"></a>

## Wählen Sie ein Bild

Jeder angemeldete Benutzer, einschließlich OIDC-Benutzer, kann **Einstellungen → Allgemein** öffnen und ein JPEG, PNG
oder WebP mit bis zu 2 MiB hochladen. Alternativ können Sie ein Bild von einer öffentlichen HTTPS-URL importieren. Bei
einem nicht quadratischen Bild wird der Zuschneidedialog geöffnet. Wählen Sie den quadratischen Zuschnitt und bestätigen
Sie ihn vor dem Hochladen. Wenn Sie den Dialog abbrechen, bleibt der aktuelle Avatar unverändert.

Repovio entfernt Bildmetadaten, rendert ein 256 × 256 WebP und speichert nur dieses normalisierte Bild in PostgreSQL.
Das Originalbild oder die Remote-URL bleiben nicht erhalten. Ungültiger Typ, übergroßes Bild, Importfehler,
Dekodierungsfehler und Upload-Fehler werden separat gemeldet; Wählen Sie ein unterstütztes Image oder versuchen Sie es
erneut, nachdem Sie die Quelle/Verbindung repariert haben.

<a id="remove-and-display"></a>

## Entfernen und anzeigen

Mit der Aktion „Entfernen“ können Sie das aktuelle Bild löschen. Bei einer fehlgeschlagenen Entfernung bleibt der
vorhandene Avatar für einen erneuten Versuch verfügbar. Ohne Bild zeigt die Benutzeroberfläche Initialen basierend auf
dem persönlichen Namen oder Benutzernamen an. Avatar-Gruppen von Repository-Mitgliedern zeigen höchstens fünf Mitglieder
und fassen zusätzliche Mitglieder zusammen. Die Sichtbarkeit des Avatars richtet sich nach den Berechtigungen der
enthaltenden Ressource. Durch das Ändern eines Repovio-Avatars wird Ihr Anbieterprofilbild nicht aktualisiert.
