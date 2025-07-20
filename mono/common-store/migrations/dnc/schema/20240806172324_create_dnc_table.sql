-- migrate:up

CREATE TYPE common.dnc_source AS ENUM ('member', 'client', 'foodsmart');

CREATE TABLE "common"."dnc_entry_identity" (
	"identity_id" int4 REFERENCES telenutrition.iam_identity(identity_id),
	"optout_channel_voice" bool NOT NULL DEFAULT TRUE,
	"optout_channel_sms" bool NOT NULL DEFAULT TRUE,
	"optout_channel_email" bool NOT NULL DEFAULT TRUE,
	"source" common.dnc_source NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT NOW(),
	"created_by" text,
	"updated_at" timestamp,
	"updated_by" text,
	PRIMARY KEY ("identity_id")
);

CREATE TABLE "common"."dnc_entry_phone" (
	"phone" text NOT NULL check(phone ~ '^\+1\d{10}$'),
	"optout_channel_voice" bool NOT NULL DEFAULT TRUE ,
	"optout_channel_sms" bool NOT NULL DEFAULT TRUE,
	"source" common.dnc_source NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT NOW(),
	"created_by" text,
	"updated_at" timestamp,
	"updated_by" text,
	PRIMARY KEY ("phone")
);

CREATE TABLE "common"."dnc_entry_email" (
	"email" text NOT NULL check(email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
	"optout_channel_email" bool NOT NULL DEFAULT TRUE,
	"source" common.dnc_source NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT NOW(),
	"created_by" text,
	"updated_at" timestamp,
	"updated_by" text,
	PRIMARY KEY ("email")
);

CREATE OR REPLACE FUNCTION common.update_timestamp()
RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_dnc_entry_identity_updated
BEFORE UPDATE ON "common"."dnc_entry_identity"
FOR EACH ROW
EXECUTE PROCEDURE common.update_timestamp();

CREATE TRIGGER trigger_dnc_entry_phone_updated
BEFORE UPDATE ON "common"."dnc_entry_phone"
FOR EACH ROW
EXECUTE PROCEDURE common.update_timestamp();

CREATE TRIGGER trigger_dnc_entry_email_updated
BEFORE UPDATE ON "common"."dnc_entry_email"
FOR EACH ROW
EXECUTE PROCEDURE common.update_timestamp();

CREATE TYPE common.dnc_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TABLE common.dnc_audit_identity (
    audit_id serial PRIMARY KEY,
    identity_id int4 REFERENCES telenutrition.iam_identity(identity_id),
    operation common.dnc_operation NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by TEXT
);

CREATE OR REPLACE FUNCTION common.dnc_entry_identity_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO common.dnc_audit_identity (identity_id, operation, old_data, new_data, changed_by)
        VALUES (OLD.identity_id, 'DELETE', row_to_json(OLD), NULL, NVL(OLD.updated_by, OLD.created_by));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO common.dnc_audit_identity (identity_id, operation, old_data, new_data, changed_by)
        VALUES (OLD.identity_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), OLD.updated_by);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO common.dnc_audit_identity (identity_id, operation, old_data, new_data, changed_by)
        VALUES (NEW.identity_id, 'INSERT', NULL, row_to_json(NEW), NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dnc_audit_identity
AFTER INSERT OR UPDATE OR DELETE ON common.dnc_entry_identity
FOR EACH ROW EXECUTE FUNCTION common.dnc_entry_identity_trigger();

CREATE TABLE common.dnc_audit_phone (
    audit_id serial PRIMARY KEY,
		phone text NOT NULL,
    operation common.dnc_operation NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by TEXT
);

CREATE OR REPLACE FUNCTION common.dnc_entry_phone_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO common.dnc_audit_phone (phone, operation, old_data, new_data, changed_by)
        VALUES (OLD.phone, 'DELETE', row_to_json(OLD), NULL, NVL(OLD.updated_by, OLD.created_by));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO common.dnc_audit_phone (phone, operation, old_data, new_data, changed_by)
        VALUES (OLD.phone, 'UPDATE', row_to_json(OLD), row_to_json(NEW), OLD.updated_by);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO common.dnc_audit_phone (phone, operation, old_data, new_data, changed_by)
        VALUES (NEW.phone, 'INSERT', NULL, row_to_json(NEW), NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dnc_audit_phone
AFTER INSERT OR UPDATE OR DELETE ON common.dnc_entry_phone
FOR EACH ROW EXECUTE FUNCTION common.dnc_entry_phone_trigger();


CREATE TABLE common.dnc_audit_email (
    audit_id serial PRIMARY KEY,
		email text NOT NULL,
    operation common.dnc_operation NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by TEXT
);

CREATE OR REPLACE FUNCTION common.dnc_entry_email_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO common.dnc_audit_email (email, operation, old_data, new_data, changed_by)
        VALUES (OLD.email, 'DELETE', row_to_json(OLD), NULL, NVL(OLD.updated_by, OLD.created_by));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO common.dnc_audit_email (email, operation, old_data, new_data, changed_by)
        VALUES (OLD.email, 'UPDATE', row_to_json(OLD), row_to_json(NEW), OLD.updated_by);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO common.dnc_audit_email (email, operation, old_data, new_data, changed_by)
        VALUES (NEW.email, 'INSERT', NULL, row_to_json(NEW), NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dnc_audit_email
AFTER INSERT OR UPDATE OR DELETE ON common.dnc_entry_email
FOR EACH ROW EXECUTE FUNCTION common.dnc_entry_email_trigger();



-- migrate:down

