-- migrate:up
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS common.account_membership_account_membership_id_seq;

-- Table Definition
CREATE TABLE "common"."account_membership" (
    "account_membership_id" int4 NOT NULL DEFAULT nextval('common.account_membership_account_membership_id_seq'::regclass),
    "account_id" int4 NOT NULL,
    "query" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("account_membership_id")
);

-- migrate:down

