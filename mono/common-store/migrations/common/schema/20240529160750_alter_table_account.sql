-- migrate:up

ALTER TABLE "common"."account"
ADD COLUMN "enrollment_url" text;

-- migrate:down

