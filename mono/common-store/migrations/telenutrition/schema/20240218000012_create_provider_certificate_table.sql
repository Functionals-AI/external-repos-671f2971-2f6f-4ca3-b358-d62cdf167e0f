-- migrate:up

CREATE TABLE telenutrition.provider_board_certificate (
  certificate_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medallion_id TEXT NOT NULL UNIQUE,
  provider_id INT NOT NULL REFERENCES telenutrition.schedule_provider(provider_id),
  source TEXT NOT NULL CHECK (source IN ('admin', 'medallion')),
  abms TEXT,
  board_name TEXT NOT NULL,
  is_board_certification BOOLEAN NOT NULL,
  specialty TEXT NOT NULL,
  certification_number TEXT,
  is_exam_passed BOOLEAN,
  issue_date DATE,
  is_indefinite BOOLEAN NOT NULL,
  expiration_date DATE,
  recertification_date DATE,
  exam_date DATE,
  moc_status BOOLEAN,
  is_meeting_moc BOOLEAN,
  moc_verification_date DATE,
  moc_annual_reverification_date DATE,
  requires_verification BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP
);

-- migrate:down