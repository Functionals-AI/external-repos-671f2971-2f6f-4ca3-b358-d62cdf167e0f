-- migrate:up

-- legacy athena schema, should be dropped once all data is migrated

CREATE SCHEMA IF NOT EXISTS athena_stage;

GRANT USAGE ON SCHEMA athena_stage TO svc_common;

-- migrate:down