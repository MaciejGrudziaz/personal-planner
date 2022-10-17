#!/bin/sh

CONTAINER_NAME=${CONTAINER_NAME:-personal-planner-db}

docker stop ${CONTAINER_NAME}

