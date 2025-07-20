-- migrate:up

UPDATE telenutrition.billing_transaction AS BT
SET meta = jsonb_set(BT.meta, '{schema_type}', '"claim_v1"', true)
FROM telenutrition.billing_contract AS BC
WHERE BC.billing_contract_id = BT.billing_contract_id
  AND BC.contract_type = 'claim'
  AND BT.meta ->> 'schema_type' IS NULL;


-- migrate:down

