-- migrate:up

ALTER TABLE telenutrition.schedule_provider
    ADD COLUMN "npi" integer,
    ADD CONSTRAINT schedule_provider_unique_npi UNIQUE (npi);


-- migrate:down

