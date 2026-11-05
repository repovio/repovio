---
title: Repovio branding upgrade
description: Preserve database data and credentials when moving to the Repovio name.
---

# Repovio branding upgrade

This rename is a breaking configuration change. Update every former product-prefixed environment variable to the
`REPOVIO_` prefix, including `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`, `REPOVIO_API_PORT` and `REPOVIO_WEB_PORT`.
Use the API and web images under `ghcr.io/repovio/repovio-api` and `ghcr.io/repovio/repovio-web`.

## Preserve PostgreSQL data

1. Back up the existing database and confirm that the backup can be restored before changing the deployment.
2. Inspect the running PostgreSQL container with `docker inspect <postgres-container>` and record the exact named volume
   mounted at `/var/lib/postgresql/data`. Stop the old application and PostgreSQL containers without deleting volumes.
3. Set `REPOVIO_POSTGRES_VOLUME` in the new deployment environment to that exact volume name. Confirm it exists using
   `docker volume inspect <recorded-volume>`. The new-installation default is `repovio-postgres`; it must not replace an
   existing installation's volume accidentally.
4. Retain `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` and `AUTH_JWT_SECRET` unchanged.
   Complete the branding rename on PostgreSQL 17 first using the previous release configuration. The current Compose
   configuration targets PostgreSQL 18; follow [the separate PostgreSQL 18 upgrade](postgresql-18-upgrade.md) before
   using it. Never mount PostgreSQL 17 files into the PostgreSQL 18 service. Review `docker compose config` privately before starting; its output contains
   resolved secrets and must never be shared or committed.
5. Use the retained PostgreSQL 17 release's `compose.yml` and `compose.upgrade.yml` for the branding upgrade. That override requires the named volume
   to exist, so a misspelled volume cannot silently initialize an empty replacement. Start PostgreSQL first and verify the existing database, then start the migration service and application. Never run
   `docker compose down --volumes`, remove the old volume, or initialize a blank database as part of this rename.

No data conversion is required by branding alone. A PostgreSQL major upgrade is a separate operation. The database credentials and encryption key remain essential to read the
existing data. A previous deployment can be restored using its configuration and retained volume; avoid concurrent writers.

## Authentication and browser state

The default JWT issuer is now `repovio`; sign in again after upgrading. An explicitly configured issuer must also be
updated deliberately. Existing browser preferences, notification state, cookies and storage keys are not imported.
Select your language/theme again, reinstall the PWA if necessary, and re-enable browser notifications.
Update identity-provider display names and external application configuration where appropriate; callback routes do not
change. Clear obsolete site data only after confirming the new installation works.

Revoke previous MCP tokens and create replacements: the renamed token prefix is intentionally not accepted as an alias.
