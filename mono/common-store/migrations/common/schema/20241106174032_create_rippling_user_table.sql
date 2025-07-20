-- migrate:up

CREATE TABLE common.rippling_user (
  rippling_user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  active BOOLEAN NOT NULL,
  source_created_at TIMESTAMP NOT NULL,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE common.employee
  ADD COLUMN rippling_user_id TEXT;

GRANT SELECT
ON common.rippling_user
TO svc_retool;

GRANT SELECT
ON common.rippling_user
TO svc_redshift;

-- migrate:down

