-- migrate:up

ALTER TABLE telenutrition.provider_program_enrollment
DROP COLUMN IF EXISTS "effective_date",
DROP COLUMN IF EXISTS "end_date";

-- migrate:down

