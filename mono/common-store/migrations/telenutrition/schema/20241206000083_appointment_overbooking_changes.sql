-- migrate:up

ALTER TABLE telenutrition.schedule_appointment
    ADD COLUMN coordinator_ruid INT,
    ALTER COLUMN provider_id DROP NOT NULL,
    ADD CONSTRAINT check_appointment_status CHECK 
    (
        (status IN ('f', 'x'))
        OR
        (status IN ('i') AND coordinator_ruid IS NOT NULL)
        OR
        (status IN ('o', '2', '3', '4') AND provider_id IS NOT NULL)
    );

ALTER TABLE telenutrition.schedule_appointment_history
    ADD COLUMN coordinator_ruid INT,
    ALTER COLUMN provider_id DROP NOT NULL;

-- migrate:down

