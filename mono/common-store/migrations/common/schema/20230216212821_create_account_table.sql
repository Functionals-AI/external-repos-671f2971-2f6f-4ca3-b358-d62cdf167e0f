-- migrate:up
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS common.account_account_id_seq;

-- Table Definition
CREATE TABLE "common"."account" (
    "account_id" int4 NOT NULL DEFAULT nextval('common.account_account_id_seq'::regclass),
    "name" text NOT NULL,
    "active" bool NOT NULL DEFAULT false,
    "features" _varchar,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("account_id")
);

-- migrate:down

