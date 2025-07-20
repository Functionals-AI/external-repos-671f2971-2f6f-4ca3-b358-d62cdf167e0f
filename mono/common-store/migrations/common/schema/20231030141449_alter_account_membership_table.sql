-- migrate:up
ALTER TABLE "common"."account_membership"
  ADD COLUMN IF NOT EXISTS "sql" text,
  ADD COLUMN IF NOT EXISTS "type" text;

-- migrate:down