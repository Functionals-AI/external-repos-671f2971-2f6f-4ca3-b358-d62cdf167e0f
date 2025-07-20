import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '5 15 * * ? *',
    startAt: 'CompletedAppts',
    states: {
      CompletedAppts: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.completed_appts;
          CREATE TABLE c360.completed_appts AS 
	SELECT 
		appts_patientid, 
	    COUNT(DISTINCT appointment_id) AS completed_appts
	FROM athena.summary_telenutrition_appointments
	WHERE appointmentcancelleddatetime IS NULL 
		AND appointmentdate < current_date 
		AND appts_appointmentid = parentappointmentid 
		AND appointmentstatus IN ('2 - Checked In','4 - Charge Entered','3 - Checked Out')
	GROUP BY 1 
            ;
          COMMIT TRANSACTION;
        `,
        next: 'FutureAppts',
      }),
      FutureAppts: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.future_appts;
          CREATE TABLE c360.future_appts AS 
		SELECT 
		  appts_patientid, 
		  COUNT(DISTINCT appointment_id) AS scheduled_appts
		FROM athena.summary_telenutrition_appointments
		WHERE appointmentcancelleddatetime IS NULL 
			AND appointmentdate >= current_date 
			AND appts_appointmentid = parentappointmentid 
		GROUP BY 1 
              ;
          COMMIT TRANSACTION;
        `,
        next: 'NextAppt',
      }),
      NextAppt: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.next_appt;
          CREATE TABLE c360.next_appt AS 
          WITH fa as (
		SELECT DISTINCT
		    appts_patientid, 
		    appts_appointmentid, 
		    appointmentdate AS next_appt_date,
		    row_number() over (partition by appts_patientid order by appointmentdate ASC ) AS appt_number
		FROM athena.summary_telenutrition_appointments
		WHERE appointmentcancelleddatetime IS NULL 
  			AND appointmentdate > current_date 
     			AND appts_appointmentid = parentappointmentid 
		  )
		SELECT * FROM fa WHERE appt_number = 1 
            ;
          COMMIT TRANSACTION;
        `,
        next: 'FirstAppt',
      }),
      FirstAppt: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.initial_appt;
          CREATE TABLE c360.initial_appt AS
          with ia AS (		
          SELECT DISTINCT
                appts_patientid, 
                appts_appointmentid, 
                appointmentdate AS inital_appt_date,
                row_number() over (partition by appts_patientid order by appointmentdate ASC ) AS appt_number

            FROM athena.summary_telenutrition_appointments
	    WHERE appointmentcancelleddatetime IS NULL 
   		AND appointmentdate <= current_date AND appts_appointmentid = parentappointmentid 
		)
	SELECT * FROM ia WHERE appt_number = 1
          ;
          COMMIT TRANSACTION;
        `,
        next: 'LastAppt',
      }),
      LastAppt: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.last_appt;
          CREATE TABLE c360.last_appt AS 
	WITH la as (
              SELECT DISTINCT
                appts_patientid, 
                appts_appointmentid, 
                appointmentdate AS last_appt_date,
                row_number() over (partition by appts_patientid order by appointmentdate DESC ) AS last_appt_number
              FROM athena.summary_telenutrition_appointments
              WHERE appointmentcancelleddatetime IS NULL AND appointmentdate < current_date 
	      	AND appts_appointmentid = parentappointmentid 
              )
              SELECT * FROM la WHERE last_appt_number = 1
          ;
          COMMIT TRANSACTION;
        `,
        next: 'NoShowApptNum',
      }),
      NoShowApptNum: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.no_show_num;
          CREATE TABLE c360.no_show_num AS 
          SELECT DISTINCT
	    appts_patientid, 
	    appts_appointmentid, 
	    appointmentdate ,
	    row_number() over (partition by appts_patientid order by appointmentdate ASC ) AS no_show_number
	FROM athena.summary_telenutrition_appointments
	WHERE (appointmentcancelreason = 'PATIENT NO SHOW' OR appointmentcancelreason = 'LAST MINUTE CANCELLATION' )
 		AND appointmentdate < current_date 
   		AND appts_appointmentid = parentappointmentid 
          ;
          COMMIT TRANSACTION;
        `,
        next: 'TotalNoShowAppts',
     }),
      TotalNoShowAppts: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.total_no_shows;
          CREATE TABLE c360.total_no_shows AS 
          SELECT 
                appts_patientid, 
                COUNT(DISTINCT appts_appointmentid )
              FROM athena.summary_telenutrition_appointments
              WHERE (appointmentcancelreason = 'PATIENT NO SHOW' OR appointmentcancelreason = 'LAST MINUTE CANCELLATION' )
              		AND appointmentdate < current_date 
              		AND appts_appointmentid = parentappointmentid 
	 	GROUP BY 1
          ;
          COMMIT TRANSACTION;
        `,
        next: 'VisitNumThisYear',
     }), 
      VisitNumThisYear: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.visit_num_this_year;
          CREATE TABLE c360.visit_num_this_year AS 
          SELECT DISTINCT patientid, appointment_date,  appointment_id,
	              ROW_NUMBER() OVER (partition by patientid ORDER BY appointment_date ASC) visit_num_this_year
          FROM analytics.telenutrition_analytics
          WHERE appointment_date BETWEEN DATE_TRUNC('year', CURRENT_DATE) AND CURRENT_DATE 
          	AND appointmentcancelreason IS NULL
          	AND appointmentstatus IN ('2 - Checked In','4 - Charge Entered','3 - Checked Out')
	   	AND appts_appointmentid = parentappointmentid 
          ;
          COMMIT TRANSACTION;
          `,
	  next: 'FollowUpsCompleted',
     }), 
      FollowUpsCompleted: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.followups_completed;
          CREATE TABLE c360.followups_completed AS 
          SELECT patientid, COUNT(DISTINCT appointment_id) AS followups_completed
	  FROM analytics.telenutrition_analytics t
	  WHERE appt_num >1 
		AND appointment_date < CURRENT_DATE 
		AND appointmentcancelreason IS NULL 
		AND appointmentstatus IN ('2 - Checked In','4 - Charge Entered','3 - Checked Out')
  		AND appts_appointmentid = parentappointmentid 
	  GROUP BY 1 
          ;
          COMMIT TRANSACTION;
	  `,
	  next: 'FollowUpsScheduled',
     }), 
      FollowUpsScheduled: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.followups_scheduled;
          CREATE TABLE c360.followups_scheduled AS 
		SELECT patientid, COUNT(DISTINCT appointment_id) AS followups_scheduled
		FROM analytics.telenutrition_analytics t
		WHERE appt_num >1 
			AND appointment_date >= CURRENT_DATE 
			AND appointmentcancelreason IS NULL 
		GROUP BY 1 
          ;
          COMMIT TRANSACTION;
	 `,
	  next: 'totalCancels',
     }), 
      totalCancels: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.total_cancelled_appointments;
          CREATE TABLE c360.total_cancelled_appointments AS 
          SELECT patientid, COUNT(DISTINCT appointment_id) AS total_cancelled_appts
	  FROM analytics.telenutrition_analytics t
 	  WHERE cancelled_timestamp IS NOT NULL 
	  GROUP BY 1 
          ;
          COMMIT TRANSACTION;
	 `,
	  next: 'followUpsCancelled',
     }), 
	followUpsCancelled: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.followups_cancelled;
          CREATE TABLE c360.followups_cancelled AS 
          SELECT patientid, 
	  CASE WHEN (appt_num = 1 OR (num_previous_completed_appointments = 0  AND num_previous_cancelled_appointments = 0 AND appt_num IS NULL) OR (appointmenttypename LIKE '%Initial%')) 
		AND  appointmenttypename NOT LIKE '%Follow%' THEN 'Initial'
      		ELSE 'Follow-Up' END AS i_v_f,
	  COUNT(DISTINCT appointment_id) AS followups_cancelled
	  FROM analytics.telenutrition_analytics t
	  WHERE  cancelled_timestamp IS NOT NULL 
	  AND i_v_f = 'Follow-Up'
	  GROUP BY 1 ,2
          ;
          COMMIT TRANSACTION;
	 `,
	  next: 'followUpsNoshow',
     }), 
    followUpsNoshow: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.followups_noshows;
          CREATE TABLE c360.followups_noshows AS 
          SELECT patientid, 
	  CASE WHEN (appt_num = 1 OR (num_previous_completed_appointments = 0  AND num_previous_cancelled_appointments = 0 AND appt_num IS NULL) OR (appointmenttypename LIKE '%Initial%')) 
		AND  appointmenttypename NOT LIKE '%Follow%' THEN 'Initial'
      		ELSE 'Follow-Up' END AS i_v_f,
	  COUNT(DISTINCT appointment_id) AS followup_no_shows
	  FROM analytics.telenutrition_analytics t
	  WHERE cancelled_timestamp IS NOT NULL 
		AND i_v_f = 'Follow-Up'
		AND appointmentcancelreason IN ('LAST MINUTE CANCELLATION','PATIENT NO SHOW')
	  GROUP BY 1 ,2
          ;
          COMMIT TRANSACTION;
	 `,
	  next: 'initialNoshow',
     }),
	initialNoshow: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.initial_noshows;
          CREATE TABLE c360.initial_noshows AS 
          SELECT patientid, 
	  CASE WHEN (appt_num = 1 OR (num_previous_completed_appointments = 0  AND num_previous_cancelled_appointments = 0 AND appt_num IS NULL) OR (appointmenttypename LIKE '%Initial%')) 
		AND  appointmenttypename NOT LIKE '%Follow%' THEN 'Initial'
      		ELSE 'Follow-Up' END AS i_v_f,
	  COUNT(DISTINCT appointment_id) AS initial_no_shows
	  FROM analytics.telenutrition_analytics t
	  WHERE cancelled_timestamp IS NOT NULL 
		AND i_v_f = 'Initial'
		AND appointmentcancelreason IN ('LAST MINUTE CANCELLATION','PATIENT NO SHOW')
	  GROUP BY 1 ,2
          ;
          COMMIT TRANSACTION;
	 `,
	  next: 'initialCancels',
     }), 
	initialCancels: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.initial_cancels;
          CREATE TABLE c360.initial_cancels AS 
          SELECT patientid, 
	  CASE WHEN (appt_num = 1 OR (num_previous_completed_appointments = 0  AND num_previous_cancelled_appointments = 0 AND appt_num IS NULL) OR (appointmenttypename LIKE '%Initial%')) 
		AND  appointmenttypename NOT LIKE '%Follow%' THEN 'Initial'
      		ELSE 'Follow-Up' END AS i_v_f,
	  COUNT(DISTINCT appointment_id) AS initials_cancelled
	  FROM analytics.telenutrition_analytics t
	  WHERE cancelled_timestamp IS NOT NULL 
	  AND i_v_f = 'Initial'
	  GROUP BY 1 ,2
          ;
          COMMIT TRANSACTION;
	 `,
     }), 
    }
  }
})
