-- migrate:up

UPDATE "common"."account"
SET "active" = true
WHERE "account_id" = 60; -- Aetna ABHIL


-- migrate:down

