#!/bin/sh
source ./.env

docker run -it --rm --network host -e PGPASSWORD=$DB_PASS postgres dropdb -h $DB_HOST -U $DB_USER personalplanner
docker run -it --rm --network host -e PGPASSWORD=$DB_PASS postgres createdb -h $DB_HOST -U $DB_USER personalplanner
docker run -it --rm --network host -e PGPASSWORD=$DB_PASS -v $(pwd)/backup:/tmp postgres psql -h $DB_HOST -U $DB_USER personalplanner -f /tmp/backup.sql

