-- migrate:up
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS "telenutrition"."schedule_appointment_appointment_id_seq";

-- Table Definition
CREATE TABLE "telenutrition"."schedule_appointment" (
    "appointment_id" int4 NOT NULL DEFAULT nextval('telenutrition.schedule_appointment_appointment_id_seq'::regclass),
    "appointment_type_id" int2 NOT NULL,
    "date" varchar(20) NOT NULL,
    "duration" int2 NOT NULL,
    "start_time" varchar(20) NOT NULL,
    "provider_id" int4 NOT NULL,
    "department_id" int2 NOT NULL,
    "frozen" bool NOT NULL,
    "start_timestamp" timestamptz NOT NULL,
    "status" bpchar(1) NOT NULL,
    "patient_id" int4,
    PRIMARY KEY ("appointment_id")
);


-- migrate:down

