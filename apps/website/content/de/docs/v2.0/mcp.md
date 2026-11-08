---
title: 'MCP-Zugriff'
description:
  'Verbinden Sie per Header konfigurierbare MCP-Clients mit den berechtigungsbewussten schreibgeschützten Workflow-Tools
  von Repovio.'
---

Repovio stellt einen zustandslosen Model Context Protocol-Endpunkt unter `/mcp` bereit. Es bietet schreibgeschützten
Zugriff auf dieselben Repositorys, Workflow-Ausführungen, Fehlerwarteschlangen, Genehmigungswarteschlangen,
Zusammenfassungen und Trends, die der authentifizierte Benutzer möglicherweise in Repovio sieht.

Der MCP-Server liest die lokale Repovio-Datenbank. Es ruft keine Anbietermutations-APIs auf, startet keine
Synchronisierung, genehmigt keine Workflows und ändert die Repovio-Konfiguration nicht.

<a id="create-an-access-token"></a>

## Erstellen Sie ein Zugriffstoken

Öffnen Sie **Einstellungen**, wählen Sie die Registerkarte**MCP-Zugriff** und erstellen Sie ein benanntes Token. Der
Ablauf ist optional. Kopieren Sie das vollständige Token aus dem Erstellungsdialog, da Repovio es nur einmal anzeigt und
nur seinen SHA-256-Hash speichert.

Der Widerruf eines Tokens wird bei der nächsten Anfrage wirksam. Durch das Löschen seines Benutzers wird auch das Token
gelöscht. Änderungen an der Rolle oder den Repository-Mitgliedschaften des Benutzers werden sofort wirksam, da jede
Anfrage die aktuelle Autorisierung aus der Datenbank auflöst.

<a id="configure-a-client"></a>

## Konfigurieren Sie einen Client

Verwenden Sie den öffentlichen Ursprung Repovio, gefolgt von `/mcp`, und senden Sie das Token im Autorisierungsheader:

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

Die erste Version zielt auf MCP-Clients ab, die benutzerdefinierte HTTP-Header unterstützen, z. B. Editor- und
Befehlszeilen-Clients. Es bietet keine OAuth-Erkennung und erhebt keinen Anspruch auf Kompatibilität mit Hosts, die den
MCP OAuth-Flow erfordern.

Platzieren Sie das Token niemals in einer URL, einem Abfrageparameter, einer verfolgten Konfigurationsdatei, einem
Shell-Verlauf oder einem Protokoll. Bevorzugen Sie den geheimen Speicher des Clients oder eine nicht versionierte
Umgebungsvariable.

<a id="available-tools"></a>

## Verfügbare Tools

| Werkzeug                 | Zweck                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `list_repositories`      | Sichtbare verfolgte Repositorys auflisten.                                                                    |
| `get_repository`         | Ein sichtbares, verfolgtes Repository lesen.                                                                  |
| `list_workflow_runs`     | Fragen Sie normalisierte sichtbare Workflow-Ausführungen ab.                                                  |
| `list_needs_attention`   | Listen Sie Workflow-Kontexte auf, deren letzte zuletzt abgeschlossene Workflow-Ausführung fehlgeschlagen ist. |
| `list_awaiting_approval` | Listen Sie aktuelle sichtbare Läufe auf, die auf die Genehmigung des Anbieters warten.                        |
| `get_dashboard_summary`  | Fassen Sie den sichtbaren Workflow-Zustand für einen umfassenden Zeitraum zusammen.                           |
| `get_workflow_trend`     | Fassen Sie sichtbare Erfolgs- und Misserfolgstrend-Buckets zusammen.                                          |

Listentools geben standardmäßig 25 Ergebnisse pro Seite an und akzeptieren höchstens 100. Die Toolausgabe enthält
strukturiertes JSON und eine passende Textdarstellung. Für Datumsangaben werden UTC-Werte gemäß ISO 8601 verwendet.

Der Server kündigt absichtlich keine MCP-Ressourcen, Eingabeaufforderungen, Aufgaben, Abonnements, Anbieteraktionen oder
Konfigurationstools an.

<a id="reverse-proxy-requirements"></a>

## Reverse-Proxy-Anforderungen

- Leiten Sie `POST /mcp` an den API-Container weiter, ohne ihn in `/api/v1/mcp` umzuschreiben.
- Weiterleiten von `Authorization`, `Origin`, `Content-Type`, `Accept`, `MCP-Protocol-Version`, `Mcp-Method` und
  `Mcp-Name`. – Verwenden Sie TLS am Reverse-Proxy und protokollieren Sie keine Autorisierungsheader oder
  Anforderungsabfragezeichenfolgen.
- Fügen Sie jeden zulässigen Browserursprung zu `CORS_ORIGIN` hinzu. Anfragen ohne `Origin`-Header werden weiterhin für
  native Clients unterstützt; Die aktuellen Ursprünge müssen mit der konfigurierten Zulassungsliste übereinstimmen.

<a id="token-administration"></a>

## Token-Verwaltung

Benutzer verwalten ihre eigenen Token auf der Registerkarte **MCP-Zugriff** unter Einstellungen. Systemadministratoren
können sichere Token-Metadaten überprüfen und ein Token auf der Benutzerseite widerrufen, aber nicht seinen Hash oder
sein Klartext-Geheimnis abrufen und kein Token im Namen eines anderen Benutzers erstellen.

<a id="manage-token-states"></a>

## Token-Status verwalten

Die Token-Liste zeigt Name, Status, sicheres Präfix, erstellte/zuletzt verwendete Zeitstempel und optionales
Ablaufdatum. Namen dürfen maximal 100 Zeichen enthalten. Der Widerruf erfordert eine Bestätigung. Ein widerrufener oder
abgelaufener Token kann zukünftige Anfragen nicht authentifizieren. Eine leere Liste bedeutet, dass für den Benutzer
keine Token vorhanden sind. Ein Ladefehler bietet einen erneuten Versuch. Kopieren Sie den vollständigen neuen Token,
bevor Sie die einmalige Anzeige schließen. Administrator-Token-Dialoge ermöglichen nur die Auflistung/Widerrufung,
niemals die Erstellung für einen anderen Benutzer.
