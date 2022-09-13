# !/bin/bash

docker run --name personal-planner-db -e POSTGRES_USER=mg -e POSTGRES_PASSWORD=1234 -e POSTGRES_DB=personalplanner -p 5432:5432 personal-planner-postgres

