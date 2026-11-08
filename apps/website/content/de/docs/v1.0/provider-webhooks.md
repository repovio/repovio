---
title: 'Einrichtung des Repository-Webhooks'
description:
  'Konfigurieren Sie signierte schreibgeschützte Webhooks für die Repositorys GitHub, GitLab, Forgejo und Gitea.'
---

> Archivierter Quell-Snapshot. Produktetiketten verwenden Repovio. Verwenden Sie die Konfigurations-IDs und
> Container-Referenzen aus den getaggten Bereitstellungsdateien dieser Version unverändert.

Repovio kann signierte Webhooks empfangen, um ein verfolgtes Repository früher als sein normales Abfrageintervall zu
synchronisieren. Es erstellt, aktualisiert, löscht oder testet niemals Webhooks über Anbieter-APIs. Ein Administrator
konfiguriert jeden Repository-Webhook manuell in GitHub, GitLab, Forgejo oder Gitea.

Öffnen Sie **Repositories**, wählen Sie ein verfolgtes Repository aus und verwenden Sie
dessen**Repository-Webhook**-Karte. Die Karte zeigt die Repository-spezifische Rückruf-URL an, generiert oder akzeptiert
ein Signaturgeheimnis und meldet die letzte akzeptierte Zustellung. Repovio sendet diese Konfiguration niemals an den
Anbieter.

Webhooks sind eine Optimierung, nicht die Quelle der Wahrheit. Die signierte Nutzlast muss das über die Rückruf-URL
ausgewählte Repository identifizieren. Repovio liest dann aktuelle Daten über den konfigurierten schreibgeschützten
Anbieteradapter. Akzeptierte Lieferungen stellen eine dauerhafte Repository-Synchronisierung in die Warteschlange;
Lieferungen, die innerhalb von 15 Sekunden eingehen, werden zusammengefasst. Das standardmäßige
Fallback-Abfrageintervall beträgt 30 Minuten.

<a id="configure-a-repository-webhook"></a>

## Konfigurieren Sie einen Repository-Webhook

1. Fügen Sie das Repository zu Repovio hinzu und öffnen Sie die Karte **Repository-Webhook**.
2. Kopieren Sie die Rückruf-URL.
3. Generieren Sie ein einzigartiges Signaturgeheimnis mit hoher Entropie oder fügen Sie das genaue Signaturtoken ein,
   das vom Anbieter bereitgestellt wurde. Verwenden Sie niemals ein Zugriffstoken oder das Geheimnis eines anderen
   Repositorys wieder.
4. Speichern Sie das Geheimnis. Repovio verschlüsselt es mit AES-256-GCM und gibt es niemals über die API zurück.
5. Konfigurieren Sie die Rückruf-URL und das Geheimnis in den Anbietereinstellungen dieses Repositorys.
6. Lassen Sie die TLS-Überprüfung aktiviert und senden Sie eine Testzustellung.

Die stabilen Rückrufe verwenden `/api/webhooks/<provider>/<repository-id>`. Versionierte
`/api/v1/webhooks/<provider>/<repository-id>`-Rückrufe sind ebenfalls verfügbar. Rückruf-URLs für Anbieterkonten von
Repovio 0.2.9 und früher werden nicht mehr akzeptiert. Erstellen Sie nach dem Upgrade jeden Webhook mit seinem
Repository-Rückruf und einem neuen Repository-Geheimnis neu.

Erfolgreiche Lieferungen geben HTTP `202` mit `{ "accepted": true }` zurück. Wiederholte Anbieterzustellungs-IDs geben
`{ "accepted": true, "duplicate": true }` zurück und stellen keine weitere Synchronisierung in die Warteschlange.
Unbekannte oder deaktivierte Repositorys, deaktivierte Anbieterkonten, fehlende Geheimnisse, ungültige Signaturen, nicht
übereinstimmende Anbieter-Repository-IDs und fehlende Zustellungs-IDs werden ohne Offenlegung von Konfigurationsdetails
abgelehnt.

Die Synchronisierung in der Warteschlange übersteht API-Neustarts. Mehrere Instanzen verwenden Datenbank-Leases und
synchronisieren nicht gleichzeitig dasselbe Anbieterkonto. Rate-Limit-Header verzögern die Arbeit für das betroffene
Konto, während begrenzte Wiederholungsversuche vorübergehende Fehler behandeln.

<a id="github-actions"></a>

## GitHub Aktionen

1. Öffnen Sie **Einstellungen → Webhooks** des Repositorys und wählen Sie**Webhook hinzufügen**.
2. Verwenden Sie `https://repovio.example.com/api/webhooks/github/<repository-id>` als Payload-URL.
3. Wählen Sie `application/json` aus, fügen Sie das Repository-Geheimnis ein und abonnieren Sie
   **Workflow-Ausführungen** (`workflow_run`).
4. Lassen Sie die SSL-Überprüfung aktiviert und speichern Sie den Webhook.

Repovio überprüft `X-Hub-Signature-256` über den Rohkörper und verwendet `X-GitHub-Delivery` für Idempotenz. Siehe
GitHubs [Webhook-Ereignisdokumentation](https://docs.github.com/en/webhooks/webhook-events-and-payloads).

<a id="gitlab-pipelines"></a>

## GitLab-Pipelines

1. Öffnen Sie **Einstellungen → Webhooks** des Projekts und wählen Sie**Neuen Webhook hinzufügen**.
2. Verwenden Sie `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` als URL.
3. Generieren Sie ein **Signaturtoken** und speichern Sie seinen vollständigen Wert, einschließlich `whsec_`, auf der
   Repository-Karte Repovio.
4. Wählen Sie **Pipeline-Ereignisse**, lassen Sie die SSL-Überprüfung aktiviert, speichern Sie und senden Sie eine
   Testzustellung.

Repovio überprüft Standard-Webhooks HMAC-SHA256-Signaturen und bevorzugt `webhook-id` für Idempotenz. Ältere
`X-Gitlab-Token`- und `X-Gitlab-Event-UUID`-Header werden für ältere Instanzen weiterhin unterstützt. Siehe GitLabs
[Webhook-Dokumentation](https://docs.gitlab.com/user/project/integrations/webhooks/).

<a id="forgejo-actions"></a>

## Forgejo Aktionen

1. Öffnen Sie **Einstellungen → Webhooks** des Repositorys und fügen Sie einen nativen**Forgejo** JSON-Webhook hinzu.
2. Verwenden Sie `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` als Ziel-URL.
3. Fügen Sie das Repository-Geheimnis ein und wählen Sie **Push-Ereignisse** sowie alle verfügbaren Aktionsereignisse
   aus.
4. Lassen Sie die TLS-Überprüfung aktiviert und speichern Sie den Webhook.

Repovio überprüft `X-Forgejo-Signature` und verwendet `X-Forgejo-Delivery` für Idempotenz. Gitea-kompatible Header
bleiben für die Forgejo-Kompatibilität akzeptiert. Siehe Forgejo
[Webhook-Dokumentation](https://forgejo.org/docs/latest/user/repository/webhooks/).

<a id="gitea-actions"></a>

## Gitea Aktionen

1. Öffnen Sie **Einstellungen → Webhooks** des Repositorys und fügen Sie einen nativen**Gitea** JSON-Webhook hinzu.
2. Verwenden Sie `https://repovio.example.com/api/webhooks/gitea/<repository-id>` als Ziel-URL.
3. Fügen Sie das Repository-Geheimnis ein und wählen Sie **Push-Ereignisse** sowie alle verfügbaren Workflow-Ereignisse
   aus.
4. Lassen Sie die TLS-Überprüfung aktiviert und speichern Sie den Webhook.

Repovio überprüft `X-Gitea-Signature` über den Rohkörper und verwendet `X-Gitea-Delivery` für Idempotenz. Siehe Gitea
[Webhook-Dokumentation](https://docs.gitea.com/usage/repository/webhooks/).

<a id="troubleshooting"></a>

## Fehlerbehebung

– `401` bedeutet, dass Repovio das Repository, den Anbietertyp, das Geheimnis, die Signatur, die Payload-Repository-ID
oder die Liefer-ID nicht überprüfen konnte. Bestätigen Sie die Repository-UUID und das genaue Geheimnis des Rückrufs.

- `202` mit `duplicate: true` wird erwartet, wenn ein Anbieter eine Zustellung erneut versucht.
- Eine erfolgreiche Zustellung löst nur eine schreibgeschützte Synchronisierung aus; Der Anbieter-Workflow wird dadurch
  nie verändert. – Überprüfen Sie `/api/health` auf den Status der dauerhaften Anbietersynchronisierung.
- Legen Sie `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` für den 30-minütigen Fallback fest. – `SCHEDULER_ENABLED=false`
  behält in der Warteschlange befindliche Anforderungen bei, unterbricht jedoch die Einreihung und Verarbeitung des
  Fallbacks.
