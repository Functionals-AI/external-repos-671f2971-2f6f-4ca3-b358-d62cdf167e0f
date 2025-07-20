import { JsonObject, workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'
import Csv, { CsvOutputFormat } from '@mono/common-flows/lib/tasks/file/csv'
import Gpg, {EncryptKeys} from '@mono/common-flows/lib/tasks/encryption/gpg'
import S3, { CopyBucket } from '@mono/common-flows/lib/tasks/aws/s3'

enum State {
  FetchReport = 'FetchReport',
  ExportReport = 'ExportReport',
  EncryptReport = 'EncryptReport',
  SendReport = 'SendReport',
}

export default workflow(function(config) {
  if (config.isProduction) {
    return {
      cron: '30 8 ? * THU *',
      startAt: State.FetchReport,
      states: {
        [State.FetchReport]: Redshift.query({
          sql: `
WITH get_programs AS (
  SELECT
    patient_id,
    SPLIT_PART(SUBSTRING(interventions, 3), '"', 1) AS intervention
  FROM (
    SELECT
      patient_id,
      ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY start_timestamp ASC) AS number_of_intervention,
      interventions
    FROM (
      SELECT
        CE.patient_id,
        json_extract_path_text(CE.raw_data, 'interventions') AS interventions,
        DA.start_timestamp
      FROM analytics.dim_appointment DA
      INNER JOIN fq_common_telenutrition.clinical_encounter CE
          ON CE.appointment_id = DA.appointment_id
      WHERE DATE(DA.start_timestamp) >= DATE_TRUNC('YEAR', CURRENT_DATE)::DATE
      AND CE.encounter_status = 'closed'
    )
    WHERE LENGTH(interventions) > 2
  )
  WHERE number_of_intervention = 1
),
valid_users AS (
	--get valid users and program
	SELECT
		*
	FROM (
		SELECT
-- 			gu.id,
-- 			gu.ta_identity_id as identity_id,
			gu.eligible_id,
			UPPER(gu.member_id) AS member_id,
			gu.organization_id,
			gu.last_enrolled_date,
			gu.firstname,
			gu.lastname,
			sp.patient_id,
            prog.intervention,
			row_number() OVER (PARTITION BY UPPER(gu.member_id)
				ORDER BY
					sp.patient_id ASC) AS rownum
			FROM
				fq_foodapp_tenants.go_users gu
			LEFT JOIN fq_foodapp_tenants.go_users_eligible goe ON gu.eligible_id = goe.id
			LEFT JOIN fq_common_telenutrition.iam_identity ii ON goe.id = ii.eligible_id
			LEFT JOIN fq_common_telenutrition.schedule_patient sp ON ii.identity_id = sp.identity_id
            LEFT JOIN get_programs prog ON sp.patient_id = prog.patient_id
		WHERE
			gu.organization_id = 182
			AND gu.member_id IS NOT NULL
			AND gu.member_id != ''
			AND gu.last_enrolled_date::date >= DATE_TRUNC('YEAR', CURRENT_DATE)::DATE
			--AND gu.member_id NOT in('dschmocker2651', 'vpirkle0685')
			ORDER BY
				gu.lastname)  sub
	WHERE
		sub.rownum = 1 
),
nq AS (
--Get NutriQuiz scores
SELECT
	user_id,
	eligible_id,
	date::date AS take_date,
	((fruits + vegetables) / 2 + carb_ratio + protein_ratio + fat_ratio + sodium + hydration) AS total_score
FROM (
SELECT
	*,
	row_number() OVER (PARTITION BY user_id,
		date ORDER BY total_score DESC) AS rownum
FROM
	public.zhei_user zu
	LEFT JOIN fq_foodapp_tenants.go_users gu ON gu.id = zu.user_id ) sub
WHERE
	rownum = 1
	AND date::date >= DATE_TRUNC('YEAR', CURRENT_DATE)::DATE
),
valid_users_nq AS (
--Pull 4 NQ scores for valid users
SELECT
	sub.eligible_id,
	sub.firstname,
	sub.lastname,
	max( CASE WHEN sub.rownum = 1 THEN
		sub.take_date
	ELSE
		NULL
	END) AS first_nq,
	max( CASE WHEN sub.rownum = 2 THEN
		sub.take_date
	ELSE
		NULL
	END) AS second_nq,
	max( CASE WHEN sub.rownum = 3 THEN
		sub.take_date
	ELSE
		NULL
	END) AS third_nq,
	max( CASE WHEN sub.rownum = 4 THEN
		sub.take_date
	ELSE
		NULL
	END) AS fourth_nq,
	min(sub.take_date) AS min_nq,
	max(sub.take_date) AS max_nq,
	listagg (DISTINCT sub.take_date,
	', ')
WITHIN GROUP (ORDER BY sub.take_date ASC) AS nqs,
count(*) AS num_nqs
FROM (
SELECT
-- 	nq.user_id,
	nq.eligible_id,
-- 	vu.patient_id,
	vu.firstname,
	vu.lastname,
	nq.take_date,
	row_number() OVER (PARTITION BY vu.eligible_id ORDER BY nq.take_date) AS rownum
FROM
	nq
	INNER JOIN ( SELECT DISTINCT
		vu.eligible_id,
		vu.firstname,
		vu.lastname
	FROM
		valid_users vu) vu ON nq.eligible_id = vu.eligible_id) sub
--where sub.rownum <= 4
GROUP BY
-- 	sub.patient_id,
	sub.eligible_id,
	sub.firstname,
	sub.lastname ORDER BY
		sub.firstname,
		sub.lastname
),
valid_users_appts AS (
--Pull 4 completed appts for valid users
SELECT
	sub.eligible_id,
	sub.firstname,
	sub.lastname,
	max( CASE WHEN sub.rownum = 1 THEN
		sub.start_timestamp
	ELSE
		NULL
	END) AS first_appt,
	max( CASE WHEN sub.rownum = 2 THEN
		sub.start_timestamp
	ELSE
		NULL
	END) AS second_appt,
	max( CASE WHEN sub.rownum = 3 THEN
		sub.start_timestamp
	ELSE
		NULL
	END) AS third_appt,
	max( CASE WHEN sub.rownum = 4 THEN
		sub.start_timestamp
	ELSE
		NULL
	END) AS fourth_appt,
	listagg (sub.start_timestamp,
	', ')
WITHIN GROUP (ORDER BY sub.start_timestamp ASC) AS appts,
count(*) AS num_appts
FROM (
SELECT
-- 	a.patient_id,
	vu.eligible_id,
	vu.firstname,
	vu.lastname,
	a.start_timestamp,
	row_number() OVER (PARTITION BY a.patient_id ORDER BY a.start_timestamp) AS rownum
FROM
	analytics.dim_appointment a
	INNER JOIN fq_common_telenutrition.schedule_patient sp on sp.patient_id = a.patient_id
	INNER JOIN fq_common_telenutrition.iam_identity ii on ii.identity_id = sp.identity_id
	INNER JOIN ( SELECT DISTINCT
-- 		vu.patient_id,
		vu.eligible_id,
		vu.firstname,
		vu.lastname
	FROM
		valid_users vu) vu ON ii.eligible_id = vu.eligible_id
WHERE
	a.status_normalized in('completed', '2')
	AND a.start_timestamp::date >= DATE_TRUNC('YEAR', CURRENT_DATE)::DATE
	AND a.start_timestamp::date < CURRENT_DATE) sub
WHERE
	rownum <= 4 GROUP BY
		sub.eligible_id,
		sub.firstname,
		sub.lastname
)
SELECT
	upper(vu.member_id) AS aah_unique_id, upper(vu.firstname) AS first_name, upper(vu.lastname) AS last_name, LEAST(DATE(vu.enrollment_date), DATE(vu_appts.first_appt)) AS enrollment_date, vu.intervention,
    CASE WHEN vu.intervention IS NOT NULL
        AND vu_appts.fourth_appt IS NOT NULL
		AND vu_nq.max_nq IS NOT NULL
		AND vu_nq.min_nq != vu_nq.max_nq
		AND vu_nq.max_nq >= (vu_appts.fourth_appt::date - 7) THEN
		vu_appts.fourth_appt::date
    	ELSE NULL
	END AS completion_date, vu_nq.nqs AS nq_take_dates, coalesce(sched.has_scheduled_appt, 'N') AS scheduled_appt, vu_appts.appts AS rd_visit_dates
	FROM (
		SELECT
			vu.member_id, vu.firstname, vu.lastname, vu.eligible_id, min(vu.last_enrolled_date) AS enrollment_date, vu.intervention
		FROM
			valid_users vu
		GROUP BY
			vu.member_id,
			vu.firstname,
			vu.lastname,
			vu.eligible_id,
            vu.intervention) vu
	LEFT JOIN valid_users_appts AS vu_appts ON vu.eligible_id = vu_appts.eligible_id
	LEFT JOIN valid_users_nq vu_nq ON vu.eligible_id = vu_nq.eligible_id
	LEFT JOIN --join to flag if member has a booked/completed visit
	( SELECT DISTINCT
			ii.eligible_id,
			'Y' AS has_scheduled_appt
		FROM
			analytics.dim_appointment a
			INNER JOIN fq_common_telenutrition.schedule_patient sp on sp.patient_id = a.patient_id
			inner join fq_common_telenutrition.iam_identity ii on ii.identity_id = sp.identity_id
		WHERE
			a.status_normalized in('completed', '2', 'booked')
			AND a.start_timestamp::date >= DATE_TRUNC('YEAR', CURRENT_DATE)::DATE) sched ON vu.eligible_id = sched.eligible_id
ORDER BY
	--upper(vu.lastname)
	completion_date,
	vu_appts.fourth_appt,
	vu_appts.third_appt,
	vu_appts.second_appt,
	vu_appts.first_appt,
	sched.has_scheduled_appt ASC;
          `,
					output: (input) => {
						return input.results[0] as JsonObject
					},
          next: State.ExportReport,		
        }),
        [State.ExportReport]: Csv.stringify({
          header: true,
          outputFormat: CsvOutputFormat.Text,
          next: State.EncryptReport,
        }),
        [State.EncryptReport]: Gpg.encrypt({
          key: EncryptKeys.AahHealthyLiving,
          fileName: 'AAH_Health_Living_Events_|MMddyyyy|.csv.pgp',
          next: State.SendReport,
        }),
        [State.SendReport]: S3.copy({
          destBucket: CopyBucket.SftpServerBucket,
          destKey: 'aahhealthyliving/${filename}',
        })
      }
    }
  }
})

