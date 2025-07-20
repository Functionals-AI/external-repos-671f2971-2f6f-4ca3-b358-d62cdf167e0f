
-- migrate:up

CREATE MATERIALIZED VIEW "common"."dnc_list_email" AS
WITH
dnc_entry_email AS (
	SELECT
	  CAST(NULL AS int4) as identity_id,
	  DE.email,
		DE.optout_channel_email,
	  DE.created_at,
		DE.created_by,
	  DE.updated_at,
		DE.updated_by
	FROM common.dnc_entry_email DE
	WHERE
		DE.optout_channel_email = TRUE
),
identity_patient_email AS (
	SELECT
	  II.identity_id,
	  SP.email as email,
		DI.optout_channel_email,
	  DI.created_at,
		DI.created_by,
	  DI.updated_at,
		DI.updated_by
	FROM common.dnc_entry_identity DI
	LEFT JOIN telenutrition.iam_identity II ON II.identity_id=DI.identity_id
	LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
	WHERE
	  DI.optout_channel_email = TRUE
	  AND SP.email IS NOT NULL
),
email_union AS (
	  SELECT
	    *
	  FROM dnc_entry_email	  
	  UNION
	  SELECT
	    *
	  FROM identity_patient_email
)
SELECT
	email,
	array_agg(identity_id) FILTER (WHERE identity_id IS NOT NULL) as identity_ids,
	bool_and(optout_channel_email) AS optout_channel_email,
	min(created_at) AS created_at,
	max(updated_at) AS updated_at
FROM email_union
GROUP BY email;


CREATE MATERIALIZED VIEW "common"."dnc_list_phone" AS
WITH
dnc_entry_phone AS (
	SELECT
	  CAST(NULL AS int4) as identity_id,
	  DP.phone,
		DP.optout_channel_voice,
		DP.optout_channel_sms,
	  DP.created_at,
		DP.created_by,
		DP.updated_at,
		DP.updated_by
	FROM common.dnc_entry_phone DP
	WHERE
		DP.optout_channel_sms = TRUE
		OR DP.optout_channel_voice = TRUE
),
identity_patient_phone AS (
	SELECT
	  II.identity_id,
	  SP.phone as phone,
		DI.optout_channel_voice,
		DI.optout_channel_sms,
	  DI.created_at,
		DI.created_by,
	  DI.updated_at,
		DI.updated_by
	FROM common.dnc_entry_identity DI
	LEFT JOIN telenutrition.iam_identity II ON II.identity_id=DI.identity_id
	LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=II.identity_id
	WHERE
	  (
			DI.optout_channel_voice = TRUE
			OR DI.optout_channel_sms = TRUE
		)
		AND SP.phone IS NOT NULL
),
phone_union AS (
	  SELECT
	    *
	  FROM dnc_entry_phone 
	  UNION
	  SELECT
	    *
	  FROM identity_patient_phone
)
SELECT
	phone,
	array_agg(identity_id) FILTER (WHERE identity_id IS NOT NULL) as identity_ids,
	bool_and(optout_channel_voice) AS optout_channel_voice,
	bool_and(optout_channel_sms) AS optout_channel_sms,
	min(created_at) AS created_at,
	max(updated_at) AS updated_at
FROM phone_union
GROUP BY phone;


-- Indexes to improve performance of the materialized view
CREATE UNIQUE INDEX ON "common"."dnc_list_email" (email);
CREATE UNIQUE INDEX ON "common"."dnc_list_phone" (phone);
CREATE UNIQUE INDEX ON "common"."dnc_list_phone" (optout_channel_voice);
CREATE UNIQUE INDEX ON "common"."dnc_list_phone" (optout_channel_sms);

-- migrate:down

