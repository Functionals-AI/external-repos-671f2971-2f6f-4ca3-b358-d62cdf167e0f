-- migrate:up 

ALTER TABLE telenutrition.provider_program_enrollment
ADD CONSTRAINT unique_provider_id_program_state
UNIQUE (provider_id, program, state);

-- migrate:down