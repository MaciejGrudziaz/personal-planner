#!/bin/sh
source ./.env

PREFIX=${PREFIX:-}

docker run --rm --network host -e PGPASSWORD=$DB_PASS postgres pg_dump  -h $DB_HOST -U $DB_USER -d personalplanner > backup/${PREFIX}backup.sql

