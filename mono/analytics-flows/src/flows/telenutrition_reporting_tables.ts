import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '5 14 * * ? *',
    startAt: 'ReportingTNAnalytics',
    states: {
      ReportingTNAnalytics: Redshift.query({
        sql: `

          DROP TABLE IF EXISTS analytics.reporting_telenutrition_analytics;

          CREATE TABLE analytics.reporting_telenutrition_analytics
          AS
          SELECT 
            appts_appointmentid ,
            parentappointmentid ,
            appointmentduration ,
            appts_patientid ,
            paymentplanid ,
            schedulingproviderid  ,
            appointmentstatus ,
            nochargeentryreason ,
            appts_claimid ,
            scheduledby ,
            appointmentcancelreason ,
            appt_num  ,
            appts_appointmenttypeid ,
            appts_providerid  ,
            appointmenttypeid ,
            appointmenttypename ,
            claimpatientinsurancepid  ,
            claimprimarypatientinsid  ,
            claimtype ,
            visitbillid ,
            claim_status  ,
            program ,
            visitgroupid  ,
            units ,
            patientemployerid ,
            enterpriseid  ,
            providergroupid ,
            patientid ,
            pat_state ,
            patientinsuranceid,
            insurancepackageid,
            policyidnumber,
            policygroupnumber ,
            patientrelationship ,
            insurancepackagename  ,
            superpackagename  ,
            fs_user_id,
            organization_id ,
            suborganization_id,
            member_id ,
            member_id_2 ,
            total_appts ,
            days_from_initial_appt,
            weeks_from_initial_appt ,
            months_from_initial_appt  ,
            years_from_initial_appt ,
            providerprofileid ,
            providerid,
            provider_state,
            pat_sex ,
            pat_age_band  ,
            billingproviderid ,
            plcfirstname  ,
            plclastname ,
            providerfirstname ,
            providerlastname  ,
            appointment_id,
            appointment_day_week  ,
            between_15_and_30_days_indicator  ,
            between_2_and_7_days_indicator,
            between_8_and_14_days_indicator ,
            cancelled_reason_type ,
            cancelled_timestamp ,
            spcl_prgm ,
            food_scrpts ,
            rct ,
            procedurecode,
          CASE WHEN scheduledby = 'API-1645' THEN 'Scheduling Flow'
              WHEN scheduledby = 'API-27' THEN 'Phreesia'
              WHEN scheduledby NOT LIKE 'API%' THEN 'Provider or EC'
          END AS schedule_system,
          CASE WHEN appointmenttypename LIKE '%Audio%' 
              THEN 'yes' 
              ELSE 'no' 
          END AS audio_only_visit,
          DATEDIFF('d',(DATE(appointmentscheduleddatetime )),(DATE(appointmentdate )) ) AS days_from_schedule_to_appt,
           -- dimension: days_from_schedule_to_appt_tier
          CASE 
              WHEN total_appts >0 
              THEN 'yes' 
              ELSE 'no' 
          END AS has_noncancelled_appt,
          CASE WHEN appt_num = 1 
              THEN 'Initial' 
              ELSE 'Follow-Up' 
          END AS claim_initial_vs_flup,
          CASE 
              WHEN appts_claimid >0 
              THEN 'yes' 
              ELSE 'no' 
          END as appointment_has_claim,
          patientid||appts_appointmentid||DECODE(policygroupnumber,NULL,'',policygroupnumber)||policyidnumber||appointmentdate AS pk,
          CASE
                WHEN superpackagename LIKE '%CDPHP%' THEN 'CDPHP'
                WHEN superpackagename IS NULL AND spcl_prgm IS NULL THEN 'Self Pay'
                WHEN (superpackagename LIKE '%Aetna%' AND insurancepackagename LIKE '%MEDICARE%') OR (superpackagename LIKE '%Aetna%' AND policygroupnumber LIKE '000003-%') THEN 'Aetna Medicare'
                WHEN ((superpackagename LIKE '%Chorus Community Health Plan%') OR  (superpackagename LIKE '%Together Health%' ))  AND policyidnumber LIKE '22%' THEN 'CCHP - Exchange'
                WHEN superpackagename LIKE '%Chorus Community Health Plan (Medicaid%'  THEN 'CCHP - Medicaid'
                WHEN superpackagename LIKE '%Dean Health Plan%' AND ((superpackagename NOT LIKE '%Chorus Community Health Plan%') AND (superpackagename NOT LIKE '%Together Health%')) THEN  'Dean Health Plan'
                WHEN superpackagename LIKE '%Harvard Pilgrim%' THEN 'Harvard Pilgrim'
                WHEN superpackagename LIKE '%Healthfirst%' THEN 'Healthfirst'
                WHEN superpackagename LIKE '%Independent Health%' THEN 'Independent Health'
                WHEN superpackagename LIKE '%Martin''s Point Health Care (Medicare%'  THEN 'Martin''s Point GA'
                WHEN superpackagename LIKE '%Martin''s Point Health Care - US Family Health Plan (HMO)' THEN 'Martin''s Point Employees'
                WHEN superpackagename LIKE '%PacificSource%' THEN 'PacificSource'
                WHEN superpackagename LIKE '%United Health Care%' THEN 'United Health Care'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3174704' THEN 'CIGNA Corporation'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber IN ('2501092','2501095','2501097','2501099','2501101','2501103','3333236','2501066','2501068','2501070','2501072','2501074','2501076','2501079','2501081','2499248','2499250','2499252') THEN 'FedEx'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber IN ('3333770','2498659') THEN 'MNPS'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3337975' THEN 'Smith & Nephew'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341974' THEN 'Phoenix Children''s Hospital'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341975' THEN 'Suez WTS'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3209340' THEN 'SEI'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341995' THEN 'EPAM Systems'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '3341058' THEN 'Arizona Public Schools (APS)'
                WHEN superpackagename LIKE '%Cigna%' AND policygroupnumber = '2499162' THEN 'City of Clearwater'
                WHEN (superpackagename LIKE '%Umpqua%')  THEN 'Umpqua Medicaid'
                WHEN superpackagename LIKE '%Providence Health Plan%' THEN 'Umpqua Employees'
                WHEN insurancepackagename LIKE '%CHOICE BENEFITS%' THEN 'ArcBest'
                WHEN (spcl_prgm = 'BioM')  OR (superpackagename LIKE '%UMR%' )THEN 'BioMerieux'
                WHEN spcl_prgm = 'Northwestern Mutual' THEN 'Northwestern Mutual'
                WHEN spcl_prgm LIKE '%Salesforce%' OR (superpackagename LIKE '%Aetna%' AND policygroupnumber IN ('28573104000001','88352802000001','88352802300101','88352801700001','88352801900001','88352802300001','88352801800002','86881601100001','71998202300120','10799401000006','66037701100006','10919001100100','80021502300001','87058802000019','28573105500001','86523701500105','81127405000008')) OR (superpackagename LIKE '%United Healthcare%' AND policygroupnumber= '911585') THEN 'Salesforce'
                WHEN spcl_prgm LIKE '%Maricopa County%' THEN 'Maricopa County'
                WHEN spcl_prgm LIKE '%Advocate Aurora Health (AAH)%' THEN 'AAH'
                WHEN spcl_prgm LIKE '%United States House of Representatives%' THEN 'United States House of Representatives'
                WHEN spcl_prgm = 'Quartz' OR superpackagename LIKE '%Quartz%' THEN 'Quartz'
                WHEN insurancepackagename LIKE '%MOLINA%' THEN 'Molina'
                WHEN superpackagename LIKE '%BCBS-TX%' THEN 'BCBS-TX'
                WHEN superpackagename LIKE '%BCBS-IL%' THEN 'BCBS-IL'
                WHEN superpackagename LIKE '%Medicare-%' THEN 'Medicare Fee For Service'
                WHEN superpackagename LIKE '%Medicaid-%' THEN 'Medicaid Fee For Service'
                ELSE 'Other'
          END AS account,
          CASE
                WHEN superpackagename LIKE '%CDPHP%' THEN 'CDPHP'
                WHEN superpackagename IS NULL AND spcl_prgm IS NULL THEN 'Self Pay'
                WHEN superpackagename LIKE '%Aetna%'  THEN 'Aetna'
                WHEN superpackagename LIKE '%Chorus Community Health Plan%'  THEN 'CCHP'
                WHEN superpackagename LIKE '%Dean Health Plan%' AND superpackagename NOT LIKE '%Chorus Community Health Plan%' THEN  'Dean Health Plan'
                WHEN superpackagename LIKE '%Harvard Pilgrim%' THEN 'Harvard Pilgrim'
                WHEN superpackagename LIKE '%Healthfirst%' THEN 'Healthfirst'
                WHEN superpackagename LIKE '%Independent Health%' THEN 'Independent Health'
                WHEN superpackagename LIKE '%Martin''s Point Health Care (Medicare%' THEN 'Martin''s Point'
                WHEN superpackagename LIKE '%Martin''s Point Health Care - US Family Health Plan (HMO)' THEN 'Martin''s Point'
                WHEN superpackagename LIKE '%PacificSource%' THEN 'PacificSource'
                WHEN insurancepackagename LIKE '%CHOICE BENEFITS%' THEN 'ArcBest'
                WHEN spcl_prgm LIKE '%United States House of Representatives%' THEN 'United States House of Representatives'
                WHEN superpackagename LIKE '%Cigna%'  THEN 'Cigna'
                WHEN superpackagename LIKE '%Umpqua%' THEN 'Umpqua'
                WHEN superpackagename LIKE '%UMR%' THEN 'UMR'
                WHEN spcl_prgm = 'BioM' THEN 'BioMerieux'
                WHEN spcl_prgm = 'Northwestern Mutual' THEN 'Northwestern Mutual'
                WHEN spcl_prgm LIKE '%Salesforce%' THEN 'Salesforce'
                WHEN spcl_prgm LIKE '%Advocate Aurora Health (AAH)%' THEN 'AAH'
                WHEN insurancepackagename LIKE '%MOLINA%' THEN 'Molina'
                ELSE 'Other'
           END AS payor,
           CASE
                  WHEN account = 'Aetna Medicare' THEN 29.00
                  WHEN account = 'CDPHP' AND claim_initial_vs_flup = 'Initial' THEN 25.00
                  WHEN account = 'CDPHP' AND claim_initial_vs_flup = 'Follow-Up' THEN 20.00
                  WHEN account LIKE 'CCHP%' AND claim_initial_vs_flup = 'Initial' THEN 36.12
                  WHEN account LIKE 'CCHP%' AND claim_initial_vs_flup = 'Follow-Up' THEN 31.03
                  WHEN account LIKE 'Molina' AND claim_initial_vs_flup = 'Initial' THEN 36.56
                  WHEN account LIKE 'Molina' AND claim_initial_vs_flup = 'Follow-Up' THEN 31.44
                  WHEN account IN ('CIGNA Corporation','FedEx','MNPS','Smith & Nephew','Phoenix Children''s Hospital','Suez WTS','SEI','EPAM Systems','Arizona Public Schools (APS)','City of Clearwater') THEN 31.25
                  WHEN account = 'Independent Health' AND claim_initial_vs_flup = 'Initial' THEN 28.25
                  WHEN account = 'Independent Health' AND claim_initial_vs_flup = 'Follow-Up' THEN 24.00
                  WHEN account LIKE 'Martin''s Point%'  THEN 29.27
                  WHEN account = 'PacificSource' THEN 32.44
                  WHEN account = 'BioMerieux' THEN 37.50
                  WHEN account = 'Healthfirst' THEN 40.00
                  WHEN account = 'ArcBest' THEN 37.50
                  WHEN account LIKE '%Umpqua%' THEN 47.29
                  WHEN account LIKE '%Northwestern%' THEN 37.50
                  WHEN account LIKE '%BCBS%' THEN 40.00
                  WHEN account LIKE '%Fee For Service%' THEN 30.00
                  WHEN account = 'Self Pay' THEN 40.0
                  WHEN account = 'United States House of Representatives' THEN 40.0
                  WHEN account = 'Other'  AND  claim_initial_vs_flup = 'Initial' THEN 31.25
                  WHEN account = 'Other'  AND  claim_initial_vs_flup != 'Initial' THEN 25.00
                  ELSE 0
          END AS contracted_rate_per_unit,
          CASE 
              WHEN appointmenttypename LIKE '%60%' THEN 60
              WHEN appointmenttypename LIKE '%30%' THEN 30
              WHEN appointmenttypename LIKE '%45%' THEN 45
              WHEN appointmenttypename LIKE '%15%' THEN 15
              ELSE 0 
          END AS appointment_length_minutes,
          CAST(program_start_date AS DATE) AS program_start_date,
          create_date ,
          last_login_date ,
          appointmentscheduleddatetime ,
          appointmentcreateddatetime ,
          appointmentcancelleddatetime ,
          appointmentdate ,
          appointment_start_time ,
          claimservicedate AS claimservicedate,
          CASE WHEN DATE(appointmentdate) < DATE(CURRENT_DATE) 
              THEN 'yes' 
              ELSE 'no' 
          END appointment_date_passed,
          CASE WHEN appointmenttypename IN ('Initial Appointment - 60','Foodscripts Initial - 60','Audio Only Visit - 60','Audio Only Visit - 60','NON Billed DeanFx - 60','NON Billed TXMed - 60','Shop-Along - 60','Group Visit - 60','On-Site Visit - 60','NON Billed KP/Tufts - 60','Initial Appointment - 30','Self Pay / Subscription Service - 60','Curriculum - 60')
                 THEN 'Initial'
                 ELSE 'Follow-Up'
                 END AS initial_vs_follow_up,
          CASE WHEN appt_num = 1
              THEN 'Initial'
              ELSE 'Follow-Up'
              END AS non_cancelled_initial_v_follow_up

          FROM analytics.telenutrition_analytics;
          
        `,
        next: 'ReportingTNUsers',
      }),
      ReportingTNUsers: Redshift.query({
        sql: `
          
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_users;

          CREATE TABLE analytics.reporting_telenutrition_users
          AS
          WITH summ_data AS
          (
          SELECT fs_user_id, member_id,True AS tn_user,appointmentdate,policyidnumber,appt_num,
            FIRST_VALUE(appointmentdate) OVER(PARTITION BY policyidnumber ORDER BY appointmentdate ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_appointment_date,
            LAST_VALUE(appointmentdate) OVER(PARTITION BY policyidnumber ORDER BY appointmentdate ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_appointment_date,
            count(*) OVER(PARTITION BY policyidnumber) as total_appointments
          FROM analytics.telenutrition_analytics 
          WHERE appointmentstatus!='x - Cancelled'
          GROUP BY 1,2,3,4,5,6
          )
          SELECT fs_user_id,member_id,tn_user,first_appointment_date,last_appointment_date,total_appointments 
          FROM summ_data 
          WHERE total_appointments=appt_num;
        `,
        next: 'ReportingTNSnapEnrollment',
      }),
      ReportingTNSnapEnrollment: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_snap_enrollment;

          CREATE TABLE analytics.reporting_telenutrition_snap_enrollment
          AS
          SELECT patient_id AS "SNAP Patient ID",
            enrollment_type,
            enrollment_event AS "Enrollment Status",
            row_number() over (partition by patient_id order by event_datetime ASC ) AS snap_status_number,
            event_datetime
          FROM patient_snap_enrollment_details;
        `,
        next: 'ReportingTNWicEnrollment',
      }),
      ReportingTNWicEnrollment: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_wic_enrollment;

          CREATE TABLE analytics.reporting_telenutrition_wic_enrollment
          AS
          SELECT patient_id AS "WIC Patient ID",
            enrollment_type,
            enrollment_event,
            event_datetime
          FROM athena.patient_wic_enrollment_details;
        `,
        next: 'ReportingTNRescheduledAppts',
      }),
      ReportingTNRescheduledAppts: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.telenutrition_rescheduled_appts;

          CREATE TABLE analytics.telenutrition_rescheduled_appts
          AS
          WITH summ_appts AS (
              SELECT DISTINCT appts_appointmentid, appts_patientid, appointmentcancelleddatetime, appointmentscheduleddatetime
                  FROM athena.summary_telenutrition_appointments
                  WHERE appts_appointmentid = parentappointmentid 
          ),
          c AS 
          (
                SELECT *
                FROM summ_appts
                WHERE appointmentcancelleddatetime IS NOT NULL 
          ),
          s AS 
          (
                SELECT *
                FROM summ_appts
                WHERE appointmentcancelleddatetime IS NULL 

          ),
          r AS 
          (
                SELECT c.appts_appointmentid AS cancelled_appt_id,
              c.appts_patientid,
              c.appointmentcancelleddatetime,
              s.appts_appointmentid AS reschedule_appt_id,
              s.appointmentscheduleddatetime AS reschedule_datetime,
              DATEDIFF(day, c.appointmentcancelleddatetime, s.appointmentscheduleddatetime) AS days_to_reschedule,
              row_number() over (partition by c.appts_patientid order by s.appointmentscheduleddatetime ASC ) AS resched_num
                FROM c
                JOIN s ON s.appts_patientid = c.appts_patientid
                WHERE DATEDIFF(day, c.appointmentcancelleddatetime, s.appointmentscheduleddatetime) BETWEEN 0 AND 31
          )
          SELECT * FROM r WHERE resched_num = 1;

          DROP TABLE IF EXISTS analytics.reporting_telenutrition_rescheduled_appts;
          
          CREATE TABLE analytics.reporting_telenutrition_rescheduled_appts
          AS
          SELECT cancelled_appt_id,
            reschedule_appt_id,
            reschedule_datetime,
            days_to_reschedule,
            CASE WHEN reschedule_appt_id IS NOT NULL 
              THEN 'yes' 
              ELSE 'no' 
            END AS was_appt_rescheduled
          FROM analytics.telenutrition_rescheduled_appts;
        `,
        next: 'ReportingTNPayments',
      }),
      ReportingTNPayments: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_payments;

          CREATE TABLE analytics.reporting_telenutrition_payments
          AS
          SELECT DISTINCT claimid, amount
           FROM athena.financials_activityfact
           WHERE type = 'PAYMENT';
        `,
        next: 'ReportingTNSlot',
      }),
      ReportingTNSlot: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_slot;

          CREATE TABLE analytics.reporting_telenutrition_slot
          AS 
          WITH tn_slot AS 
          (
            SELECT appointment_id, slot_status_type, template_provider_id,template_provider_name
            FROM athena.scheduling_slot_historical 
            UNION ALL
            SELECT appointment_id, slot_status_type, template_provider_id,template_provider_name
            FROM athena.scheduling_slot_future
            WHERE _extract_date_ = (SELECT MAX(_extract_date_) FROM athena.scheduling_slot_future)
          )
          SELECT 
            appointment_id, 
            slot_status_type, 
            template_provider_id AS "Slot Provider ID",
            template_provider_name AS "Slot Provider Name"
          FROM tn_slot;
        `,
        next: 'ReportingTNScheduling',
     }),
      ReportingTNScheduling: Redshift.query({
        sql: `
          DROP TABLE IF EXISTS analytics.reporting_telenutrition_scheduling;

          CREATE TABLE analytics.reporting_telenutrition_scheduling
          AS
          SELECT id,
            timestamp as event_datetime,
            tn_app_user_id,
            tn_app_federated_id,
            session_id,
            platform,
            device,
            cid,
            event_type,
            event_name,
            params,
            medium,
            source,
            campaign,
            campaign_id,
            term,
            content,
            appointment_id,
            patient_id,
            member_id,
            employer_id,
            group_id,
            employer_name,
            insurance_name,
            promo,
            duration,
            pat_state AS "State Selected",
            flow_id,
            flow_name,
            icd_10_codes,
            referrer_org_id,
            CASE WHEN tn_app_federated_id LIKE '%qcs%' 
                 THEN 'Yes' 
                 ELSE 'No' 
            END AS set_by_qcs,
            CASE
                  WHEN insurance_name LIKE '%CDPHP%' THEN 'CDPHP'
                  WHEN insurance_name LIKE '%SELF-PAY%' THEN 'Self Pay'
                  WHEN insurance_name LIKE '%Aetna%'  THEN 'Aetna Medicare'
                  WHEN insurance_name LIKE '%Together Health%'   THEN 'CCHP - Exchange'
                  WHEN insurance_name LIKE '%BadgerCare Plus%'  THEN 'CCHP - Medicaid'
                  WHEN insurance_name LIKE '%Dean Health Plan%'  THEN  'Dean Health Plan'
                  WHEN insurance_name LIKE '%Harvard Pilgrim%' THEN 'Harvard Pilgrim'
                  WHEN insurance_name LIKE '%Healthfirst%' THEN 'Healthfirst'
                  WHEN insurance_name LIKE '%Independent Health%' THEN 'Independent Health'
                  WHEN insurance_name LIKE '%Martin''s Point Health Care (Medicare%' THEN 'Martin''s Point GA'
                  WHEN insurance_name LIKE '%Martin''s Point Health Care - US Family Health Plan (HMO)' THEN 'Martin''s Point Employees'
                  WHEN insurance_name LIKE '%PacificSource%' THEN 'PacificSource'
                  WHEN insurance_name LIKE '%United Health Care%' THEN 'United Health Care'
                  WHEN insurance_name LIKE '%Cigna%'  THEN 'CIGNA Pilots'
                  WHEN insurance_name LIKE '%Umpqua%' THEN 'Umpqua'
                  WHEN insurance_name LIKE '%Blue Cross Blue Shield of Texas%' THEN 'BCBS-TX'
                  WHEN insurance_name LIKE '%Blue Cross Blue Shield of Illinois%' THEN 'BCBS-IL'
                  WHEN employer_name LIKE '%ArcBest%' THEN 'ArcBest'
                  WHEN employer_name LIKE '%Northwestern Mutual%' THEN 'Northwestern Mutual'
                  WHEN employer_name LIKE '%Salesforce%' THEN 'Salesforce'
                  WHEN employer_name LIKE '%Advocate Aurora Health%' THEN 'AAH'
                  WHEN employer_name LIKE '%House of Representatives%' THEN 'United States House of Representatives'
                  WHEN employer_name LIKE '%Umpqua Health Employees%' THEN 'Umpqua Employees'
                  WHEN insurance_name LIKE '%Molina%' THEN 'Molina'
                  ELSE 'Other'
            END AS account
          FROM analytics.scheduling_flow_events;
        `,
     }), 
    }
  }
})
