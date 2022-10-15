# !/bin/bash
source ./.env

docker run --name personal-planner-db -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PASS -e POSTGRES_DB=personalplanner -p 5432:5432 personal-planner-postgres

