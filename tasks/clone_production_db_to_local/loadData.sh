#!/bin/bash

set -e
set -a

pushd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null

. ../../handlers/utils/postgres.env.local

export PGDATABASE="$POSTGRES_DB"
export PGUSER="$POSTGRES_USER"
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGHOST="$POSTGRES_HOST"
export PGPOST="$POSTGRES_PORT"

if [ "$PGHOST" != '127.0.0.1' ]; then
  (>&2 echo "For safety, this script fails if PGHOST != 127.0.0.1")
  exit 1
fi

zcat avail_auth.dump-except-users.sql.gz | psql

popd >/dev/null
