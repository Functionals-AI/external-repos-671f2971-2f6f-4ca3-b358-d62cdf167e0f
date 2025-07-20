-- migrate:up transaction:false

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_patient_payment_method_payment_method_type_id ON telenutrition.schedule_patient_payment_method (payment_method_type_id);

-- migrate:down
