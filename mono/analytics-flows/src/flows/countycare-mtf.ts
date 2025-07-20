import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
  	rate: '24 hours', 
    startAt: 'CountyCare_MTF',
    states: {
      CountyCare_MTF: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.countycare_mtf;
            CREATE TABLE analytics.countycare_mtf AS
            -------------
-- CCH MTF
-------------

-- GET ALL MEAL PREPARATION REASONS
WITH RECURSIVE CTE_recurring_meal_preparation_reason (encounter_id, part, rest) AS (
  -- Loop over all meal preparation reasons to show them in a single cell
  
  -- Get first reason in Clinical Encounter Raw Data
  SELECT
    encounter_id,
    SUBSTRING(meal_preparation_reason_json, POSITION('"' IN meal_preparation_reason_json) + 1, POSITION('":' IN meal_preparation_reason_json) - 3) AS part,
    SUBSTRING(meal_preparation_reason_json, POSITION('":' IN meal_preparation_reason_json) + 2) AS rest
  FROM (
    SELECT
      encounter_id,
      json_extract_path_text(CE.raw_data, 'meal_preparation_reason') AS meal_preparation_reason_json
    FROM fq_common_telenutrition.clinical_encounter CE
    WHERE CE.encounter_status = 'closed'
    AND LENGTH(json_extract_path_text(CE.raw_data, 'meal_preparation_reason')) > 2
  )
  WHERE meal_preparation_reason_json IS NOT NULL

  UNION ALL

  -- Loop over all reasons in the Raw Data
  SELECT
    encounter_id,
    SUBSTRING(rest, POSITION('"' IN rest) + 1, POSITION('":' IN rest) - (POSITION('"' IN rest) + 1)) AS part,
    SUBSTRING(rest, POSITION('":' IN rest)  + 2) AS rest
  FROM CTE_recurring_meal_preparation_reason
  WHERE POSITION(',' IN rest) > 0
  
),
CTE_meal_preparation_reason AS (
  SELECT
    encounter_id,
    LISTAGG(part, ', ') AS meal_preparation_reason
  FROM CTE_recurring_meal_preparation_reason
  GROUP BY encounter_id
),

-- GET DATA OF ELIGIBLE PATIENTS  
CTE_eligible_lives AS (
  SELECT
    SP.patient_id,
    GU.id AS user_id,
    GUE.member_id,
    GUE.first_name,
    GUE.last_name,
    SP.phone,
    CASE
      WHEN SP.address2 IS NOT NULL THEN SP.address || ', ' || SP.address2 || ', ' || SP.city
      ELSE SP.address || ', ' || SP.city
    END AS address,
    GUE.pregnancy
  FROM (
    SELECT
      id AS eligible_id,
      person_id AS member_id,
      firstname AS first_name,
      lastname AS last_name,
      json_extract_path_text(raw_data, 'Pregnant') AS pregnancy
    FROM fq_foodapp_tenants.go_users_eligible
    WHERE organization_id = 197
  ) GUE
  LEFT JOIN fq_foodapp_tenants.go_users GU 
    ON GUE.eligible_id = GU.eligible_id 
  INNER JOIN fq_common_telenutrition.iam_identity IAI
    ON GUE.eligible_id = IAI.eligible_id
  INNER JOIN fq_common_telenutrition.schedule_patient SP
    ON IAI.identity_id = SP.identity_id
),

-- GET CLINICAL ENCOUNTER DATA
CTE_clinical_encounters AS (
  SELECT
    CE.encounter_id,
    CE.patient_id,
    CE.appointment_id,
    CE.provider_id,
    CE.encounter_status,
    CE.raw_data
  FROM fq_common_telenutrition.clinical_encounter CE
  WHERE CE.encounter_status = 'closed'
  --LIMIT 50000
),

-- GET BIOMETRICS DATA (FIRST RECORD PER PATIENT)
CTE_biometrics AS (
  SELECT
    user_id,
    '[' || TRIM(LEADING ','
              FROM
                CASE WHEN hypertension_flag IS NOT NULL THEN ','||'"'||hypertension_flag||'"' ELSE '' END
              || CASE WHEN hyperlipidemia_flag IS NOT NULL THEN ','||'"'||hyperlipidemia_flag||'"' ELSE '' END
              || CASE WHEN hyperglycemia_flag IS NOT NULL THEN ','||'"'||hyperglycemia_flag||'"' ELSE '' END
            )
    || ']'  AS biometrics_flag
  FROM (
    SELECT
      UB.user_id,
      --UB."date"::DATE AS biometric_date,
      CASE
        WHEN (UB.systolic >= 140 OR UB.diastolic >= 90) THEN 'hypertension'
        ELSE NULL
      END AS hypertension_flag,
      CASE
        WHEN (UB.cholesterol >= 200 OR UB.hdl <= 40 OR UB.ldl >= 130 OR UB.triglycerides >= 150) THEN 'hyperlipidemia'
        ELSE NULL
      END AS hyperlipidemia_flag,
      CASE
        WHEN (UB.ha1c >= 6.5) THEN 'diabetes'
        ELSE NULL
      END AS hyperglycemia_flag,
      /*CASE
        WHEN (UB.systolic >= 140 OR UB.diastolic >= 90) THEN 'hypertension'
        WHEN (UB.cholesterol >= 200 OR UB.hdl <= 40 OR UB.ldl >= 130 OR UB.triglycerides >= 150) THEN 'hyperlipidemia'
        WHEN (UB.ha1c >= 6.5) THEN 'hyperglycemia'
        ELSE NULL
      END biometrics_flag,*/
      ROW_NUMBER() OVER(PARTITION BY UB.user_id ORDER BY UB."date" ASC) AS biometric_number
    FROM fq_foodapp_tenants.hc_user_biomarkers UB
    WHERE date >= '2024-10-16'
    AND ((UB.systolic >= 140 OR UB.diastolic >= 90) -- HYPERTENSION
    OR (UB.cholesterol >= 200 OR UB.hdl <= 40 OR UB.ldl >= 130 OR UB.triglycerides >= 150) -- HYPERLIPIDEMIA
    OR (UB.ha1c >= 6.5)) -- HYPERGLYCEMIA
  )
  WHERE biometric_number = 1
)

SELECT
  appointment_date,
  member_id,
  patient_id,
  first_name,
  last_name,
  address,
  phone,
  CASE WHEN specialized_diet IS NOT NULL THEN 'Yes' ELSE 'No' END AS in_specialized_diet,
  specialized_diet,
  CASE WHEN food_sensitivity_intolerance IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_food_sensitivity_intolerance,
  food_sensitivity_intolerance,
  CASE WHEN allergies IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_allergies,
  allergies,
  medical_conditions,
  pregnancy,
  cooking_responsibility,
  cooking_frequency_at_home,
  meal_preparation_reason,
  biometrics_flag
FROM (
  SELECT
    appointment_date,
    member_id,
    patient_id,
    first_name,
    last_name,
    address,
    phone,
    json_extract_path_text(raw_data, 'food_allergy') AS allergies,
    json_extract_path_text(raw_data, 'specialized_diet_type') AS specialized_diet,
    json_extract_path_text(raw_data, 'food_sensitivity_intolerance') AS food_sensitivity_intolerance,
    json_extract_path_text(raw_data, 'medical_conditions') AS medical_conditions,
    --json_extract_path_text(raw_data, 'medications_list') AS medications_list,
    --json_extract_path_text(raw_data, 'vitamin_supplements') AS vitamin_supplements,
    json_extract_path_text(raw_data, 'cooking_responsibility') AS cooking_responsibility,
    --json_extract_path_text(raw_data, 'meal_preparation_reason') AS meal_preparation_reason_raw_data,
    meal_preparation_reason,
    --json_extract_path_text(raw_data, 'current_work_situation') AS current_work_situation,
    json_extract_path_text(raw_data, 'cooking_frequency_at_home') AS cooking_frequency_at_home,
    pregnancy,
    biometrics_flag
  FROM (
    SELECT
      DATE(DA.start_timestamp) AS appointment_date,
      EL.patient_id,
      EL.member_id,
      EL.first_name,
      EL.last_name,
      EL.address,
      EL.phone,
      CE.encounter_id,
      CE.appointment_id,
      CE.provider_id,
      CE.raw_data,
      MPR.meal_preparation_reason,
      EL.pregnancy,
      BM.biometrics_flag,
      ROW_NUMBER() OVER(PARTITION BY EL.patient_id ORDER BY DA.start_timestamp ASC) AS appointment_number
    FROM CTE_eligible_lives EL
    INNER JOIN CTE_clinical_encounters CE
      ON EL.patient_id = CE.patient_id
    LEFT JOIN CTE_meal_preparation_reason MPR
      ON CE.encounter_id = MPR.encounter_id
    LEFT JOIN CTE_biometrics BM
      ON EL.user_id = BM.user_id
    INNER JOIN analytics.dim_appointment DA
        ON CE.appointment_id = DA.appointment_id
    WHERE (DA.claim_id::INT <= 0 OR DA.claim_id IS NULL)
    --AND DA.start_timestamp >= '2024-01-01'
    AND DA.insurance_id = 18
  )
  WHERE appointment_number = 1
  AND appointment_date >= '2024-10-16'
  AND (pregnancy = 'Y' OR medical_conditions LIKE '%hypertension%' OR medical_conditions LIKE '%high_cholesterol%' OR medical_conditions LIKE '%type_2_diabetes%' OR medical_conditions LIKE '%type_1_diabetes%' OR biometrics_flag IS NOT NULL)
)
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
