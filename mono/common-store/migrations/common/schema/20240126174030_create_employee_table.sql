-- migrate:up

CREATE TABLE common.employee (
  employee_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company TEXT NOT NULL CHECK (company IN ('zipongo', 'fnn')),
  role_state TEXT CHECK (role_state IN ('init', 'hired', 'accepted', 'active', 'terminated', 'deleted')),
  employment_type TEXT CHECK (employment_type IN ('contractor', 'salaried_ft', 'salaried_pt', 'hourly_ft', 'hourly_pt', 'temp')),
  start_date DATE,
  end_date DATE,
  title TEXT,
  first_name TEXT,
  last_name TEXT,
  preferred_first_name TEXT,
  preferred_last_name TEXT,
  personal_email TEXT,
  work_email TEXT,
  custom_fields JSONB,
  rippling_id TEXT NOT NULL UNIQUE,
  rippling_employee_number INT NOT NULL UNIQUE,
  source_created_at TIMESTAMP NOT NULL,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

GRANT SELECT
ON common.employee
TO svc_retool;

-- migrate:down

