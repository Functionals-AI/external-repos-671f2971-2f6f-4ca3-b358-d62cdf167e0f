-- migrate:up
INSERT INTO "telenutrition"."schedule_appointment_type" ("appointment_type_id", "name", "duration", "generic", "patient", "shortname") VALUES
(341, 'Audio Only Follow Up 60', 60, false, true, 'AF60')

-- migrate:down
