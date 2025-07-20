-- migrate:up
CREATE SEQUENCE IF NOT EXISTS telenutrition.schedule_user_patient_user_patient_id_seq;

-- Table Definition
CREATE TABLE "telenutrition"."schedule_user_patient" (
    "user_patient_id" int4 NOT NULL DEFAULT nextval('telenutrition.schedule_user_patient_user_patient_id_seq'::regclass),
    "user_id" int4 NOT NULL,
    "patient_id" int4 UNIQUE NOT NULL,
    PRIMARY KEY ("user_patient_id"),
    FOREIGN KEY ("patient_id") REFERENCES telenutrition.schedule_patient ("patient_id")
);

-- migrate:down
