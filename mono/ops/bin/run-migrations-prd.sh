#!/bin/bash
echo "Running DBMATE migrations in STG..."

if [ $# -ne 1 ]
then
  echo "usage: run-migrations <domain>"
  echo ""
  echo "example: run-migrations telenutrition"
else
  echo "Running telenutrition migrations..."
	AWS_PROFILE=prod aws ecs run-task \
	--launch-type FARGATE \
	--cluster OpsStore \
	--network-configuration '{"awsvpcConfiguration":{"subnets":["subnet-6530d401"],"securityGroups":["sg-097ad5b01f1f12488"],"assignPublicIp":"DISABLED"}}' \
	--overrides "{\"containerOverrides\":[{\"name\": \"ops-store-task\", \"command\":[\"--migrations-dir\", \"/app/common-store/migrations/$1/schema\", \"--migrations-table\", \"dbmate.$1_migrations\", \"up\"]}]}" \
	--task-definition OpsStore-task
fi