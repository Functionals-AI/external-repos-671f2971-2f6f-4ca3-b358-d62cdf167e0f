-- migrate:up

UPDATE common.segment_definition
SET
    schedule = 'rate(1 day)';

-- migrate:down

