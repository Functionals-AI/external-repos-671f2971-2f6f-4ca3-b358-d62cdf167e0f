-- migrate:up

ALTER TABLE common.segment_destination_definition DROP CONSTRAINT IF EXISTS segment_destination_definition_segment_profile_id_fkey;

ALTER TABLE common.segment_destination_definition DROP COLUMN IF EXISTS segment_profile_id;

ALTER TABLE common.segment_destination_definition DROP COLUMN IF EXISTS destination_config;

-- migrate:down

