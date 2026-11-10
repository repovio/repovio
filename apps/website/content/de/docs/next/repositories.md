---
title: 'Repositories'
description: 'Verfolgen Sie Repositorys, überprüfen Sie Aktivitäten und konfigurieren Sie lokale Synchronisierung und Zugriff.'
---

<a id="browse-and-open-details"></a>

## Durchsuchen und Details öffnen

Öffnen Sie ein Repository aus der Tabelle. Die Navigation enthält Übersicht, Workflow-Ausführungen, Issues,
Pull Requests, Sicherheitswarnungen und Einstellungen. Aktivitätsseiten bleiben auf das Repository beschränkt und
bieten Filter, Sortierung, Paginierung und Zeilennavigation. Sicherheitswarnungen benötigen Verwaltungsrechte;
Einstellungen sind nur für Systemadministratoren verfügbar. Der Anbieterlink öffnet das externe Repository.

Die Übersicht zeigt allgemeine Informationen, Aufbewahrung, letzte Synchronisierung/Datenalter, Intervall, aktuellen
Job und jüngste Aktivitäten. Ausstehende/laufende Jobs zeigen Fortschritt; Fehler werden sicher kategorisiert.

<a id="add-and-maintain-tracking"></a>

## Tracking hinzufügen und verwalten

Nur Systemadministratoren fügen Repositorys hinzu. Wählen Sie ein aktiviertes Anbieterkonto aus, warten Sie auf die
Entdeckung und wählen Sie ein oder mehrere nicht verfolgte Repositorys aus. Bereits getrackte Repositories sind
ausgeschlossen. Wenn ein Teil eines Multi-Add-Vorgangs fehlschlägt, bleiben erfolgreiche Auswahlen hinzugefügt und nur
fehlgeschlagene Auswahlen bleiben für einen erneuten Versuch übrig. Eine leere Anbieterliste erfordert zunächst die
Verbindung eines aktivierten [Anbieterkonto](/docs/next/provider-accounts).

Administratoren können die Nachverfolgung aktivieren/deaktivieren, **Anbieterdaten aktualisieren** und eine
schreibgeschützte Synchronisierung in die Warteschlange stellen. Die Repository-Identität verwendet das Anbieterkonto
und die Repository-ID des stabilen Anbieters. Bei Umbenennungen/Übertragungen bleiben Verlauf, Filter, Mitgliedschaften
und Kanäle erhalten; Bei der Metadatenaktualisierung wird eine andere ID am alten Pfad abgelehnt, anstatt sie neu
zuzuweisen. Deaktivierte Repositorys behalten gespeicherte Daten bei, nehmen jedoch nicht mehr an der Synchronisierung
teil.

<a id="repository-settings-sections"></a>

## Bereiche der Repository-Einstellungen

Die Repository-Einstellungen bieten fünf zusätzliche Tabs. Jeder Bereich nutzt die verfügbare Breite; auf schmalen Bildschirmen stehen Formularfelder untereinander. Tab-Links lassen sich teilen sowie durch Neuladen und Vor/Zurück wiederherstellen. Allgemein ist die Standardauswahl.

| Bereich         | Zweck                               | Adresse                      |
| --------------- | ----------------------------------- | ---------------------------- |
| Allgemein       | Aufbewahrungsfristen                | `/repositories/:id/settings` |
| Webhook         | Repository-Webhook konfigurieren    | `?tab=webhook`               |
| Workflow-Filter | Erlaubnis- und Ausschlussmuster     | `?tab=workflow-filters`      |
| Mitglieder      | Direkte Benutzerzugriffe und Rollen | `?tab=members`               |
| Gruppenzugriff  | Zusätzliche lokale Gruppenrechte    | `?tab=groups`                |

Nicht gespeicherte Eingaben und laufende Anfragen bleiben beim Tabwechsel innerhalb desselben Einstellungsbesuchs erhalten. Beim Verlassen der Einstellungen oder Wechsel des Repositorys werden diese Entwürfe einschließlich erzeugter Webhook-Geheimnisse verworfen. Zum Speichern die jeweilige Speicher- oder Zuweisungsaktion verwenden.

Der bisherige Detaildialog entfällt. Alte Links mit `?repository=` führen zur Übersicht. Die Detailseiten behalten Aktualisierung, Synchronisierung, Anbieterlinks und lokales Löschen. Betrachter und Manager erhalten auch durch URL-Änderungen keinen Zugriff auf die Einstellungen.

<a id="retention-filters-and-memberships"></a>

## Aufbewahrung, Filter und Mitgliedschaften

Administratoren legen separate Aufbewahrungsüberschreibungen für Workflow-Ausführung, Issue und Pull-Request fest,
jeweils von 1 bis 3650 Tagen. Ein leerer Wert stellt den entsprechenden [Systemstandard](/docs/next/settings-system)
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
Sie [Repository-Webhooks](/docs/next/provider-webhooks) für die Einrichtung und Überprüfung.

Betrachter und Manager sehen schreibgeschützte Repository-Metadaten in der Übersicht; Einstellungen bleiben der Systemadministration vorbehalten. Nach Behebung der Ursache fehlgeschlagene Anfragen wiederholen und [Jobs](/docs/next/guide-jobs) auf Synchronisierungsfehler prüfen.

<a id="local-user-and-group-management"></a>

## Lokale Zugriffsgruppen

Im Bereich Gruppenzugriff eines Repositorys eine Gruppe mit Leseberechtigung oder Repository-Verwaltung zuweisen, Rolle
ändern oder Zuweisung entfernen. Direkte und geerbte Rechte werden kombiniert; Manager gewinnt vor Viewer.
Verwaltungsrechte benötigen weiterhin die globale Manager-Rolle; Systemadministration bleibt uneingeschränkt. Entzug
wirkt beim nächsten Request, sofern kein anderer Zugriff verbleibt. Gruppen sind lokal, unterstützen lokale sowie
OIDC-Konten und werden nicht aus OIDC-Claims synchronisiert.

[Lokale Zugriffsgruppen](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Lokale Erfassung löschen

Systemadministratoren können auf der Detailseite **Repository löschen** wählen. Die
Bestätigung nennt das Repository und erläutert den endgültigen Verlust lokaler Workflows, Runs, Issues, Pull Requests,
Sicherheitswarnungen, Einstellungen, Zugriffszuweisungen, Webhook-Verläufe, Synchronisierungsdaten und zugehöriger
Benachrichtigungsverläufe. Der Provider Account und Repository-Daten beim Anbieter bleiben unverändert.

Während einer laufenden Synchronisierung ist das Löschen gesperrt. Nach Abschluss erneut versuchen. Wartende
Synchronisierungsaufträge werden mitgelöscht. Benachrichtigungsregeln verlieren den Repository-Filter; war dieses
Repository der einzige Filter, wird die Regel entfernt und dadurch niemals global. Gemeinsame Kanäle bleiben erhalten.

Das Repository kann anschließend über die bestehende Anbieterauswahl erneut hinzugefügt werden. Die Erfassung beginnt
neu, ohne Wiederherstellung bisheriger lokaler Historie oder Einstellungen.
