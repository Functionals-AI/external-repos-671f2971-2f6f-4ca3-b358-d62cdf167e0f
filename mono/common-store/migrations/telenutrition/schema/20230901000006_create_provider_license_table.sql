-- migrate:up

CREATE TABLE "telenutrition"."schedule_provider_license" (
  "license_id" text,
  "candid_provider_credentialing_span_id" text,
  "provider_id" integer NOT NULL REFERENCES telenutrition.schedule_provider(provider_id),
  "status" text NOT NULL,
  "state" bpchar(2) NOT NULL,
  "issue_date" date,
  "expiration_date" date,
  PRIMARY KEY ("license_id")
);


-- migrate:down

