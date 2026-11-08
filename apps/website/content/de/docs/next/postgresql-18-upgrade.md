---
title: PostgreSQL 17 auf 18 aktualisieren
description: Daten sicher in ein neues PostgreSQL-18-Volume übertragen und Wiederherstellung prüfen.
---

Der aktuelle Compose-Stack verwendet `postgres:18-alpine` und mountet sein benanntes Volume unter `/var/lib/postgresql`.
PostgreSQL 18 speichert den Cluster in einem versionsspezifischen Unterverzeichnis. PostgreSQL-17-Dateien können nicht
direkt verwendet werden. Siehe [offizielle Image-Dokumentation](https://hub.docker.com/_/postgres).

Dieses Verfahren erstellt einen Datenbank-Dump und stellt ihn in einem **separaten neuen Volume** wieder her. Ein
Wartungsfenster ist erforderlich. Nicht mit der [Branding-Umbenennung](/docs/next/branding-upgrade) kombinieren; diese
zuerst mit dem bisherigen PostgreSQL-17-Release abschließen. Eine Quellcodeaktualisierung führt keine
Produktionsmigration automatisch aus.

<a id="before-maintenance"></a>

## Vor der Wartung

- Vollständige bisherige Release-Konfiguration, `.env` und exakten PostgreSQL-17-Volume-Namen behalten. Die
  Compose-Datei im bisherigen Release-Verzeichnis behalten, damit relative Bind-Mounts und Umgebungsdateien korrekt
  aufgelöst werden.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` und `AUTH_JWT_SECRET` unverändert lassen.
  Der Schlüssel entschlüsselt vorhandene Provider- und Benachrichtigungszugangsdaten.
- Genügend Speicher für Dump, altes und neues Volume reservieren. Backups und `.env` als Geheimnisse schützen.
- Das Verfahren setzt Repovios einzelne Datenbankrolle voraus. Eigene Rollen, Berechtigungen, Erweiterungen und
  zusätzliche Datenbanken separat erfassen; der Anwendungs-Dump sichert sie nicht automatisch.
- Wiederherstellung und Prüfung mit einer wegwerfbaren Kopie proben. `pnpm test:postgres-upgrade` verwendet echte
  Anwendungsmigrationen und ausschließlich synthetische Daten; es validiert kein individuelles Produktionsbackup.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Schreibzugriffe stoppen und PostgreSQL 17 sichern

Diese Befehle im **bisherigen Release-Verzeichnis** mit dessen PostgreSQL-17-Compose-Konfiguration ausführen. Auch
weitere externe Schreibprozesse stoppen. Die neue Anwendung erst nach abgeschlossener Wiederherstellung und Prüfung
starten.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

Ausgangszahlen vertraulich festhalten. Den Dump durch Wiederherstellung validieren, nicht nur anhand seiner Größe. Altes
Volume und bisherige Konfiguration behalten. Niemals `docker compose down --volumes` ausführen oder eines der
Daten-Volumes löschen.

<a id="restore-into-postgresql-18"></a>

## In PostgreSQL 18 wiederherstellen

Im **neuen Release-Verzeichnis** dieselben Zugangsdaten und denselben Schlüssel behalten. `backup` auf den absoluten
Sicherungspfad setzen. Einen eindeutigen neuen Volume-Namen wählen und als `REPOVIO_POSTGRES_VOLUME` in der neuen `.env`
speichern; er muss sich vom PostgreSQL-17-Volume unterscheiden. Das External-Volume-Override verwenden, um fehlende oder
falsch geschriebene Namen abzulehnen.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

Ein wirklich neues, leeres Volume verwenden. Existiert der Name bereits, einen anderen wählen. Der Entrypoint lehnt alte
Datenlayouts ab, auch ein versehentlich unter dem neuen Wurzelpfad gemountetes PostgreSQL-17-Volume; er konvertiert
keine Daten. Bei Fehlern Dump und altes Volume behalten, Ursache untersuchen und mit einem weiteren neuen leeren Volume
wiederholen. Nicht mehrfach in eine teilweise wiederhergestellte Datenbank importieren.

Ausgangszahlen und repräsentative Beziehungen vergleichen. Anmeldung, Berechtigungen, Benachrichtigungskonfiguration und
Entschlüsselung mit dem erhaltenen Schlüssel prüfen. API-Zustand und Logs vertraulich prüfen. PostgreSQL 18 neu starten
und den Datenerhalt vor Wartungsende bestätigen. Das getestete Standard-Datenverzeichnis ist
`/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Wiederherstellung des vorherigen Stands

Vor neuen Schreibzugriffen kann der neue Stack gestoppt und das vollständige bisherige Release mit originalem
PostgreSQL-17-Volume und Konfiguration gestartet werden. Niemals beide Anwendungs-Stacks gleichzeitig schreiben lassen.
Neues Volume zur Diagnose behalten; PostgreSQL 17 darf niemals PostgreSQL-18-Dateien öffnen.

Nach neuen Schreibzugriffen ist das alte Volume veraltet; eine Rückkehr verliert diese Änderungen. Zuerst Datenabgleich
oder separat getestete Wiederherstellung planen. Der Import eines PostgreSQL-18-Dumps in 17 ist kein garantiertes
Downgrade. Beide Volumes und Backups behalten, bis der Betreiber das Wiederherstellungsfenster ausdrücklich beendet.

<a id="disposable-verification"></a>

## Prüfung mit wegwerfbaren Ressourcen

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

Der Test erstellt eindeutig benannte Container, Netzwerk und Volumes; führt echte Prisma-Migrationen auf beiden
Hauptversionen aus; prüft Neuinitialisierung und Shadow-Datenbank; lehnt ein falsch gemountetes altes Volume ab; stellt
einen Dump wieder her; vergleicht alle öffentlichen Tabellen; entschlüsselt synthetische Zugangsdaten und prüft
Neustartpersistenz sowie unveränderte Altdaten. Die Bereinigung entfernt ausschließlich Testressourcen. Vorhandene
Container, Volumes, Datenbanken und Zugangsdaten werden nicht verwendet. Mit `REPOVIO_TEST_API_IMAGE` ein anderes lokal
gebautes Anwendungsimage wählen.
