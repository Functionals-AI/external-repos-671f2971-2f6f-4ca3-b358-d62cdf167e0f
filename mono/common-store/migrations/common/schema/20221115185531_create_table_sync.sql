-- migrate:up
-- Table
CREATE TABLE "common"."sync_token" (
    "name" varchar(50) NOT NULL,
    "value" varchar(50) NOT NULL,
    "created" timestamptz NOT NULL DEFAULT now(),
    "updated" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("name")
);

-- Function
CREATE OR REPLACE FUNCTION common.trigger_set_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER set_sync_token_updated
BEFORE UPDATE ON common.sync_token
FOR EACH ROW
EXECUTE PROCEDURE common.trigger_set_updated();

-- migrate:down
