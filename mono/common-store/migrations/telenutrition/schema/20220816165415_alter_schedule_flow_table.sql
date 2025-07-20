-- migrate:up
ALTER TABLE "telenutrition"."schedule_flow" ALTER COLUMN "timezone" DROP NOT NULL;

-- migrate:down

