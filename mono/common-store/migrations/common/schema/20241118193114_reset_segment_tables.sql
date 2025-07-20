-- migrate:up

TRUNCATE common.segment_profile CASCADE;

ALTER TABLE common.segment_profile ALTER COLUMN updated_at DROP NOT NULL;

ALTER TABLE common.segment_destination_definition ALTER COLUMN updated_at DROP NOT NULL;

DROP TRIGGER IF EXISTS trigger_segment_definition_update_timestamp ON common.segment_definition;

CREATE TRIGGER trigger_segment_definition_update_timestamp
    BEFORE UPDATE ON common.segment_definition
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_destination_definition_update_timestamp ON common.segment_destination_definition;

CREATE TRIGGER trigger_segment_destination_definition_update_timestamp
    BEFORE UPDATE ON common.segment_destination_definition
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_destination_sync_update_timestamp ON common.segment_destination_sync;

CREATE TRIGGER trigger_segment_destination_sync_update_timestamp
    BEFORE UPDATE ON common.segment_destination_sync
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_member_update_timestamp ON common.segment_member;

CREATE TRIGGER trigger_segment_member_update_timestamp
    BEFORE UPDATE ON common.segment_member
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_member_history_update_timestamp ON common.segment_member_history;

CREATE TRIGGER trigger_segment_member_history_update_timestamp
    BEFORE UPDATE ON common.segment_member_history
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_profile_update_timestamp ON common.segment_profile;

CREATE TRIGGER trigger_segment_profile_update_timestamp
    BEFORE UPDATE ON common.segment_profile
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();

DROP TRIGGER IF EXISTS trigger_segment_sync_update_timestamp ON common.segment_sync;

CREATE TRIGGER trigger_segment_sync_update_timestamp
    BEFORE UPDATE ON common.segment_sync
    FOR EACH ROW
    EXECUTE PROCEDURE common.update_timestamp ();
    
WITH SPI AS (
INSERT INTO common.segment_profile ("query",
        "profile_schema",
        "label",
        "description",
        "segment_member_id_column")
        VALUES('SELECT identity_id FROM fq_common_telenutrition.schedule_referral',
            '{"field": "identity_id", "type": "int"}',
            'referral_identity_ids',
            'Identity IDs of Referrals',
            'identity_id')
    RETURNING
        segment_profile_id
),
SD AS (
INSERT INTO common.segment_definition ("segment_profile_id",
        "rule",
        "label",
        "schedule",
        "description")
SELECT
    segment_profile_id,
    'referral_status IN (''accepted'') AND account_id = 61',
    'caloptima_referral_schedule',
    'daily',
    'Accepted CalOptima referrals'
FROM
    SPI
RETURNING
    segment_definition_id
),
SDD AS (
INSERT INTO common.segment_destination_definition ("segment_profile_id",
        "destination",
        "label",
        "description",
        "destination_parameters",
        "destination_config")
SELECT
    segment_profile_id,
    'customer.io',
    'caloptima_referrals_to_cio',
    'Sync CalOptima accepted referrals to Customer.io',
    '{ "type": "serviceOperation", "name": "Cio.syncDataToCio" }',
    '{}'
FROM
    SPI
RETURNING
    segment_destination_definition_id
) INSERT INTO common.segment_destination_mapping ("segment_definition_id", "segment_destination_definition_id", "destination_config")
SELECT
    SD.segment_definition_id,
    SDD.segment_destination_definition_id,
    '{}'
FROM
    SD
    CROSS JOIN SDD;

-- migrate:down

