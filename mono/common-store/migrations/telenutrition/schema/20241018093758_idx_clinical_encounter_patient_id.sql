-- migrate:up transaction:false

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_encounter_patient_id
ON telenutrition.clinical_encounter(patient_id);

-- migrate:down