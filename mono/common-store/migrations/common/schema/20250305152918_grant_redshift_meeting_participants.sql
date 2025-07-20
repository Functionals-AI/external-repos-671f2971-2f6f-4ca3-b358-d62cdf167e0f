-- migrate:up

GRANT SELECT
ON common.meeting_participant
TO svc_redshift;

-- migrate:down