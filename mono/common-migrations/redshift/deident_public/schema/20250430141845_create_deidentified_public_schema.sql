-- migrate:up

CREATE SCHEMA IF NOT EXISTS deident_public; 

-- migrate:down

DROP SCHEMA IF EXISTS deident_public CASCADE;