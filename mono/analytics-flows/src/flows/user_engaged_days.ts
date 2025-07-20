import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    rate: '6 hours',
    startAt: 'CreateUserActiveDays',
    states: {
      CreateUserActiveDays: Redshift.query({
        sql: `
        DROP TABLE IF EXISTS analytics.user_active_days;
        CREATE TABLE analytics.user_active_days AS 
        WITH eu AS (
        SELECT  
        	 EU.user_id,
        	 timestamp 'epoch' + EU.event_time/1000 * interval '1 second' AS active_date
        FROM event_user EU
        WHERE user_id IS NOT NULL 
        	AND timestamp 'epoch' + EU.event_time/1000 * interval '1 second' >= '2017-01-01'
        	AND EXISTS (SELECT 1 FROM event_ui_view EV WHERE EV.event_id = EU.event_id)
        )
        ,
        fau AS (
        SELECT DISTINCT 
        	GU.ta_identity_id::INT AS identity_id,
        	GU.ta_user_id::INT,
        	eu.user_id::INT AS fs_user_id,
        	DATE_TRUNC('day',active_date) AS active_date,
        	'enterprise_app' AS activity_location
        FROM eu
        	LEFT JOIN
        		fq_foodapp_tenants.go_users GU ON GU.id = eu.user_id
        )
        
        ,
        tau AS (
        SELECT DISTINCT 
        	IDE.identity_id::INT,
        	SFE.tn_app_user_id::INT AS ta_user_id,
        	IUS.fs_user_id::INT,
        	DATE_TRUNC('day',SFE."timestamp") as activie_date,
        	'teleapp'  AS activity_location
        FROM 
        	analytics.scheduling_flow_events SFE
        	LEFT JOIN
        		fq_common_telenutrition.iam_user IUS ON IUS.user_id = SFE.tn_app_user_id
        	LEFT JOIN 
        		fq_common_telenutrition.iam_identity IDE ON IDE.identity_id = IUS.identity_id
        WHERE 
        	tn_app_user_id IS NOT NULL 
        )
        ,	
        rdu AS (
        with a AS (
        SELECT DISTINCT 
        	patientid,
        	appointmentdate::DATE AS active_date,
        	'rd_visit_engagement' AS activity_location
        FROM 
        	athena_stage.appointment_raw AR 
        WHERE 
        	appointmentcancelleddatetime IS NULL 
        	AND
        		appointmentdate::DATE < CURRENT_DATE::DATE
        	AND 
        		appointmentid = parentappointmentid
        	AND 
        		patientid IS NOT NULL 
        
        UNION ALL
        
        SELECT DISTINCT 
        	patientid,
        	appointmentscheduleddatetime::DATE,
        	'rd_visit_engagement' AS activity_location
        FROM 
        	athena_stage.appointment_raw AR 
        WHERE 
        	appointmentid = parentappointmentid
        	AND 
        	appointmentscheduleddatetime::DATE IS NOT NULL )
        SELECT DISTINCT 
        	SP.identity_id::INT,
        	IU.user_id::INT AS ta_user_id,
        	IU.fs_user_id::INT,
        	a.active_date,
        	a.activity_location
        FROM a
        	LEFT JOIN
        		fq_common_telenutrition.schedule_patient SP ON a.patientid = SP.patient_id  
        	LEFT JOIN 
        		fq_common_telenutrition.iam_user IU ON IU.identity_id = SP.identity_id
        )
        ,
        eau AS (
        SELECT DISTINCT
	GU.ta_identity_id,
	GU.ta_user_id,
	CE.user_id AS fs_user_id,
	CE.event_timestamp::DATE AS event_date,
	'email' AS activity_location
FROM combined_emails CE
	LEFT JOIN fq_foodapp_tenants.go_users GU ON GU.id = CE.user_id
WHERE CE.event_type LIKE '%Click%' OR event_type LIKE '%Open%'
        )
        
        SELECT * FROM rdu 
        UNION ALL  
        SELECT * FROM fau 
        UNION ALL 
        SELECT * FROM tau 
        UNION ALL
        SELECT * FROM eau        `,
      }),
    }
  }
})
