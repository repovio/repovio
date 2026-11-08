---
title: 'Repositories'
description:
  'Verfolgen Sie Repositorys, überprüfen Sie Aktivitäten und konfigurieren Sie lokale Synchronisierung und Zugriff.'
---

<a id="browse-and-open-details"></a>

## Durchsuchen und Details öffnen

Alle angemeldeten Benutzer können Repositorys auflisten, die sie lesen dürfen. In der Tabelle werden Eigentümer/Name,
aktivierter Status, Mitglieder, Anzahl beibehaltener Ausführungen, Aufbewahrung und letzte Synchronisierung angezeigt.
Verwenden Sie aktivierte Filterung, Sortierung, Spaltensteuerung und Paginierung. Öffnen Sie den Anbieterlink für das
externe Repository, die Detailseite für synchronisierte Aktivitäten oder den Einstellungsdialog für die Konfiguration.
Eine fehlende Mitgliedschaft oder ein entferntes Repository kann zu einem unzugänglichen Detailstatus führen.

Auf der Detailseite werden allgemeine Informationen, Aufbewahrung, Alter der letzten Synchronisierung/Daten,
konfiguriertes Intervall, aktueller Job sowie aktuelle Workflows, Probleme und Pull Requests zusammengefasst. Manager
mit Repository-Verwaltungszugriff und Administratoren sehen auch Sicherheitswarnungsaktivitäten. Ausstehende/laufende
Jobs zeigen den Fortschritt an; Warnungen und Fehler umfassen kategorisierte sichere Fehler.

<a id="add-and-maintain-tracking"></a>

## Tracking hinzufügen und verwalten

Nur Systemadministratoren fügen Repositorys hinzu. Wählen Sie ein aktiviertes Anbieterkonto aus, warten Sie auf die
Entdeckung und wählen Sie ein oder mehrere nicht verfolgte Repositorys aus. Bereits getrackte Repositories sind
ausgeschlossen. Wenn ein Teil eines Multi-Add-Vorgangs fehlschlägt, bleiben erfolgreiche Auswahlen hinzugefügt und nur
fehlgeschlagene Auswahlen bleiben für einen erneuten Versuch übrig. Eine leere Anbieterliste erfordert zunächst die
Verbindung eines aktivierten [Anbieterkonto](/docs/v2.0/provider-accounts).

Administratoren können die Nachverfolgung aktivieren/deaktivieren, **Anbieterdaten aktualisieren** und eine
schreibgeschützte Synchronisierung in die Warteschlange stellen. Die Repository-Identität verwendet das Anbieterkonto
und die Repository-ID des stabilen Anbieters. Bei Umbenennungen/Übertragungen bleiben Verlauf, Filter, Mitgliedschaften
und Kanäle erhalten; Bei der Metadatenaktualisierung wird eine andere ID am alten Pfad abgelehnt, anstatt sie neu
zuzuweisen. Deaktivierte Repositorys behalten gespeicherte Daten bei, nehmen jedoch nicht mehr an der Synchronisierung
teil.

<a id="retention-filters-and-memberships"></a>

## Aufbewahrung, Filter und Mitgliedschaften

Administratoren legen separate Aufbewahrungsüberschreibungen für Workflow-Ausführung, Issue und Pull-Request fest,
jeweils von 1 bis 3650 Tagen. Ein leerer Wert stellt den entsprechenden [Systemstandard](/docs/v2.0/settings-system)
wieder her. Workflow-Filter akzeptieren die Glob-Muster **ALLOW** und**DENY**; DENY hat Vorrang. Fügen Sie nicht leere
Muster hinzu oder entfernen Sie vorhandene. Restriktive Filter können fehlende Läufe erklären.

Fügen Sie in Mitgliedschaften einen Benutzer ohne Administratorrechte als Betrachter oder Manager hinzu, ändern Sie
seine Repository-Rolle oder entfernen Sie den Zugriff. Administratoren sind von der Mitgliederauswahl ausgeschlossen, da
sie bereits über uneingeschränkten Zugriff verfügen. Ein globaler Manager benötigt weiterhin eine Manager-Mitgliedschaft
für Repository-Verwaltungsfunktionen wie Sicherheitswarnungen.

<a id="webhooks-and-failures"></a>

## Webhooks und Fehler

Die Repository-Webhook-Karte zeigt die Rückruf-URL, den konfigurierten Status, die Anweisungen des Anbieters und die
letzte Zustellung. Es kann ein Geheimnis generieren/kopieren, die Konfiguration speichern, mit expliziter Bestätigung
rotieren oder die Konfiguration entfernen. Eine fehlende öffentliche URL muss vor der Anbieterregistrierung behoben
werden. Geheimnisse werden nur während der Konfiguration angezeigt; Bewahren Sie sie in einem Secret-Manager auf. Folgen
Sie [Repository-Webhooks](/docs/v2.0/provider-webhooks) für die Einrichtung und Überprüfung.

Betrachter und Manager erhalten eine schreibgeschützte Zusammenfassung der Repository-Einstellungen. Nach der
Wiederherstellung Lade-/Speicherfehler erneut versuchen; Überprüfen Sie [Jobs](/docs/v2.0/guide-jobs) auf
Anbieterzugriffs-, Ratenbegrenzungs- oder Synchronisierungsfehler.

<a id="local-user-and-group-management"></a>

## Lokale Zugriffsgruppen

Im Bereich Gruppenzugriff eines Repositorys eine Gruppe mit Leseberechtigung oder Repository-Verwaltung zuweisen, Rolle
ändern oder Zuweisung entfernen. Direkte und geerbte Rechte werden kombiniert; Manager gewinnt vor Viewer.
Verwaltungsrechte benötigen weiterhin die globale Manager-Rolle; Systemadministration bleibt uneingeschränkt. Entzug
wirkt beim nächsten Request, sofern kein anderer Zugriff verbleibt. Gruppen sind lokal, unterstützen lokale sowie
OIDC-Konten und werden nicht aus OIDC-Claims synchronisiert.

[Lokale Zugriffsgruppen](/docs/v2.0/users#local-access-groups)
