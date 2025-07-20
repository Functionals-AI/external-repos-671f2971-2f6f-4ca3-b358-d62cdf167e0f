-- migrate:up

-- Create a separate view for the license summary, so that we can update
-- the lvalid license logic without needing to recreate (or grant permission)
-- to the schedule_department_provider_licensed view
CREATE OR REPLACE VIEW telenutrition.provider_license_summary AS (
  WITH licenses AS (
    SELECT
      provider_id,
      state,
      ARRAY_AGG(license_id) AS valid_licenses
    FROM telenutrition.provider_license
    WHERE
      status = 'active' AND
      certificate_type = 'RD' AND
      verification_status IN ('manually_verified', 'automatically_verified') AND
      now() <= expiration_date
    GROUP BY (provider_id, state)
  ), applications AS (
    SELECT
      provider_id,
      state,
      ARRAY_AGG(license_application_id) AS valid_applications
    FROM telenutrition.provider_license_application
    WHERE status = 'submitted'
    GROUP BY (provider_id, state)
  )
  SELECT
    provider_id,
    state,
    valid_licenses,
    valid_applications,
    (
      CASE
        WHEN valid_licenses IS NOT NULL THEN 'licensed'
        WHEN valid_applications IS NOT NULL THEN 'pending'
        ELSE 'invalid'
      END
    ) AS license_type
  FROM licenses FULL OUTER JOIN applications
  USING (provider_id, state)
);

CREATE OR REPLACE VIEW telenutrition.schedule_department_provider_licensed AS (
  SELECT
    provider_id,
    department_id,
    (
      licensure_required IS FALSE OR
      license_type = 'licensed' OR
      (pending_licensure_allowed AND license_type = 'pending')
    ) AS is_schedulable,
    (
      CASE
        WHEN licensure_required IS FALSE OR license_type = 'licensed' THEN 'all'
        WHEN pending_licensure_allowed AND license_type = 'pending' THEN 'pending'
      END
    ) schedulable_type
  FROM telenutrition.schedule_department_provider
  LEFT OUTER JOIN telenutrition.schedule_department USING (department_id)
  LEFT OUTER JOIN telenutrition.state_credentialing_config USING (state)
  LEFT OUTER JOIN telenutrition.provider_license_summary USING (provider_id, state)
);

GRANT SELECT ON TABLE telenutrition.schedule_department_provider_licensed TO svc_retool;

-- migrate:down
