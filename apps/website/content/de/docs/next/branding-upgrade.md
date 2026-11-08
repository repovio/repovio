---
title: 'Repovio-Branding-Upgrade'
description: 'Behalten Sie Datenbankdaten und Anmeldeinformationen bei, wenn Sie zum Namen Repovio wechseln.'
---

Bei dieser Umbenennung handelt es sich um eine bahnbrechende Konfigurationsänderung. Aktualisieren Sie alle früheren
Umgebungsvariablen mit Produktpräfix auf das Präfix `REPOVIO_`, einschließlich `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`,
`REPOVIO_API_PORT` und `REPOVIO_WEB_PORT`. Verwenden Sie die API und Webbilder unter `ghcr.io/repovio/repovio-api` und
`ghcr.io/repovio/repovio-web`.

Schließen Sie die Branding-Umbenennung zuerst mit dem bisherigen PostgreSQL-17-Release ab. Die aktuelle
Compose-Konfiguration verwendet PostgreSQL 18; befolgen Sie vor deren Nutzung das
[separate PostgreSQL-18-Upgrade](/docs/next/postgresql-18-upgrade). Mounten Sie niemals PostgreSQL-17-Dateien in den
PostgreSQL-18-Dienst. Die folgenden Schritte verwenden die bisherige PostgreSQL-17-Konfiguration einschließlich
`compose.yml` und `compose.upgrade.yml`. Branding allein benötigt keine Datenkonvertierung; das
PostgreSQL-Hauptversionsupgrade ist ein separater Vorgang.

## PostgreSQL-Daten beibehalten

1. Sichern Sie die vorhandene Datenbank und stellen Sie sicher, dass die Sicherung wiederhergestellt werden kann, bevor
   Sie die Bereitstellung ändern.
2. Überprüfen Sie den laufenden PostgreSQL-Container mit `docker inspect <postgres-container>` und notieren Sie das
   genaue benannte Volume, das unter `/var/lib/postgresql/data` gemountet ist. Stoppen Sie die alte Anwendung und die
   PostgreSQL-Container, ohne Volumes zu löschen.
3. Stellen Sie `REPOVIO_POSTGRES_VOLUME` in der neuen Bereitstellungsumgebung auf genau diesen Volume-Namen ein.
   Bestätigen Sie mit `docker volume inspect <recorded-volume>`, dass es existiert. Der Standardwert für die
   Neuinstallation ist `repovio-postgres`; Es darf nicht versehentlich das Volume einer vorhandenen Installation
   ersetzen.
4. Behalten Sie `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` und `AUTH_JWT_SECRET`
   unverändert bei. Behalten Sie die Hauptversion von PostgreSQL bei. Überprüfen Sie `docker compose config` privat,
   bevor Sie beginnen. Seine Ausgabe enthält gelöste Geheimnisse und darf niemals geteilt oder festgeschrieben werden.
5. Verwenden Sie `docker compose -f compose.yml -f compose.upgrade.yml` für das Upgrade. Für diese Außerkraftsetzung
   muss das benannte Volume vorhanden sein, sodass ein falsch geschriebenes Volume nicht stillschweigend einen leeren
   Ersatz initialisieren kann. Starten Sie zuerst PostgreSQL und überprüfen Sie die vorhandene Datenbank. Starten Sie
   dann den Migrationsdienst und die Migrationsanwendung. Führen Sie im Rahmen dieser Umbenennung niemals
   `docker compose down --volumes` aus, entfernen Sie das alte Volume oder initialisieren Sie eine leere Datenbank.

Durch das Branding ist keine Datenkonvertierung erforderlich. Die Datenbankanmeldeinformationen und der
Verschlüsselungsschlüssel bleiben zum Lesen der vorhandenen Daten unerlässlich. Eine frühere Bereitstellung kann
mithilfe ihrer Konfiguration und des beibehaltenen Volumes wiederhergestellt werden. Vermeiden Sie gleichzeitige
Autoren.

## Authentifizierung und Browserstatus

Der Standard-JWT-Aussteller ist jetzt `repovio`; Melden Sie sich nach dem Upgrade erneut an. Auch ein explizit
konfigurierter Issuer muss bewusst aktualisiert werden. Vorhandene Browsereinstellungen, Benachrichtigungsstatus,
Cookies und Speicherschlüssel werden nicht importiert. Wählen Sie Ihre Sprache/Ihr Theme erneut aus, installieren Sie
ggf. die PWA neu und aktivieren Sie die Browserbenachrichtigungen erneut. Aktualisieren Sie ggf. die Anzeigenamen der
Identitätsanbieter und die Konfiguration externer Anwendungen. Rückrufrouten ändern sich nicht. Löschen Sie veraltete
Standortdaten erst, nachdem Sie bestätigt haben, dass die neue Installation funktioniert.

Frühere MCP-Tokens widerrufen und Ersatz erstellen: Das umbenannte Token-Präfix wird absichtlich nicht als Alias
akzeptiert.
