-- migrate:up 

UPDATE telenutrition.schedule_insurance
SET payer_id = 16
WHERE insurance_id = 20;

UPDATE telenutrition.payment_method_type
SET insurance_id = 20, payer_id = 16
WHERE payment_method_type_id = 20;

-- migrate:down
