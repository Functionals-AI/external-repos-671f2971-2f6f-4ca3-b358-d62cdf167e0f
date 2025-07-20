import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = 'analytics.warehouse.deploy.completed'

export default workflow(function(config) {
  return {
  	rate: '24 hours', 
    event: {
      bus: EVENT_BUS,
      source: [ 'foodsmart' ],
      detailType: [
        EVENT_TYPE
      ]
    },
    startAt: 'FactSnap',
    states: {
      FactSnap: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_snap;
            CREATE TABLE analytics.fact_member_snap AS
            --Athena SNAP responses
with athena_snap as 
(
select
lastupdated :: date as measure_date
,patientid as patient_id
,customfieldvalue as snap_status
,null as encounter_id
    
FROM athena_stage.customdemographics_raw CDR 
WHERE CDR.customfieldname = 'SNAP Enrollment' 
)
--FFD SNAP responses
,ffd_snap AS 
(
SELECT -- Get only records with SNAP status
  *
FROM ( -- Generate only one field for SNAP status
  SELECT
    patient_id
    ,measure_date
    ,CASE
      WHEN snap_ebt_assistance_interest IS NOT NULL THEN snap_ebt_assistance_interest
      ELSE (
        CASE 
          WHEN snap_application LIKE '%wallet_wellness_snap_approved%' THEN 'SNAP Application Approved'
          WHEN snap_application LIKE '%wallet_wellness_snap_declined%' THEN 'SNAP Application Denied'
          WHEN snap_application LIKE '%wallet_wellness_snap_reenroll%' THEN 'Reapplied for SNAP, Application Pending' 
          WHEN snap_application LIKE '%wallet_wellness_snap%' THEN 'SNAP Application Pending' 
          ELSE NULL
        END
      )
    END AS snap_status
    ,encounter_id
  FROM ( -- Get Clinical Encounter and Appointment data including SNAP data
    SELECT
      DA.start_timestamp :: date AS measure_date
      ,CE.patient_id
      ,CE.encounter_id
      ,NULLIF(json_extract_path_text(CE.raw_data, 'snap_ebt_assistance_interest'), '')::VARCHAR AS snap_ebt_assistance_interest
      ,NULLIF(json_extract_path_text(CE.raw_data, 'interventions'), '')::varchar AS snap_application
    FROM fq_common_telenutrition.clinical_encounter CE
    INNER JOIN analytics.dim_appointment DA
      ON CE.appointment_id = DA.appointment_id
    WHERE DA.status_normalized = 'completed'
  )
  --WHERE (snap_status IS NOT NULL OR snap_application LIKE '%wallet_wellness_snap%')
)
WHERE snap_status IS NOT NULL
),

--------------------------
-- SNAP STATUS FACT TABLE
--------------------------
snap_fact_table AS (
  -- Main Query: Returns all SNAP statuses of each patient
  SELECT
    measure_date
    ,patient_id
    ,CASE
      WHEN snap_status IN ('SNAP Application Denied', 'applied_denied') THEN 'SNAP Application Denied'
      WHEN snap_status IN ('applied_pending', 'SNAP Application Pending') THEN 'SNAP Application Pending'
      WHEN snap_status IN ('already_have_ebt_card', 'Already Enrolled in SNAP Benefits') THEN 'Already Enrolled In SNAP / EBT'
      WHEN snap_status = 'not_interested_snap_ebt' THEN 'Not Interested In SNAP / EBT'
      WHEN snap_status = 'interested_applying_snap_ebt' THEN 'Interested In Applying To SNAP / EBT'
      ELSE snap_status
    END AS snap_status
    ,encounter_id
    --ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY status_date DESC) AS snap_status_row_number
  FROM (
    
    -- Get Athena SNAP Status
    SELECT
    measure_date
    ,patient_id
    ,snap_status
    ,encounter_id
    FROM athena_snap
    
    UNION ALL 
    
    -- Get FFD SNAP Status
    SELECT
    measure_date
    ,patient_id
    ,snap_status
    ,encounter_id
    FROM ffd_snap
    
  ) 
)


select 
* 
from snap_fact_table
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
