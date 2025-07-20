-- migrate:up
ALTER TABLE "telenutrition"."iam_user"
ALTER COLUMN "password" TYPE text;

-- migrate:down

