---
title: 'Bereitstellen von Repovio'
description:
  'Produktionsbereitstellung, TLS-Proxy, Backup, Wiederherstellung, Upgrade und Rollback-Anleitung für Repovio.'
---

> Archivierter Quell-Snapshot. Produktetiketten wurden auf Repovio normalisiert. Verwenden Sie für diese historische
> Version unverändert die Konfigurations-IDs und Container-Referenzen aus den mit Tags versehenen
> Bereitstellungsdateien.

Der Compose-Stack von Repovio startet PostgreSQL, wendet einmal Prisma-Migrationen an und startet dann die API und die
Webanwendungen. Es beendet TLS nicht. Stellen Sie die Web- und API-Dienste hinter einen Reverse-Proxy, der den
öffentlichen Hostnamen und die Zertifikate besitzt.

<a id="prerequisites"></a>

## Voraussetzungen

- Docker Engine mit Docker Compose v2. – Ein DNS-Eintrag für den öffentlichen Hostnamen. – Ein Reverse-Proxy, der
  TLS-Zertifikate erhält und erneuert. – Ein privates Serververzeichnis, das nur von Bereitstellungsadministratoren
  gelesen werden kann.

Der Compose-Stack speichert PostgreSQL-Daten, einschließlich normalisierter Benutzerprofilbilder, in seinem benannten
PostgreSQL-Volume, das in der getaggten Compose-Datei konfiguriert ist. Löschen Sie dieses Volume nicht, es sei denn,
Sie möchten absichtlich alle Repovio-Daten entfernen.

<a id="first-deployment"></a>

## Erster Einsatz

### Schritt 1: Schauen Sie sich eine veröffentlichte Repovio-Version an und erstellen Sie die private Umgebungsdatei:

```bash
cp .env.example .env
chmod 600 .env
```

### Schritt 2: Ersetzen Sie jeden Platzhalter in `.env`, insbesondere `POSTGRES_PASSWORD`, beide Datenbank-URLs, `AUTH_JWT_SECRET` und

`TOKEN_ENCRYPTION_KEY`. Generieren Sie den Verschlüsselungsschlüssel mit:

```bash
openssl rand -base64 32
```

### Schritt 3: Legen Sie die extern sichtbaren URLs fest. Für eine Bereitstellung bei `https://repovio.example.com` verwenden Sie:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Schritt 4: Binden Sie die Container-Ports an Loopback, wenn der Reverse-Proxy auf demselben Host ausgeführt wird:

Verwenden Sie die API- und Web-Port-Variablen im `.env.example` der Version mit den Werten `127.0.0.1:3001` bzw.
`127.0.0.1:3000`. Historische Variablennamen unterscheiden sich von den aktuellen Repovio-Versionen.

Beschränken Sie andernfalls den Zugriff auf die Ports 3000 und 3001 mit der Host-Firewall. Legen Sie den
PostgreSQL-Behälter niemals frei.

### Schritt 5: Setzen Sie die Release-Selection-Variable aus dem getaggten `.env.example` in `.env` auf ein exaktes freigegebenes Image-Paar und starten Sie dann den Stack:

```bash
docker compose pull
docker compose up --detach --wait
```

Behalten Sie diesen Wert in `.env` bei, damit jeder spätere Compose-Befehl dieselbe API und Webversion verwendet.

### Schritt 6: Bestätigen Sie den API-Gesundheitsendpunkt lokal:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Schritt 7: Öffnen Sie die öffentliche URL Repovio und vervollständigen Sie die URL [einmalige Ersteinrichtung](/docs/v1.0/authentication), um die erste zu erstellen

Systemadministrator.

<a id="reverse-proxy-and-tls"></a>

## Reverse-Proxy und TLS

Stellen Sie den öffentlichen Webursprung auf Port 3000 und die API- und Socket.IO-Pfade auf Port 3001 um. Beispielsweise
kann ein Caddy-Site-Block Folgendes verwenden:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

Der Proxy muss HTTP zu HTTPS umleiten, Upstream-Verbindungen gemäß seiner lokalen Richtlinie validieren und den
öffentlichen Hostnamen beibehalten. Konfigurieren Sie OAuth-Anbieter mit derselben HTTPS-Rückruf-URL, die in
`OAUTH_CALLBACK_URL` festgelegt ist.

<a id="upgrading"></a>

## Upgrade

Verwenden Sie die genauen Konfigurations- und Bildreferenzen, die mit dieser historischen Version geliefert wurden. Die
aktuellen Anweisungen zum Branding-Upgrade gelten nur beim Wechsel zu einer neueren Repovio-Version; Kopieren Sie
niemals umbenannte Konfigurationskennungen in eine ältere Compose-Datei.

### Schritt 1: Erstellen und überprüfen Sie eine Datenbanksicherung, bevor Sie Bilder ändern.

### Schritt 2: Setzen Sie die Release-Auswahlvariable aus dem getaggten `.env.example` auf die genaue Release-Version in `.env`.

### Schritt 3: Ziehen Sie die Entriegelung und wenden Sie sie an:

```bash
docker compose pull
docker compose up --detach --wait
```

Der `migrate`-Dienst wendet ausstehende Prisma-Migrationen an, bevor die API startet. Überprüfen Sie es nach jedem
Update:

```bash
docker compose logs migrate
```

### Schritt 4: Überprüfen Sie den Integritätsendpunkt und das vom Proxy bereitgestellte Dashboard, bevor Sie das Update als abgeschlossen betrachten.

<a id="database-backup"></a>

## Datenbanksicherung

Führen Sie Sicherungen aus dem Bereitstellungsverzeichnis aus. Dadurch wird ein PostgreSQL-Dump im benutzerdefinierten
Format auf den Host geschrieben, ohne Anmeldeinformationen zu drucken oder in die Befehlszeile einzugeben:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Speichern Sie verschlüsselte Kopien außerhalb des Hosts und testen Sie Wiederherstellungen regelmäßig auf einem
separaten System.

<a id="database-restore"></a>

## Datenbankwiederherstellung

Beim Wiederherstellen werden aktuelle Datenbankobjekte ersetzt. Erstellen Sie zunächst ein neues Backup und planen Sie
Ausfallzeiten ein.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Überprüfen Sie anschließend `docker compose logs migrate` und den API-Integritätsendpunkt. Stellen Sie einen Dump einer
kompatiblen Repovio-Version wieder her, wenn Sie ein Rollback über Schemaänderungen hinweg durchführen.

<a id="rollback"></a>

## Rollback

### Schritt 1: Bewahren Sie die Sicherung auf, die unmittelbar vor dem fehlgeschlagenen Upgrade erstellt wurde.

### Schritt 2: Setzen Sie die Release-Auswahlvariable aus dem getaggten `.env.example` in `.env` auf die letzte als funktionsfähig bekannte Image-Version.

### Schritt 3: Führen Sie `docker compose pull` und `docker compose up --detach --wait` aus.

### Schritt 4: Wenn die neuere Version die Datenbank inkompatibel migriert hat, stoppen Sie API und Web, stellen Sie die kompatible Sicherung wieder her und dann

Starten Sie die vorherige Image-Version erneut.

Verwenden Sie `docker compose down --volumes` niemals als Update- oder Rollback-Befehl: Dadurch wird das benannte
PostgreSQL-Volume entfernt.
