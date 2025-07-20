import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '30 14,15,16,20 * * ? *',
    startAt: 'PatientNqTakes',
    states: {
      PatientNqTakes: Redshift.query({
        sql: `
	          BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.patient_nq_takes;
            CREATE TABLE analytics.patient_nq_takes  AS
            WITH NS AS(
		SELECT
			id,
			user_id,
			score,
			created_at::DATE AS take_date
		FROM
			fq_foodapp_tenants.nutriscore
		WHERE
			complete = TRUE
			)
		
		SELECT DISTINCT 
			GU.ta_user_id AS user_id,
			GU.id AS fs_user_id,
			GU.ta_identity_id AS identity_id,
			GU.organization_id,
			IDE.account_id,
			SP.patient_id,
			TA.account AS tele_account,
			TA.initial_appt_date,
			TA.providerid,
			TA.providerfirstname,
			TA.providerlastname,
			NS.id AS nq_id,
			NS.score AS nutriscore,
			NS.take_date,
			NVL(NS.take_date <= TA.initial_appt_date, FALSE) AS nq_before_or_on_initial,
			NVL(NS.take_date = TA.initial_appt_date, FALSE) AS nq_on_initial,
			NVL(NS.take_date <= TA.initial_appt_date + interval '60 day', FALSE) AS initial_nq_witin_30_days
		
		FROM
			fq_common_telenutrition.schedule_patient SP
			LEFT JOIN fq_common_telenutrition.iam_identity IDE ON IDE.identity_id = SP.identity_id
			LEFT JOIN fq_foodapp_tenants.go_users GU ON GU.ta_identity_id = SP.identity_id
			LEFT JOIN fq_common_telenutrition.iam_user IU ON IU.user_id = GU.ta_user_id
			LEFT JOIN c360.initial_appt IA ON IA.appts_patientid = SP.patient_id
			LEFT JOIN analytics.telenutrition_analytics TA ON TA.appointment_id = IA.appts_appointmentid
			LEFT JOIN  NS ON NS.user_id = GU.id
		WHERE 
			initial_appt_date IS NOT NULL
			AND
				initial_appt_date::DATE < CURRENT_DATE::DATE  
                 ;
          COMMIT TRANSACTION; 
          `,
     }),     
    }
  }
})
