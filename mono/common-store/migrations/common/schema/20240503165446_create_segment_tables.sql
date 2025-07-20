-- migrate:up

CREATE TABLE common.segment_profile (
    segment_profile_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    query TEXT NOT NULL,
    profile_schema JSONB NOT NULL,
    label TEXT NOT NULL,
    description TEXT NOT NULL, 
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE common.segment_definition (
    segment_definition_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_profile_id INT NOT NULL,
    rule TEXT NOT NULL,
    label TEXT NOT NULL,
    schedule TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    CONSTRAINT "segment_profile_id_fkey" FOREIGN KEY ("segment_profile_id") REFERENCES "common"."segment_profile"("segment_profile_id")
);

CREATE TABLE common.segment_sync (
    segment_sync_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_definition_id INT NOT NULL,
    sync_status TEXT NOT NULL,
    stats JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    CONSTRAINT "segment_id_fkey" FOREIGN KEY ("segment_definition_id") REFERENCES "common"."segment_definition"("segment_definition_id")
);

CREATE TABLE common.segment_member (
    segment_member_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_definition_id INT NOT NULL,
    segment_sync_id INT NOT NULL,
    member_id INT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    CONSTRAINT "segment_id_fkey" FOREIGN KEY ("segment_definition_id") REFERENCES "common"."segment_definition"("segment_definition_id"),
    CONSTRAINT "segment_sync_id_fkey" FOREIGN KEY ("segment_sync_id") REFERENCES "common"."segment_sync"("segment_sync_id")
);

CREATE TABLE common.segment_member_history (
    segment_member_history_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_definition_id INT NOT NULL,
    segment_sync_id INT NOT NULL,
    member_id INT,
    operation TEXT,
    updated_at TIMESTAMP,
    CONSTRAINT "segment_id_fkey" FOREIGN KEY ("segment_definition_id") REFERENCES "common"."segment_definition"("segment_definition_id"),
    CONSTRAINT "segment_sync_id_fkey" FOREIGN KEY ("segment_sync_id") REFERENCES "common"."segment_sync"("segment_sync_id")
);

CREATE TABLE common.segment_destination_definition (
    segment_destination_definition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_profile_id INT NOT NULL,
    destination TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    destination_parameters JSONB NOT NULL,
    destination_config JSONB[] NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT "segment_profile_id_fkey" FOREIGN KEY ("segment_profile_id") REFERENCES "common"."segment_profile"("segment_profile_id")
);

CREATE TABLE common.segment_destination_mapping (
    segment_destination_mapping_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_definition_id INT NOT NULL,
    segment_destination_definition_id INT NOT NULL,
    destination_config JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "segment_id_fkey" FOREIGN KEY ("segment_definition_id") REFERENCES "common"."segment_definition"("segment_definition_id"),
    CONSTRAINT "segment_destination_id_fkey" FOREIGN KEY ("segment_destination_definition_id") REFERENCES "common"."segment_destination_definition"("segment_destination_definition_id")
);

CREATE TABLE common.segment_destination_sync (
    segment_destination_sync_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_destination_mapping_id INT NOT NULL,
    sync_status TEXT,
    stats JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    CONSTRAINT "segment_destination_mapping_id_fkey" FOREIGN KEY ("segment_destination_mapping_id") REFERENCES "common"."segment_destination_mapping"("segment_destination_mapping_id")
);

-- migrate:down

DROP TABLE IF EXISTS common.segment_member_remove_tracker CASCADE;
DROP TABLE IF EXISTS common.segment_member_add_tracker CASCADE;
DROP TABLE IF EXISTS common.segment CASCADE;
DROP TABLE IF EXISTS common.segment_destination CASCADE;


