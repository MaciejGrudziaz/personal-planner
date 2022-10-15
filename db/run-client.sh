#!/bin/bash
source ./.env

docker run -it --rm --network host -e PGPASSWORD=$DB_PASS postgres psql -h $DB_HOST -U $DB_USER -d personalplanner

