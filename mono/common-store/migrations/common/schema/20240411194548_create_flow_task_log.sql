-- migrate:up

CREATE SEQUENCE IF NOT EXISTS common.flow_task_log_id_seq;

CREATE TABLE IF NOT EXISTS common.flow_task_log (
  flow_task_log_id int NOT NULL DEFAULT nextval('common.flow_task_log_id_seq'::regclass),
  flow_id varchar(64) NOT NULL,
  task_id varchar(64) NOT NULL,
  status varchar(16) NOT NULL,
  skipped_reason varchar(32),
  skipped_flow_log_id int REFERENCES common.flow_task_log(flow_task_log_id),
  input_id varchar(32),
  input jsonb,
  input_hash varchar(32),
  input_date date,
  output jsonb,
  output_hash varchar(32),
  state_machine_arn TEXT,
  execution_arn TEXT,
  start_at timestamp NOT NULL,
  end_at timestamp,
  meta jsonb,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("flow_task_log_id")
);

-- Function
CREATE OR REPLACE FUNCTION common.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS set_flow_task_log_updated_at ON common.flow_task_log;

CREATE TRIGGER set_flow_task_log_updated_at
BEFORE UPDATE ON common.flow_task_log
FOR EACH ROW
EXECUTE PROCEDURE common.trigger_set_updated_at();

-- migrate:down
