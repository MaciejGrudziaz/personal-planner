#!/bin/bash

CONTAINER_NAME=${CONTAINER_NAME:-personal-planner-db}

docker start ${CONTAINER_NAME}

