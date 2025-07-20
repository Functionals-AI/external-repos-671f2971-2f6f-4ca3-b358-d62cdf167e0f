import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = 'analytics.warehouse.deploy.completed'

export default workflow(function(config) {
  return {
    event: {
      bus: EVENT_BUS,
      source: [ 'foodsmart' ],
      detailType: [
        EVENT_TYPE
      ]
    },
    startAt: 'CreateTelenutritionAnalytic',
    states: {
      CreateTelenutritionAnalytic: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.telenutrition_analytics;
            CREATE TABLE analytics.telenutrition_analytics  AS
            WITH summ_tn_appts AS
            (
              SELECT a.appts_appointmentid,a.parentappointmentid,a.appmtscheduleddatetimeast,a.appointmentcreateddatetime,
                a.appointmentcancelleddatetime,a.appointmentdate,a.appointmentduration,a.appts_patientid,a.paymentplanid,a.schedulingproviderid,
                a.appointmentstatus,a.appts_claimid,a.scheduledby,a.appointmentcancelreason,a.appts_appointmenttypeid,a.appts_providerid,
                a.appointmentscheduleddatetime,a.nochargeentryreason,a.appointmenttypeid,a.appointmenttypename,a.claimid,a.claimpatientinsurancepid,
                a.claimprimarypatientinsid,a.claimtype,a.claimservicedate,a.visitbillid,a.visitgroupid,a.patientemployerid,a.enterpriseid,
                a.providergroupid,a.patientid,a.pat_state,a.pat_sex,a.pat_age_band,a.patientinsuranceid,a.insurancepackageid,
                a.policyidnumber,a.policygroupnumber,a.patientrelationship,a.insurancepackagename,a.superpackagename,a.providerprofileid,
                a.providerid,a.provider_state,a.billedname,a.billingproviderid,a.plcfirstname,a.plclastname,a.providerfirstname,a.providerlastname,
                a.appointment_id,a.appointment_day_week,a.appointment_date,a.appointment_month,a.appointment_start_time,
                a.between_15_and_30_days_indicator,a.between_2_and_7_days_indicator,a.between_8_and_14_days_indicator,a.cancelled_reason_type,
                a.cancelled_timestamp,a.p_id_sp,a.spcl_prgm,a.p_id_fs,a.food_scrpts,a.p_id_rct,a.rct,a.units_appointmentid,a.units,a.program,
                a.program_start_date, a.claim_status, a.procedurecode,
		CASE
			WHEN superpackagename LIKE '%CDPHP%' THEN 'CDPHP'
			WHEN (superpackagename LIKE '%Aetna%' AND insurancepackagename LIKE '%MEDICARE%') OR (superpackagename LIKE '%Aetna%' AND policygroupnumber LIKE '000003-%') THEN 'Aetna Medicare'
			WHEN superpackagename LIKE '%Chorus Community Health Plan (Medicaid%'  THEN 'CCHP - Medicaid'
			WHEN (superpackagename LIKE '%Chorus Community Health Plan (EPO)%' OR superpackagename LIKE '%Chorus Community Health Plan (HMO)%' OR insurancepackagename LIKE '%TOGETHER HEALTH%') OR  ((superpackagename LIKE '%Chorus Community Health Plan%' )  AND policyidnumber LIKE '22%') THEN 'CCHP - Exchange'
			WHEN superpackagename LIKE '%Dean Health Plan%' AND ((superpackagename NOT LIKE '%Chorus Community Health Plan%') AND (superpackagename NOT LIKE '%Together Health%')) THEN  'Dean Health Plan'
			WHEN spcl_prgm = 'Eatwise' THEN 'Eatwise'
   			WHEN superpackagename = 'BCBS-VA - Healthkeepers Plus (Medicaid Replacement - HMO)' THEN 'Elevance'
			WHEN spcl_prgm LIKE '%Houston Methodist%' THEN 'Houston Methodist'
			WHEN pm.insurance_id = 23 THEN 'Elevance - VA Medicaid'
			WHEN pm.insurance_id = 42 THEN 'CalOptima - Medicaid'
			WHEN pm.insurance_id = 43 THEN 'CareOregon - Medicaid'
			WHEN pm.insurance_id = 44 THEN 'Samaritan - Medicaid'
			WHEN superpackagename LIKE '%Harvard Pilgrim%' THEN 'Harvard Pilgrim'
			WHEN superpackagename LIKE '%Healthfirst%' THEN 'Healthfirst'
			WHEN superpackagename LIKE '%Banner%' THEN 'Banner Health'
			WHEN superpackagename LIKE '%Independent Health%' THEN 'Independent Health'
			WHEN superpackagename LIKE '%Martin''s Point Health Care (Medicare%'  THEN 'Martin''s Point GA'
			WHEN superpackagename LIKE '%Martin''s Point Health Care - US Family Health Plan (HMO)' THEN 'Martin''s Point Employees'
			WHEN superpackagename LIKE '%PacificSource%' THEN 'PacificSource'
			WHEN superpackagename LIKE '%United Health Care%' THEN 'United Health Care'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3174704' THEN 'CIGNA Corporation'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber IN ('2501092','2501095','2501097','2501099','2501101','2501103','3333236','2501066','2501068','2501070','2501072','2501074','2501076','2501079','2501081','2499248','2499250','2499252') THEN 'FedEx'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber IN ('3333770','2498659') THEN 'Metropolitan Nashville Public Schools'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3337975' THEN 'Smith & Nephew'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341974' THEN 'Phoenix Children''s Hospital'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341975' THEN 'Suez WTS'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3209340' THEN 'SEI'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341995' THEN 'EPAM Systems'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341058' THEN 'Arizona Public Schools (APS)'
			WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '2499162' THEN 'City of Clearwater'
   			WHEN insurancepackagename LIKE '%CHOICE BENEFITS%' THEN 'ArcBest'
			WHEN superpackagename LIKE '%Cigna%' AND NVL( policygroupnumber , 'NONE') NOT IN ('2499162','3341058','3341995','3209340','3341975','3341974','3337975','3174704','3333770','2498659','2501092','2501095','2501097','2501099','2501101','2501103','3333236','2501066','2501068','2501070','2501072','2501074','2501076','2501079','2501081','2499248','2499250','2499252') THEN 'Cigna National' 
			WHEN (superpackagename LIKE '%Umpqua%')  THEN 'Umpqua Medicaid'
			WHEN superpackagename LIKE '%Providence Health Plan%' THEN 'Umpqua Employees'
			WHEN insurancepackagename LIKE '%UNITED%'AND RIGHT(policygroupnumber,4) = 'DSNP' THEN 'UHC DSNP'
			WHEN spcl_prgm LIKE '%Regency Center%' THEN 'Regency'
			WHEN (spcl_prgm = 'BioM')  OR (superpackagename LIKE '%UMR%' )THEN 'BioMerieux'
			WHEN spcl_prgm = 'Northwestern Mutual' THEN 'Northwestern Mutual'
			WHEN spcl_prgm LIKE '%Salesforce%' OR (superpackagename LIKE '%Aetna%' AND policygroupnumber IN ('28573104000001','88352802000001','88352802300101','88352801700001','88352801900001','88352802300001','88352801800002','86881601100001','71998202300120','10799401000006','66037701100006','10919001100100','80021502300001','87058802000019','28573105500001','86523701500105','81127405000008')) OR (superpackagename LIKE '%United Healthcare%' AND policygroupnumber= '911585') THEN 'Salesforce'
			WHEN spcl_prgm LIKE '%Maricopa County%' THEN 'Maricopa County'
			WHEN spcl_prgm LIKE '%Advocate Aurora Health (AAH)%' THEN 'AAH Healthy Living'
			WHEN spcl_prgm LIKE '%United States House of Representatives%' THEN 'United States House of Representatives'
			WHEN spcl_prgm = 'Quartz' OR superpackagename LIKE '%Quartz%' THEN 'Quartz'
			WHEN insurancepackagename LIKE '%MOLINA%' THEN 'Molina'
   			WHEN insurancepackagename LIKE '%MASS GENERAL BRIGHAM%' THEN 'Mass General Brigham'
			WHEN superpackagename LIKE '%BCBS-TX%' THEN 'BCBS-TX'
			WHEN superpackagename LIKE '%BCBS%' THEN 'BCBS-IL'
			WHEN superpackagename LIKE '%CountyCare%' THEN 'Cook County Health'
			WHEN superpackagename LIKE '%Health Services for Children with Special Needs%' THEN 'Health Services for Children with Special Needs'
			WHEN  (superpackagename LIKE '%Aetna%' AND NVL(policygroupnumber,'None') NOT IN ('28573104000001','88352802000001','88352802300101','88352801700001','88352801900001','88352802300001','88352801800002','86881601100001','71998202300120','10799401000006','66037701100006','10919001100100','80021502300001','87058802000019','28573105500001','86523701500105','81127405000008')) THEN 'Aetna National'
			WHEN (insurancepackagename LIKE '%UNITED HEALTHCARE%' AND NVL(policygroupnumber,'None') != '911585') THEN 'UHC National'
			WHEN superpackagename LIKE '%Medicare-%' THEN 'Medicare Fee For Service'
			WHEN superpackagename LIKE '%Medicaid-%' THEN 'Medicaid Fee For Service'
			WHEN (superpackagename IS NULL AND spcl_prgm IS NULL AND insurancepackagename IS NULL) OR (insurancepackagename = '*SELF PAY*' AND spcl_prgm IS NULL) THEN 'Self Pay'
			ELSE 'Other'
			END AS account,
                row_number() OVER (PARTITION BY a.appts_patientid,a.appointment_date ORDER BY a.appointmentscheduleddatetime DESC) AS appt_day_rank
              FROM athena.summary_telenutrition_appointments as a
              LEFT JOIN fq_common_telenutrition.schedule_appointment sa on sa.appointment_id = a.appointment_id
              LEFT JOIN fq_common_telenutrition.schedule_patient_payment_method pm ON pm.payment_method_id = sa.payment_method_id
              WHERE a.appts_appointmentid = parentappointmentid 
              AND a.appointmenttypename NOT LIKE '%Demo%' 
              AND a.appointmenttypename NOT LIKE '%TEST%' 
              AND a.appointmenttypename NOT LIKE '%NutriQuiz%' 
              AND a.appointmenttypename NOT LIKE '%INTERNAL ONLY%'
            ),
        swapa AS (
		with pua AS (
		SELECT DISTINCT
			parentappointmentid,
			AR.schedulingproviderid,
			patientid,
			appointmentdate,
			appointmentcancelreason,
			date_trunc('minute', appointmentcancelleddatetime) AS cancel_datetime
		FROM athena_stage.appointment_raw AR
		WHERE 
			appointmentcancelreason IN  ('PROVIDER UNAVAILABLE','PATIENT RESCHEDULED')
			AND 
				appointmentcancelleddatetime::DATE >=  '2024-01-01' ---AND '2024-02-29'
		)
		, 
		swap as (
		SELECT DISTINCT 
			parentappointmentid,
			AR.schedulingproviderid,
			appointmentdate,
			appointmentcancelreason,
			patientid,
			date_trunc('minute', AR.appointmentscheduleddatetime) AS schedule_datetime
		FROM athena_stage.appointment_raw AR
		WHERE 
			appointmentscheduleddatetime::DATE >  '2023-11-01' --  AND '2024-02-29'
		)
		
		SELECT
			DISTINCT 
		 	pua.parentappointmentid,
			TRUE AS swapped_appt
		FROM pua 
		INNER JOIN swap ON swap.patientid = pua.patientid AND swap.schedule_datetime = pua.cancel_datetime AND swap.schedulingproviderid != pua.schedulingproviderid
		LEFT JOIN athena_stage.provider_raw pr on pr.providerid = pua.schedulingproviderid
		),
            summ_tn_appts_1 AS (
            SELECT DISTINCT appts_appointmentid AS rn_rppt_id,
                policyidnumber,
                appts_patientid,
                appointmentdate,
                DATE_TRUNC('day', appointmentscheduleddatetime) AS appt_sched_date
              FROM summ_tn_appts
              WHERE appointmentcancelreason IS NULL
            ),
            summ_tn_appts_2 AS (
              SELECT DISTINCT policyidnumber
              FROM summ_tn_appts_1
            ),
            user_data AS 
            ( 
              SELECT u.id AS fs_user_id,u.username,u.create_date,u.update_date,u.last_login_date,u.last_mobile_login_date,
                u.active,u.organization_id,u.intro_ffq_status,u.is_dependent,u.eligible_id,u.suborganization_id,u.member_id,u.member_id_2,
                policyidnumber, 
                up.is_nutriquiz_taker, up.is_nutriquiz_retaker
              FROM go_users u
              JOIN summ_tn_appts_2 ON policyidnumber=u.member_id OR policyidnumber=replace(u.member_id_2,'\r','')
              LEFT JOIN summary_users_profile as up ON up.user_id = u.id
            ),
            comp as (
				  SELECT DISTINCT
				    appts_patientid, 
				    appts_appointmentid, 
				    appointment_date 
				  FROM athena.summary_telenutrition_appointments 
				  WHERE (appointmentcancelreason IS NULL)AND appointment_date < current_date AND appts_appointmentid = parentappointmentid 
				  	AND (appointmentstatus LIKE '%2%' OR appointmentstatus LIKE '%3%' OR appointmentstatus LIKE '%4%')
				),
				     
				cn AS (
				  SELECT *, row_number() over (partition by appts_patientid order by appointment_date ASC ) AS comp_num
				  FROM comp
				),
				provider_unavailable as (
				  SELECT DISTINCT
				    appts_patientid, 
				    appts_appointmentid, 
				    appointmentdate 
				  FROM athena.summary_telenutrition_appointments 
				  WHERE (appointmentcancelreason LIKE 'PROVIDER UNAVAILABLE%')AND appointmentdate < current_date AND appts_appointmentid = parentappointmentid 
				),
				pua as(
				  SELECT *, row_number() over (partition by appts_patientid order by appointmentdate ASC ) AS provider_unavailable_number
				  FROM provider_unavailable
				),
				rescheduled_appts as (
				  SELECT DISTINCT
				    appts_patientid, 
				    appts_appointmentid, 
				    appointment_date 
				  FROM athena.summary_telenutrition_appointments 
				  WHERE appointment_date < current_date AND appts_appointmentid = parentappointmentid and 
				    appts_appointmentid in (
				      select cancelled_appt_id from analytics.reporting_telenutrition_rescheduled_appts
				    )
				),
				ra as (
				  SELECT *, row_number() over (partition by appts_patientid order by appointment_date ASC ) AS rescheduled_number
				  FROM rescheduled_appts
				),
				cancelled as (
				  SELECT DISTINCT
				      appts_patientid, 
				      appts_appointmentid, 
				      appointment_date 
				    FROM athena.summary_telenutrition_appointments 
				    WHERE appointment_date < current_date AND appts_appointmentid = parentappointmentid and 
				      appts_appointmentid not in (
				        select cancelled_appt_id from analytics.reporting_telenutrition_rescheduled_appts
				    ) and
				    NVL(appointmentcancelreason,'None') NOT IN ('SCHEDULING ERROR','PATIENT NOT COVERED BY INSURANCE') and
				    appointmentcancelreason is not null
				),
				can as (
				  SELECT *, row_number() over (partition by appts_patientid order by appointment_date ASC ) AS cancelled_number
				  FROM cancelled
				
				),
            an AS 
            (
              SELECT *,  row_number() over (partition by appts_patientid order by appointmentdate ) as appt_num
              FROM summ_tn_appts_1
            ),
            total_appts AS 
            (
              SELECT appts_patientid, MAX(appt_num) as total_appts 
              FROM an 
              GROUP BY appts_patientid
            ),
            initial_appt AS 
            (
              SELECT rn_rppt_id as initial_appt_id,appts_patientid,  an.appointmentdate AS initial_appt_date, an.appt_sched_date AS initial_schedule_date
              FROM an  
              WHERE an.appt_num = 1
            ),
            tn_nps AS (
            SELECT t.appointment_id, 
                  n."nps score" AS nps_score ,
                  CASE WHEN nps_score >=9 THEN 'Promoter'
                  WHEN nps_score IN (7,8) THEN 'Passive'
                  WHEN nps_score <= 6 THEN 'Detractor' END as nps_category
            FROM summ_tn_appts t
            LEFT JOIN c360.athena_patient p ON p.patientid = t.patientid
            INNER JOIN public.tn_nps_phreesia n ON n."visit date" = t.appointment_date AND n.emailaddr = p.email
            WHERE nps_score IS NOT NULL 
            )
            SELECT a.appts_appointmentid,a.parentappointmentid,a.appmtscheduleddatetimeast,a.appointmentcreateddatetime,a.appointmentcancelleddatetime,a.appointmentdate,a.appointmentduration,a.appts_patientid,a.paymentplanid,a.schedulingproviderid,a.appointmentstatus,a.appts_claimid,a.scheduledby,a.appointmentcancelreason,a.appts_appointmenttypeid,a.appts_providerid,
            a.appointmentscheduleddatetime,a.nochargeentryreason,a.appointmenttypeid,a.appointmenttypename,a.claimid,a.claimpatientinsurancepid,a.claimprimarypatientinsid,a.claimtype,a.claimservicedate,a.visitbillid,a.visitgroupid,a.patientemployerid,a.enterpriseid,a.providergroupid,a.patientid,a.pat_state,a.pat_sex,a.pat_age_band,a.patientinsuranceid,a.insurancepackageid,
            a.policyidnumber,a.policygroupnumber,a.patientrelationship,a.insurancepackagename,a.superpackagename,a.providerprofileid,a.providerid,a.provider_state,a.billedname,a.billingproviderid,a.plcfirstname,a.plclastname,a.providerfirstname,a.providerlastname,a.appointment_id,a.appointment_day_week,a.appointment_date,a.appointment_month,a.appointment_start_time,
            a.between_15_and_30_days_indicator,a.between_2_and_7_days_indicator,a.between_8_and_14_days_indicator,a.cancelled_reason_type,a.cancelled_timestamp,
            a.p_id_sp,a.spcl_prgm,a.p_id_fs,a.food_scrpts,a.p_id_rct,a.rct,a.units_appointmentid,a.units,a.program, a.program_start_date,n.appt_num,
             u.fs_user_id AS fs_user_id,u.username,u.create_date,u.update_date,u.last_login_date,u.last_mobile_login_date,
            u.active,u.organization_id,u.intro_ffq_status,u.is_dependent,u.eligible_id,u.suborganization_id,u.member_id,
            u.member_id_2, i.initial_appt_date, i.initial_schedule_date,t.total_appts, u.is_nutriquiz_taker, u.is_nutriquiz_retaker, a.claim_status, a.procedurecode, c.completed_appts, f.scheduled_appts, a.appt_day_rank
                , datediff('d', i.initial_appt_date, a.appointmentdate) as days_from_initial_appt
            , datediff('d', i.initial_appt_date, a.appointmentdate)/7 as weeks_from_initial_appt
            , floor(months_between(a.appointmentdate, i.initial_appt_date)) AS months_from_initial_appt
            , floor(datediff('d', i.initial_appt_date,a.appointmentdate)/365) AS years_from_initial_appt
            , tn_nps.nps_score
            , tn_nps.nps_category
            , a.account
            ,case when u.create_date <= a.appointment_date then 'enrolled in app before TN apt'
      when u.create_date > a.appointment_date then 'enrolled in app after TN apt'
      else 'unknown' end as "app_enrolled_before_after_apt"
          , NVL(LAG(cn.comp_num ignore nulls ) OVER(PARTITION BY a.appts_patientid ORDER BY a.appointment_date ASC),0) AS num_previous_completed_appointments,
    		---NVL(LAG(ns.no_show_number ignore nulls) OVER(PARTITION BY a.appts_patientid ORDER BY a.appointment_date ASC),0) AS num_previous_no_show_appointments,
    		NVL(LAG(pua.provider_unavailable_number ignore nulls) OVER(PARTITION BY a.appts_patientid ORDER BY a.appointment_date ASC),0) AS num_previous_provider_unavailable_appointments,
    		NVL(LAG(ra.rescheduled_number ignore nulls) OVER(PARTITION BY a.appts_patientid ORDER BY a.appointment_date ASC),0) AS num_previous_rescheduled_appointments,
    		NVL(LAG(can.cancelled_number ignore nulls) OVER(PARTITION BY a.appts_patientid ORDER BY a.appointment_date ASC),0) AS num_previous_cancelled_appointments,

             CASE
            WHEN account = 'Aetna Medicare' THEN 29.00
            WHEN account = 'CDPHP' AND a.appointment_date = initial_appt_date THEN 25.00
            WHEN account = 'CDPHP' AND a.appointment_date != initial_appt_date THEN 20.00
            WHEN account LIKE 'CCHP%' AND a.appointment_date = initial_appt_date THEN 36.12
            WHEN account LIKE 'CCHP%' AND a.appointment_date != initial_appt_date THEN 31.03
            WHEN account LIKE 'Molina' AND a.appointment_date = initial_appt_date THEN 36.56
            WHEN account LIKE 'Molina' AND a.appointment_date != initial_appt_date THEN 31.44
            WHEN account IN ('CIGNA Corporation','Cigna National','FedEx','Metropolitan Nashville Public Schools','Smith & Nephew','Phoenix Children''s Hospital','Suez WTS','SEI','EPAM Systems','Arizona Public Schools (APS)','City of Clearwater') THEN 31.25
            WHEN account = 'Independent Health' AND procedurecode LIKE '97802%'  THEN 24.65
            WHEN account = 'Independent Health' AND procedurecode LIKE '97803%'  THEN 21.26
            WHEN account LIKE 'Martin''s Point%'  THEN 29.27
            WHEN account = 'PacificSource' THEN 32.44
            WHEN account = 'BioMerieux' THEN 37.50
            WHEN account = 'Healthfirst' THEN 40.00
            WHEN account = 'ArcBest' THEN 37.50
	    WHEN account = 'Elevance' THEN 39.85
	    WHEN account = 'Mass General Brigham' THEN 39.88
            WHEN account LIKE '%Umpqua%' THEN 47.29
            WHEN account LIKE '%Northwestern%' THEN 37.50
            WHEN account LIKE '%BCBS%' THEN 40.00
            WHEN account = 'Cook County Health' THEN 40.00
            WHEN account = 'Health Services for Children with Special Needs' THEN 40.00
	    WHEN account = 'Banner Health' THEN 39.76
     	    WHEN account = 'UHC DSNP' THEN 31.25
            WHEN account = 'Quartz'  AND procedurecode NOT IN ('S5170','S9977') THEN 40.00
	    WHEN account = 'Quartz'  AND procedurecode  = 'S5170' THEN 10.16
     	    WHEN account = 'Quartz'  AND procedurecode  = 'S9977' THEN 51.98
            WHEN account LIKE '%Fee For Service%' THEN 30.00
            WHEN account = 'Self Pay' THEN 40.00
            WHEN account = 'United States House of Representatives' THEN 40.00
	    WHEN account = 'UHC National' THEN 28.00
     	    WHEN account = 'Aetna National' THEN 29.00
            WHEN account = 'Other'   THEN 31.25
              ELSE 0 END AS contracted_rate,
            NVL(swapa.swapped_appt,FALSE) AS swapped_appt
            FROM summ_tn_appts AS a
            LEFT JOIN an AS n ON a.appts_appointmentid = n.rn_rppt_id
            LEFT JOIN initial_appt AS i ON i.appts_patientid = a.appts_patientid
            LEFT JOIN total_appts AS t ON t.appts_patientid = a.appts_patientid
            LEFT JOIN user_data as u ON a.policyidnumber=u.policyidnumber
            LEFT JOIN c360.completed_appts c ON c.appts_patientid = a.appts_patientid
            LEFT JOIN c360.future_appts f ON f.appts_patientid = a.appts_patientid
            LEFT JOIN tn_nps ON tn_nps.appointment_id = a.appts_appointmentid
            LEFT JOIN cn ON cn.appts_appointmentid = a.appts_appointmentid
            LEFT JOIN pua ON pua.appts_appointmentid = a.appts_appointmentid
  			LEFT JOIN ra ON ra.appts_appointmentid = a.appts_appointmentid
  			LEFT JOIN can ON can.appts_appointmentid = a.appts_appointmentid
  			LEFT JOIN swapa ON swapa.parentappointmentid = a.appts_appointmentid
 			----LEFT JOIN c360.no_show_num as "ns" ON ns.appts_appointmentid = a.appts_appointmentid
            ;
	  COMMIT TRANSACTION;   
        `,
	next: 'RescheduledAppointments',
      }),
	RescheduledAppointments: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS analytics.rescheduled_appointments;
          CREATE TABLE analytics.rescheduled_appointments AS 
              WITH c AS (
      SELECT DISTINCT appts_appointmentid, appts_patientid, appointmentcancelleddatetime
      FROM athena.summary_telenutrition_appointments
      WHERE appointmentcancelleddatetime IS NOT NULL AND appts_appointmentid = parentappointmentid
      ),
      s AS (
      SELECT DISTINCT appts_appointmentid, appts_patientid, appointmentscheduleddatetime
      FROM athena.summary_telenutrition_appointments
      WHERE appointmentcancelleddatetime IS NULL AND appts_appointmentid = parentappointmentid
      ),
      r AS (SELECT
        c.appts_appointmentid AS cancelled_appt_id,
        c.appts_patientid,
        appointmentcancelleddatetime,
        s.appts_appointmentid AS reschedule_appt_id,
        s.appointmentscheduleddatetime AS reschedule_datetime,
        DATEDIFF(day, c.appointmentcancelleddatetime, s.appointmentscheduleddatetime) AS days_to_reschedule,
        row_number() over (partition by c.appts_patientid order by s.appointmentscheduleddatetime ASC ) AS resched_num
      FROM
        c
      JOIN s ON s.appts_patientid = c.appts_patientid
      WHERE DATEDIFF(day, c.appointmentcancelleddatetime, s.appointmentscheduleddatetime) BETWEEN 0 AND 31)

      SELECT * FROM r WHERE resched_num = 1
          ;
          COMMIT TRANSACTION;
	 `,
	next: 'ClaimsFinancials',
     }), 
	ClaimsFinancials: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS analytics.claims_financials;
          CREATE TABLE analytics.claims_financials AS 
          WITH CNM AS (
		SELECT claimid, MAX(claimnoteid) AS claimnoteid
		FROM athena_stage.claimnote_raw
		GROUP BY 1 ),
		
		CNO AS (
		SELECT CN.claimid,CN.action,  KR.description , CN.paymentamount, CN.outstanding, CN.note
		FROM athena_stage.claimnote_raw CN 
		LEFT JOIN athena_stage.kickreason_raw KR ON KR.kickreasonid = CN.kickreasonid
		WHERE EXISTS (SELECT 1 FROM CNM WHERE CNM.claimnoteid = CN.claimnoteid)
		),
		
		CAND AS (
			SELECT
				SPLIT_PART(JSON_EXTRACT_PATH_TEXT(meta,'external_id'),':',2) AS athena_encounter_id,
				JSON_EXTRACT_PATH_TEXT(meta,
						'subscriber_primary_insurance_card_payer_name') AS candid_payer_name,
				JSON_EXTRACT_PATH_TEXT(meta,
						'newEncounter',
						'claims',
						0,
						'status'
						) AS claim_status,
				DECODE(JSON_EXTRACT_PATH_TEXT(JSON_EXTRACT_PATH_TEXT(meta,
						'newEncounter',
						'claims',
						0,
						'serviceLines',
						0,
						TRUE),
					'paidAmountCents'), '', NULL,JSON_EXTRACT_PATH_TEXT(JSON_EXTRACT_PATH_TEXT(meta,
						'newEncounter',
						'claims',
						0,
						'serviceLines',
						0,
						TRUE),
					'paidAmountCents') )::INT AS paid_amount_cents 
					
				
			FROM
				fq_common_telenutrition.billing_transaction
			WHERE SPLIT_PART(JSON_EXTRACT_PATH_TEXT(meta,'external_id'),':',1) = 'athena'
		)
		,FAF AS (
		SELECT 
			claimid,
			"type",
			transactionreasonid,
			procedurecode,
		 	printprocedurecode,
		 	SUM(amount) AS paid_amount
		FROM athena_stage.financials_activityfact_raw 
		WHERE "type" = 'PAYMENT'
		GROUP BY 1,2,3,4,5
		)
		SELECT DISTINCT
			TA.appts_claimid,
			TA.appointment_id,
			TA.account,
			TA.insurancepackagename,
			TA.superpackagename,
			TA.spcl_prgm,
			TA.appointment_date,
			TA.policyidnumber AS member_id,
			TA.policygroupnumber,
			TA.patientid,
			PAT.firstname AS patient_first_name,
			PAT.lastname AS patient_last_name,
			PAT.dob AS patient_dob,
			TA.appointment_date AS date_of_service,
			TA.providerid,
			TA.providerfirstname,
			TA.providerlastname,
			DATE_TRUNC('month',TA.appointment_date) AS appointment_month,
			DATE_TRUNC('day', TA.appointmentscheduleddatetime) AS schedule_date,
			DATE_TRUNC('month', TA.appointmentscheduleddatetime) AS schedule_month,
			CASE WHEN TA.cancelled_timestamp IS NOT NULL THEN TRUE ELSE FALSE END AS is_appt_cancelled,
			TA.nochargeentryreason,
			FAF."type" AS transaction_type,
			FAF.transactionreasonid,
			NVL(FAF.paid_amount,0) AS  athena_paid_amount,
			FAF.procedurecode,
		 	FAF.printprocedurecode,
			CASE WHEN TA.account = 'Elevance' THEN 39.85 ELSE  TA.contracted_rate END as contracted_rate,
			TA.units,
			TA.procedurecode AS appointment_procode, 
			CNO.action,
			CNO.description,
			CNO.note,
			FAM.qb_account,
			FAM.master_account,
			CAND.paid_amount_cents / 100.00 AS candid_paid_amount,
			NVL(FAF.paid_amount,0)+ NVL(CAND.paid_amount_cents/ 100.00, 0)*-1 AS real_paid_amount,
			CAND.claim_status AS candid_status,
			CAND.candid_payer_name,
			contracted_rate * units AS expected_payment,
			(contracted_rate * units) + real_paid_amount AS outstanding_amount,
				CASE WHEN (TA.account = 'Cigna National' AND TA.appt_num >3 AND NVL(FAF.paid_amount,0) >=0) THEN 1 
			ELSE 0 END AS exclusion_flag
		FROM analytics.telenutrition_analytics TA 
		LEFT JOIN CNO ON CNO.claimid = TA.claimid
		LEFT JOIN  FAF ON FAF.claimid = TA.claimid AND (FAF.printprocedurecode  = TA.procedurecode OR FAF.procedurecode = TA.procedurecode)
		LEFT JOIN "public".finance_account_mapping FAM on FAM.tn_account = TA.account
		LEFT JOIN c360.athena_patient PAT ON PAT.patientid::NUMERIC = TA.patientid::NUMERIC
		LEFT JOIN athena_stage.clinicalencounter_raw CE ON CE.appointmentid = TA.appointment_id
		LEFT JOIN CAND ON CAND.athena_encounter_id = CE.clinicalencounterid 
		WHERE TA.appointmentstatus IN ('2 - Checked In','4 - Charge Entered','3 - Checked Out')
		 	AND account NOT IN ('Salesforce')
		 	AND NVL(TA.procedurecode,'None') NOT IN ('S5170','S9977')
			AND appointment_id NOT IN  (0,646628) 
		 	AND appts_claimid != 0 
			AND NVL(units,0) > 0  
			AND TA.cancelled_timestamp IS NULL 
			AND NVL(nochargeentryreason,'NONE') != 'LATE CANCEL/NO SHOW'
		
		ORDER BY appts_claimid ASC
          ;
          COMMIT TRANSACTION;
	 `,
     }),     
    }
  }
})
