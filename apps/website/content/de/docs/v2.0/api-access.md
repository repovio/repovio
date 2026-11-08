---
title: API-Zugriff
description: Die installierte API-Dokumentation öffnen und die statische API-Referenz zur passenden Version nutzen.
---

<a id="installed-api-documentation"></a>

## Installierte API-Dokumentation

Jeder Repovio-API-Server stellt seine interaktive API-Dokumentation unter `/docs` bereit. Lokal erreichst du sie unter
`http://localhost:3001/docs`. Die REST-Endpunkte verwenden den Basispfad `/api/v1`.

Verwende bei einer Installation die öffentlich erreichbare API-Adresse und den durch deinen Reverse Proxy konfigurierten
Pfad. Wird der API-Server beispielsweise unter `https://repovio.example.com` bereitgestellt, kannst du seine
Dokumentation unter `https://repovio.example.com/docs` zugänglich machen. Die Webanwendung leitet diese Route nicht
automatisch weiter; konfiguriere dafür deinen Proxy ausdrücklich. `/api/v1/docs` ist nicht die Dokumentationsroute.

Die installierte Referenz beschreibt die laufende Anwendung. Anfragen aus dieser interaktiven Referenz verwenden deine
Instanz und benötigen die beim jeweiligen Endpunkt angegebenen Anmeldedaten und Berechtigungen. Hinweise zur Anmeldung
und Kontokonfiguration stehen unter [Authentifizierung](/docs/v2.0/authentication). MCP-Zugriffstoken sind für
[MCP-Clients](/docs/v2.0/mcp) vorgesehen, nicht als allgemeine REST-Bearer-Token.

<a id="static-release-reference"></a>

## Statische Referenz einer Version

Die [API-Referenz](/docs/v2.0/api-reference) dieser Website ist ein rein lesbarer Snapshot aus der exakten
Anwendungsrevision der ausgewählten Veröffentlichung. Sie benötigt keine laufende Repovio-Instanz und sendet keine
API-Anfragen. Wähle die Version deiner Installation; für deinen laufenden Build bleibt dessen `/docs`-Seite maßgeblich.

Suche nach Methode, Pfad oder Beschreibung, prüfe Parameter und Antwortschemas oder lade die vollständige OpenAPI-JSON
direkt auf der Referenzseite herunter. Schema-Bezeichner und API-Beschreibungen behalten die Sprache des generierten
Vertrags bei.
