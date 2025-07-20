-- migrate:up
INSERT INTO "telenutrition"."schedule_consent" 
  (
    identity_id,
    consent_type,
    version,
    source,
    consented_at
  )
SELECT identity_id, 'provider', '1.0', 1, last_consented
FROM
  "telenutrition"."schedule_patient"
WHERE
  last_consented IS NOT NULL;

-- migrate:down

