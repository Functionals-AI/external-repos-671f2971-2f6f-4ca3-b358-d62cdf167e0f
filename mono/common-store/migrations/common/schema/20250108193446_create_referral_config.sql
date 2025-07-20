-- migrate:up
CREATE TABLE IF NOT EXISTS common.referral_config (
    account_id INTEGER PRIMARY KEY REFERENCES common.account(account_id),

    -- If TRUE the referral source will be processed.
    process_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    custom_flow BOOLEAN NOT NULL DEFAULT FALSE,

    eligibility_required BOOLEAN NOT NULL DEFAULT FALSE,
    eligibility_grace_period_in_seconds INTEGER NOT NULL DEFAULT 0,

    callback_config JSONB
);

GRANT SELECT, INSERT, UPDATE ON TABLE common.referral_config TO svc_retool;

-- Enable processing for ABHIL
INSERT INTO common.referral_config
  (account_id, process_enabled)
VALUES
  (60, TRUE)
ON CONFLICT DO NOTHING 
;

-- migrate:down
