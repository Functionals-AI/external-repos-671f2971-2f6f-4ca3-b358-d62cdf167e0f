-- migrate:up

GRANT SELECT, INSERT, UPDATE, DELETE
ON common.segment_sync
TO svc_retool;

-- migrate:down

