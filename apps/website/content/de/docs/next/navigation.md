---
title: 'Navigation'
description: 'Finden Sie Anwendungsziele, Status, persönliche Einstellungen und Versionsinformationen.'
---

<a id="sidebar"></a>

## Seitenleiste

**Übersicht** enthält Dashboard, Workflow-Ausführungen, Issues, Pull Requests und unterstützte
Sicherheitswarnungen.**Operationen** enthält Repositorys, Jobs und Benachrichtigungen.**Administration** enthält
Anbieterkonten, Benutzer und Einstellungen für Systemadministratoren. Workflow-Ausführungen werden zu „Alle
Ausführungen“, „Warten auf Genehmigung“ und „Benötigt Aufmerksamkeit“ erweitert. Benachrichtigungen öffnet die
Benachrichtigungskanäle direkt, ohne Untermenü. Die Suche bietet dasselbe Navigationsziel.

Die Seitenleiste bietet nur Ziele an, auf die Ihre Rolle zugreifen kann. Für Sicherheitswarnungen ist eine
Verwaltungsberechtigung erforderlich. Durch Reduzieren der Seitenleiste bleiben gekennzeichnete Ziele erhalten.
Verwenden Sie auf schmalen Bildschirmen die Navigationssteuerung, um die Seitenleiste zu öffnen. Das Handbuch
dokumentiert jeden Rollenbereich, auch wenn Ihr Konto ihn nicht sehen kann.

<a id="status-and-search"></a>

## Status und Suche

Verwenden Sie [Suchen](/docs/next/search) in der App-Leiste, um Ziele und synchronisierte Ressourcen zu finden. Die
Statusleiste meldet API-Konnektivität, Synchronisierungsaktivität und die Anzahl der ausgeführten Workflows. Sein
laufender Workflow-Zähler öffnet [Jobs](/docs/next/guide-jobs); Die Synchronisierungsaktivität kann den
Elementfortschritt umfassen. Verbindungswiederherstellung aktualisiert den Status. Eine Anzeige für eine unterbrochene
Verbindung bedeutet, dass Live-Updates möglicherweise veraltet sind. Überprüfen Sie die API und versuchen Sie es erneut,
bevor Sie sich auf die angezeigten Zählungen verlassen.

<a id="personal-notifications"></a>

## Persönliche Benachrichtigungen

Die Glocke in der App-Leiste öffnet Gerätesteuerung und bis zu fünf aktuelle, an Sie gerichtete Browser-Push-Zustellungen.
Einträge berücksichtigen aktuelle Repository- und Sicherheitswarnungsrechte; eine leere Liste zeigt keine fremde
Historie. Zugestellt bedeutet Annahme durch den Push-Dienst, nicht Lesen durch eine Person. Systemadministratoren
können im selben Bereich den administrativen Zustellungsverlauf öffnen.

<a id="user-menu-and-footer"></a>

## Benutzermenü und Fußzeile

Das Benutzermenü öffnet persönliche [Einstellungen](/docs/next/settings)-, Sprach- und Darstellungssteuerungen und
meldet sich ab. Die Fußzeile verweist auf das Projekt und das Handbuch. Durch Auswahl der angezeigten Version wird der
Changelog-Dialog geöffnet. Die Versionshinweise und der Update-Indikator helfen dabei, eine verfügbare Version zu
identifizieren. Das Anwenden eines Upgrades bleibt ein Bereitstellungsvorgang. Anbieterlinks öffnen externe Ressourcen.
Aktionen dort erfordern die eigenen Berechtigungen des Anbieters und liegen außerhalb von Repovio.

<a id="table-controls"></a>

## Gemeinsam genutzte Tabellensteuerelemente

Sofern angeboten, konfigurieren Tabellenoptionen die Sichtbarkeit, Reihenfolge und Fixierung der Spalten. Die
Aktionsspalte bleibt rechts angeheftet. Die Optionen bleiben pro Tabelle im Browser bestehen. Die Paginierung verwendet
die Seitenabfrage. Workflow-, Issue-, Pull-Request- und Alert-Listen beginnen bei 25 Zeilen; Jobs, Repositorys,
Anbieter, Benutzer, Kanäle und Lieferverlauf beginnen bei 10. Filtersteuerelemente können deaktiviert werden, während
ihre Optionen geladen werden. Löschen Sie Dashboard-Voreinstellungen oder ändern Sie Filter, um zu Ihrer eigenen Abfrage
zurückzukehren. Diese Steuerelemente ändern die lokale Ansicht, niemals Anbieterdatensätze.
