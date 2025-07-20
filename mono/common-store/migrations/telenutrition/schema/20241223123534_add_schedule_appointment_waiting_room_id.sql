-- migrate:up

ALTER TABLE telenutrition.schedule_appointment
ADD COLUMN waiting_id uuid unique;

ALTER TABLE telenutrition.schedule_appointment_history
ADD COLUMN waiting_id uuid;

-- migrate:down
