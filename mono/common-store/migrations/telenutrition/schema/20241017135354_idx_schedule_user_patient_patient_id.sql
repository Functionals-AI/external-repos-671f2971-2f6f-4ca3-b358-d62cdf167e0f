-- migrate:up transaction:false

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedule_user_patient_patient_id
ON telenutrition.schedule_user_patient (patient_id);

-- migrate:down

