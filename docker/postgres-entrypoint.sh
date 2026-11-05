#!/bin/sh
set -eu

# A PostgreSQL 17 volume mounted at the new root must never initialize an empty PostgreSQL 18 cluster.
if [ -f /var/lib/postgresql/PG_VERSION ] || [ -f /var/lib/postgresql/data/PG_VERSION ]; then
  echo 'Legacy PostgreSQL data layout detected. Restore into a separate PostgreSQL 18 volume; see docs/postgresql-18-upgrade.md.' >&2
  exit 1
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
