#!/bin/sh
set -eu

# A PostgreSQL 17 volume mounted at the new root must never initialize an empty PostgreSQL 18 cluster.
if [ -f /var/lib/postgresql/PG_VERSION ] || [ -f /var/lib/postgresql/data/PG_VERSION ]; then
  documentation_url='https://github.com/repovio/docs/blob/75e5fd90af4384cb85259772d5bd0e92ab5aade7/en/docs/next/'
  echo 'Legacy PostgreSQL data layout detected. Restore into a separate PostgreSQL 18 volume; see' \
    "${documentation_url}postgresql-18-upgrade.md" >&2
  exit 1
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
