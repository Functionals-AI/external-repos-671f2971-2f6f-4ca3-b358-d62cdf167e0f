-- migrate:up
CREATE TABLE telenutrition.sticky_note
(
    sticky_note_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_note_id       INT REFERENCES telenutrition.sticky_note (sticky_note_id) ON DELETE CASCADE, -- Link to the original note
    patient_id  INT          NOT NULL REFERENCES telenutrition.schedule_patient (patient_id) ON DELETE CASCADE,
    provider_id INT          NOT NULL REFERENCES telenutrition.schedule_provider (provider_id) ON DELETE SET NULL,
    source_type          VARCHAR,
    source_id            INT,
    note_content         VARCHAR(200) NOT NULL,                                          -- based on the figma shared, limiting to 200 characters
    status               TEXT         NOT NULL    DEFAULT 'active',                      -- check can be added for active, archieved for future use cases
    is_active            BOOLEAN      NOT NULL    DEFAULT TRUE,                          -- flag to mark if the current version is active
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),                -- timestamp when the note was created
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),                -- timestamp when the note was last updated
    archived_at          TIMESTAMP WITH TIME ZONE                                        -- timestamp when the note was archived, making this optional as it can be null at most times till a note is archieved
);

CREATE INDEX "sticky_note_patient_id_idx" ON telenutrition.sticky_note ("patient_id");

-- migrate:down

