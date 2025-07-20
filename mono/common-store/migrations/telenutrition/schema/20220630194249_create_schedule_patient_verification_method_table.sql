-- migrate:up
CREATE SEQUENCE IF NOT EXISTS telenutrition.schedule_patient_verification_method_verification_method_id_seq;

-- Table Definition
CREATE TABLE "telenutrition"."schedule_patient_verification_method" (
    "verification_method_id" int4 NOT NULL DEFAULT nextval('telenutrition.schedule_patient_verification_method_verification_method_id_seq'::regclass),
    "method" varchar(20) NOT NULL,
    "value" varchar(50) NOT NULL,
    "verification_id" int4 NOT NULL,
    "created_at" timestamp DEFAULT now(),
    PRIMARY KEY ("verification_method_id")
);

-- migrate:down

