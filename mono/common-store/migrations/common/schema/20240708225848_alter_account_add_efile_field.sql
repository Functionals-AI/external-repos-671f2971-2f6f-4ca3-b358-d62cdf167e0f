-- migrate:up
ALTER TABLE common.account
  ADD COLUMN efile bool NOT NULL DEFAULT false;

-- migrate:down

