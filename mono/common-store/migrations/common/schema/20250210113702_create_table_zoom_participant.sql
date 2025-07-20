-- migrate:up

create table if not exists common.meeting_participant (
  user_id text not null,
  meeting_id text not null,
  join_time timestamptz,
  leave_time timestamptz,
  duration int,
  internal_user boolean,
  raw_data jsonb,
  UNIQUE(user_id, meeting_id, join_time)
);

CREATE INDEX if not exists meeting_participant_meeting_id_idx ON common.meeting_participant(meeting_id);

-- migrate:down