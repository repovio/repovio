---
title: 'Profil'
description: 'Ändern Sie lokale Kontonamen und Benutzernamen mit der Überprüfung des aktuellen Passworts.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="edit-a-local-profile"></a>

## Bearbeiten Sie ein lokales Profil

Öffnen Sie **Einstellungen → Allgemein**. Lokale Benutzer können optionale Vor-/Nachnamen und ihren Login-Benutzernamen
aktualisieren. Als bevorzugte Anzeigeidentität werden persönliche Namen verwendet; Der Benutzername bleibt zur
eindeutigen Identifizierung verfügbar. Felder haben eine maximale Länge von 255 Zeichen und der Benutzername darf nicht
leer sein.

Für die Änderung des Benutzernamens ist das aktuelle Passwort erforderlich. Geben Sie es in das Profilformular ein und
wählen Sie Speichern. Namen allein erfordern keine Änderung des Benutzernamens. Warten Sie auf die Anfrage; Bei
erfolgreicher Speicherung wird das aktuelle Konto aktualisiert. Ein doppelter Benutzername und ein falsches aktuelles
Passwort führen zu unterschiedlichen Validierungsfehlern. Korrigieren Sie das betroffene Feld und versuchen Sie es
erneut.

<a id="identity-managed-accounts"></a>

## Identitätsverwaltete Konten

OIDC-Benutzer können ihren Benutzernamen oder Profilnamen nicht lokal ändern. Repovio synchronisiert Namen aus
verifizierten Identitätsansprüchen bei erfolgreicher Anmeldung. Ändern Sie diese beim Identitätsanbieter und melden Sie
sich erneut an. Avatar bleibt in [Avatar-Einstellungen](/docs/v1.0/avatar) separat bearbeitbar. Wenn die
Profilanforderung fehlschlägt, versuchen Sie es nach der API-Wiederherstellung erneut. Geben Sie keine Passwörter über
Supportkanäle weiter.
