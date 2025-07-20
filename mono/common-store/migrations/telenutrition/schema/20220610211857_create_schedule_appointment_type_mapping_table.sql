-- migrate:up
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS telenutrition.schedule_appointment_type_mappi_appointment_type_mapping_id_seq;

-- Table Definition
CREATE TABLE "telenutrition"."schedule_appointment_type_mapping" (
    "appointment_type_mapping_id" int4 NOT NULL DEFAULT nextval('telenutrition.schedule_appointment_type_mappi_appointment_type_mapping_id_seq'::regclass),
    "appointment_type_id" int2 NOT NULL,
    "slot_appointment_type_id" int2 NOT NULL,
    PRIMARY KEY ("appointment_type_mapping_id")
);

-- migrate:down

