---
title: Upgrade PostgreSQL 17 to 18
description: Preserve database data when restoring PostgreSQL 17 into a separate PostgreSQL 18 volume.
---

The current Compose stack uses `postgres:18-alpine` and mounts its named volume at `/var/lib/postgresql`. PostgreSQL 18
stores the cluster in a version-specific subdirectory. PostgreSQL 17 data files cannot be used in place. See the
[official image documentation](https://hub.docker.com/_/postgres).

This procedure prepares an application database dump and restores it into a **separate new volume**. It requires a
maintenance window. Do not combine it with the [branding rename](/docs/v2.0/branding-upgrade); complete that rename on
the previous PostgreSQL 17 release first. No production migration runs automatically as part of a source update.

<a id="before-maintenance"></a>

## Before maintenance

- Retain the complete previous release configuration, its `.env`, and the exact PostgreSQL 17 volume name. Keep its
  Compose file in the previous release directory so relative bind mounts and environment files still resolve correctly.
- Keep `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY`, and `AUTH_JWT_SECRET` unchanged. The
  encryption key is required to decrypt existing provider and notification credentials.
- Reserve enough disk space for the dump, the old volume, and the new volume. Protect backups and `.env` as secrets.
- This procedure assumes Repovio's single database role. Inventory custom roles, grants, extensions, and additional
  databases separately before maintenance. Do not assume the application dump backs them up.
- Rehearse restore and verification with a disposable copy. The repository's `pnpm test:postgres-upgrade` builds on the
  application's real migrations and tests synthetic data only; it does not validate an individual deployment's backup.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Stop writers and back up PostgreSQL 17

Run these commands from the **previous release directory** using its PostgreSQL 17 Compose configuration. Stop any
additional external writers too. Do not start the new application before restoration and verification finish.

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

Record baseline counts privately. Validate the dump by restoring it, not just by checking its file size. Preserve the
old volume and previous configuration. Never run `docker compose down --volumes` or remove either data volume.

<a id="restore-into-postgresql-18"></a>

## Restore into PostgreSQL 18

In the **new release directory**, retain the same credentials and encryption key. Set `backup` to the absolute backup
path above. Select a unique new volume name and persist it as `REPOVIO_POSTGRES_VOLUME` in the new `.env`; it must
differ from the recorded PostgreSQL 17 volume. Use the external-volume override to reject misspelled or missing volume
names.

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

Use a genuinely new empty volume: if that name already exists, select another rather than reusing unknown data. The
entrypoint refuses legacy data layouts, including a PostgreSQL 17 volume mistakenly mounted at the new root. It does not
convert data. If restore fails, keep the dump and old volume, investigate the error, and retry with another new empty
volume; do not restore repeatedly over a partially restored database.

Compare baseline counts and representative relationships. Verify user login, permissions, notification configuration,
and credential decryption with the retained key. Check API health and logs privately. Restart PostgreSQL 18 and confirm
the same data remains before ending maintenance. The tested default data directory is `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Recovery

Before new application writes, recovery can stop the new stack and restart the complete previous release with its
original PostgreSQL 17 volume and configuration. Never run both application stacks as writers. Keep the new volume for
diagnosis; PostgreSQL 17 must never open PostgreSQL 18 data files.

After new writes, the retained PostgreSQL 17 volume is stale. Returning to it loses those writes. Plan data
reconciliation or a separately tested recovery first; restoring a PostgreSQL 18 dump into 17 is not a guaranteed
downgrade. Retain both volumes and backups until the operator explicitly decides that the recovery window has ended.

<a id="disposable-verification"></a>

## Disposable verification

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

The test creates uniquely named containers, a network, and volumes; applies the real Prisma migrations on both majors;
verifies fresh initialization and shadow-database creation; rejects an incorrectly mounted old volume; restores a dump;
compares all public tables; decrypts a synthetic credential; verifies restart persistence and the unchanged old data.
Cleanup removes only resources created by that test. Existing containers, volumes, databases, and credentials are not
used. Set `REPOVIO_TEST_API_IMAGE` to use another locally built application image.
