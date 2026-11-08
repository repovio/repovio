---
title: 'Globale Suche'
description: 'Suchziele, Repositorys, Anbieterkonten und Workflow-Ausführungen.'
---

<a id="search-the-installation"></a>

## Durchsuchen Sie die Installation

Öffnen Sie die Suche über die App-Leiste oder verwenden Sie die angezeigte Tastenkombination. Geben Sie mindestens zwei
Zeichen ein. Die Ergebnisse werden nach Navigationszielen, Repositorys, Anbieterkonten und Workflow-Ausführungen
gruppiert. Navigationsübereinstimmungen verwenden die übersetzten Bezeichnungen von Zielen, auf die Ihr Konto zugreifen
kann. Ressourcenergebnisse verwenden synchronisierte Anbieternamen.

Navigieren Sie mit der Tastatur durch die Ergebnisse oder wählen Sie eines mit dem Zeiger aus. Repository- und
Anbieter-Konto-Übereinstimmungen öffnen die entsprechende Repovio-Ansicht; Workflow-Übereinstimmungen öffnen die
Ausführungs-URL des Anbieters. Drücken Sie **Escape**, um die Suche zu schließen und zur vorherigen Seite
zurückzukehren. Die Suche führt keine anbieterseitige Erkennung durch und startet keine Synchronisierung.

<a id="access-and-failure-states"></a>

## Zugriffs- und Fehlerzustände

Die Ressourcensuche verwendet die Repository-Berechtigungen des aktuellen Benutzers. Die Ergebnisse von Anbieterkonten
sind auf Administratoren beschränkt. Keine Ergebnisse können auf eine kurze Abfrage, keine passenden gespeicherten
Datensätze oder eine unzureichende Mitgliedschaft hinweisen. Versuchen Sie es mit einem spezifischeren Namen und
überprüfen Sie das Repository/den Job, wenn synchronisierte Daten fehlen. Der Ladevorgang wird angezeigt, während eine
Abfrage ausgeführt wird. Bei einem Anforderungsfehler wiederholen Sie die Abfrage, nachdem die API-Konnektivität
wiederhergestellt ist. Bei der Suche werden niemals Anbieter-Tokens oder Anmeldeinformationen für Benachrichtigungen
angezeigt.
