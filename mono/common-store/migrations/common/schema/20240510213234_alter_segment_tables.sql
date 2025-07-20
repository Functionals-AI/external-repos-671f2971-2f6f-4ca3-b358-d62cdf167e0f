-- migrate:up
ALTER TABLE "common"."segment_profile"
  ADD COLUMN IF NOT EXISTS "segment_member_id_column" text NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE
ON common.segment_definition, common.segment_member, common.segment_member_history, 
common.segment_destination_definition, common.segment_destination_mapping, 
common.segment_destination_sync, common.segment_profile 
TO svc_retool;

-- migrate:down

