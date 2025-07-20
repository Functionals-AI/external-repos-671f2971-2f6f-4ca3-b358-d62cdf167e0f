-- migrate:up

ALTER TABLE telenutrition.billing_transaction
ADD COLUMN transaction_key TEXT;

CREATE UNIQUE INDEX billing_transaction_transaction_key_unique
ON telenutrition.billing_transaction (transaction_key);

WITH last_occurrences AS (
  SELECT DISTINCT ON (meta ->> 'external_id') billing_transaction_id, meta ->> 'external_id' AS ext_id
  FROM telenutrition.billing_transaction
  WHERE meta ->> 'external_id' IS NOT NULL
    AND transaction_key IS NULL
  ORDER BY meta ->> 'external_id', billing_transaction_id DESC
)
UPDATE telenutrition.billing_transaction bt
SET transaction_key = lo.ext_id
FROM last_occurrences lo
WHERE bt.billing_transaction_id = lo.billing_transaction_id;

-- migrate:down

