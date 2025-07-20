-- migrate:up

CREATE TABLE "telenutrition"."incentive_account" (
  "incentive_account_id" serial,
  "account_id" int4 NOT NULL,
  "incentive_id" int4 NOT NULL,
  "active_at" timestamp NOT NULL,
  "inactive_at" timestamp check (inactive_at > active_at),
  "created_at" timestamp DEFAULT NOW(), 
  PRIMARY KEY ("incentive_account_id"),
  CONSTRAINT fk_incentive_id
    FOREIGN KEY(incentive_id)
    REFERENCES telenutrition.incentive(incentive_id),
  CONSTRAINT fk_account_id
    FOREIGN KEY(account_id)
    REFERENCES common.account(account_id)
);

-- migrate:down

