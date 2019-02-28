#!/bin/bash

set -e
set -a

pushd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null

. ../../handlers/utils/postgres.env.prod

export PGDATABASE="$POSTGRES_DB"
export PGUSER="$POSTGRES_USER"
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGHOST="$POSTGRES_HOST"
export PGPOST="$POSTGRES_PORT"

pg_dump \
  --clean --schema=public \
  --exclude-table=users \
  --exclude-table=logins \
  --exclude-table=messages \
  --exclude-table=messages_id_seq \
  --exclude-table=signup_requests |
  gzip -9 > avail_auth.dump-except-users.sql.gz

popd >/dev/null
