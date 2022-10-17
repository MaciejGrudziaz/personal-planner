#!/bin/bash
source ./.env

BACKUP_FILE=${BACKUP_FILE:-backup.sql}

docker run -it --rm --network host -e PGPASSWORD=$DB_PASS postgres dropdb -h $DB_HOST -U $DB_USER personalplanner
docker run -it --rm --network host -e PGPASSWORD=$DB_PASS postgres createdb -h $DB_HOST -U $DB_USER personalplanner
docker run -it --rm --network host -e PGPASSWORD=$DB_PASS -v ${BACKUP_DIR}:/tmp postgres psql -h $DB_HOST -U $DB_USER personalplanner -f /tmp/${BACKUP_FILE}

