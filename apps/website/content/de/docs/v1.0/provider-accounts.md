---
title: 'Anbieterkonten'
description: 'Verbinden und verwalten Sie verschlüsselte, schreibgeschützte Anbieteranmeldeinformationen.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

<a id="access-and-list"></a>

## Zugriff und Liste

Systemadministratoren öffnen **Administration → Anbieterkonten**. In der Tabelle werden Name, Anbietertyp, Basis-URL,
aktivierter Status und letzte Synchronisierung angezeigt. Filtern Sie nach Typ/Aktiviert, sortieren Sie, ändern Sie
Spalten und paginieren Sie. Andere Rollen verwalten keine Anbieterkonten. Token und OAuth-Geheimnisse werden niemals in
Listendaten zurückgegeben.

<a id="connect-a-provider"></a>

## Verbinden Sie einen Anbieter

Wählen Sie **Anbieter hinzufügen** und dann GitHub, GitLab, Forgejo oder Gitea. Geben Sie einen erkennbaren Namen und
die korrekte Instanz-Basis-URL ein. Gitea erfordert eines. Wählen Sie eine der Authentifizierungsmethoden aus, die die
API gemäß der Konfiguration meldet. Ohne passenden OAuth-Client verwenden Sie ein persönliches Zugriffstoken. **Anbieter
überprüfen und hinzufügen** prüft die PAT-Anmeldeinformationen, bevor sie gespeichert werden.**Connect-Anbieter** leitet
zur Einwilligung des Anbieters weiter und kehrt mit einer Erfolgs- oder Fehlerbenachrichtigung zurück.

Verwenden Sie nur die Lesebereiche in [Einrichtung des Anbieters OAuth](/docs/v1.0/provider-oauth). Der Anbieter OAuth
verbindet Repository-Daten; es ist getrennt von [OIDC Benutzeranmeldung](/docs/v1.0/authentication). Repovio
verschlüsselt ruhende Anmeldeinformationen und stellt niemals Mutationen von Anbieterressourcen bereit, selbst wenn ein
Upstream-Token Schreibvorgänge autorisieren könnte.

<a id="maintain-connections"></a>

## Verbindungen pflegen

Aktivieren oder deaktivieren Sie eine Zeile, um die Teilnahme zu steuern. Ausstehende Zeilenaktionen blockieren
widersprüchliche Aktionen, während Anforderungen abgeschlossen werden. Beim Deaktivieren bleibt die Konfiguration
erhalten. Der Löschvorgang wird sofort ausgeführt; Berücksichtigen Sie abhängige verfolgte Daten, bevor Sie die
Löschaktion auswählen. Erstellen Sie eine Ersatzverbindung, wenn sich der Besitz oder die Anmeldeinformationen des
Anbieters durch einen Ablauf ändern müssen, der auf dem aktuellen Bildschirm nicht angezeigt wird.

Fügen Sie Repositorys separat von [Repositories](/docs/v1.0/repositories) hinzu; Die Webhook-Konfiguration gehört zu
einzelnen verfolgten Repositorys, nicht zu Anbieterkonten. Eine leere Erkennung kann bedeuten, dass keine Repositorys,
eine falsche Instanz, unzureichende Lesebereiche oder ungültige Anmeldeinformationen vorhanden sind. Unterscheiden Sie
zwischen Ladefehlern bei Authentifizierungsoptionen, Überprüfungsfehlern, OAuth-Rückrufbenachrichtigungen und
API-Fehlern. Beheben Sie die Ursache, bevor Sie es erneut versuchen. Untersuchen Sie Jobs auf laufende
Synchronisierungsfehler.
