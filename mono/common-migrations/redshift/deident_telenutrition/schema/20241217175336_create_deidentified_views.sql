-- migrate:up
CREATE SCHEMA IF NOT EXISTS deident_telenutrition;

CREATE MATERIALIZED VIEW deident_telenutrition.appointment AS
SELECT 
    tam.appointment_did as appointment_id,
    dsp.patient_did AS patient_id,
    dpr.provider_did AS provider_id,
    sa.status AS appointment_status,
    sa.booked_duration AS appointment_duration,
    sa.start_timestamp::date AS appointment_date,
    sa.status_normalized AS appointment_status_normalized,
    sa.participation,
    sa.cancel_reason,
    sa.state,
    di.insurance_did as insurance_id,
    de.employer_did as employer_id
FROM analytics.dim_appointment sa
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping dsp 
    ON sa.patient_id = dsp.patient_id
LEFT JOIN fq_teleapp_deident.telenutrition_appointment_mapping tam 
    ON sa.appointment_id = tam.appointment_id
LEFT JOIN fq_teleapp_deident.telenutrition_provider_mapping dpr 
    ON sa.provider_id = dpr.provider_id
LEFT JOIN fq_teleapp_deident.telenutrition_insurance_mapping di 
    ON sa.insurance_id = di.insurance_id
LEFT JOIN fq_teleapp_deident.telenutrition_employer_mapping de
    ON sa.employer_id = de.employer_id;

CREATE MATERIALIZED VIEW deident_telenutrition.clinical_encounter AS
SELECT 
    tem.encounter_did AS encounter_id,
    tam.appointment_did AS appointment_id,
    dsp.patient_did AS patient_id,
    dpr.provider_did AS provider_id,
    ce.encounter_status,
    ce.encounter_date,
    ce.units_billed,
    ce.diagnosis_code,
    ce.billing_code
FROM fq_common_telenutrition.clinical_encounter ce
LEFT JOIN fq_teleapp_deident.telenutrition_encounter_mapping tem
    ON ce.encounter_id = tem.encounter_id
LEFT JOIN fq_teleapp_deident.telenutrition_appointment_mapping tam 
    ON ce.appointment_id = tam.appointment_id
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping dsp 
    ON ce.patient_id = dsp.patient_id
LEFT JOIN fq_teleapp_deident.telenutrition_provider_mapping dpr 
    ON ce.provider_id = dpr.provider_id;


CREATE MATERIALIZED VIEW deident_telenutrition.user_patient AS
SELECT 
    dsu.user_did AS user_id,
    dsp.patient_did AS patient_id
FROM fq_common_telenutrition.schedule_user_patient su
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping dsp 
    ON su.patient_id = dsp.patient_id
LEFT JOIN fq_teleapp_deident.telenutrition_user_mapping dsu 
    ON su.user_id = dsu.user_id;

CREATE MATERIALIZED VIEW deident_telenutrition.referral AS
SELECT 
    tsr.referral_did as referral_id,
    sr.referral_status,
    sr.type AS referral_type,
    dsp.patient_did AS patient_id,
    dspv.provider_did AS provider_id
FROM fq_teleapp_deident.telenutrition_referral_mapping tsr
LEFT JOIN fq_common_telenutrition.schedule_referral sr 
    ON tsr.referral_id = sr.referral_id
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping dsp 
    ON sr.patient_id = dsp.patient_id
LEFT JOIN fq_teleapp_deident.telenutrition_provider_mapping dspv
    ON sr.referrer_id = dspv.provider_id;


CREATE MATERIALIZED VIEW deident_telenutrition.account AS
SELECT 
    *
FROM fq_teleapp_common.account;


CREATE MATERIALIZED VIEW deident_telenutrition.appointment_cancel_reason AS
SELECT 
    *
FROM fq_common_telenutrition.appointment_cancel_reason;


CREATE MATERIALIZED VIEW deident_telenutrition.clinical_encounter_amendment AS
SELECT 
    tceam.amendment_did AS amendment_id,
    tce.encounter_did AS encounter_id,
    tceam.units_billed,
    tceam.billing_code,
    tceam.reason,
    tceam.status,
    tceam.created_at,
    tceam.resolved_at,
    tceam.resolved_by
FROM fq_common_telenutrition.clinical_encounter_amendment cea
LEFT JOIN fq_teleapp_deident.telenutrition_clinical_encounter_amendment_mapping tceam ON cea.amendment_id = tceam.amendment_id
LEFT JOIN fq_teleapp_deident.telenutrition_encounter_mapping tce ON cea.encounter_id = tce.encounter_id;

CREATE MATERIALIZED VIEW deident_telenutrition.ontology_concept AS
SELECT 
    * 
FROM fq_common_telenutrition.ontology_concept;

CREATE MATERIALIZED VIEW deident_telenutrition.patient_attribute AS
SELECT 
    *
FROM fq_common_telenutrition.patient_attribute;

CREATE MATERIALIZED VIEW deident_telenutrition.patient_attribute_option AS
SELECT 
    *
FROM fq_common_telenutrition.patient_attribute_option;

CREATE MATERIALIZED VIEW deident_telenutrition.payer AS
SELECT 
    *
FROM fq_common_telenutrition.payer;

CREATE MATERIALIZED VIEW deident_telenutrition.payment_method_type AS
SELECT 
    *  
FROM fq_common_telenutrition.payment_method_type;

CREATE MATERIALIZED VIEW deident_telenutrition.appointment_type AS
SELECT 
    *
FROM fq_common_telenutrition.schedule_appointment_type;

CREATE MATERIALIZED VIEW deident_telenutrition.department AS
SELECT 
    *
FROM fq_common_telenutrition.schedule_department;

CREATE MATERIALIZED VIEW deident_telenutrition.employer AS
SELECT 
employer_did as employer_id,
label,
created_at
FROM fq_teleapp_deident.telenutrition_employer_mapping;

CREATE MATERIALIZED VIEW deident_telenutrition.insurance AS
SELECT 
    IM.insurance_did as insurance_id,
    IM.label,
    PM.payer_did as payer_id
FROM fq_teleapp_deident.telenutrition_insurance_mapping IM
LEFT JOIN fq_teleapp_deident.telenutrition_payer_mapping PM 
    ON IM.payer_id = PM.payer_id;


CREATE MATERIALIZED VIEW deident_telenutrition.patient AS
SELECT 
 PM.patient_did as patient_id,
 SD.department_id as department_id,
 SP.state,
 SUBSTRING(SP.zip_code FROM 1 FOR 3) as zip3
 FROM fq_teleapp_deident.telenutrition_patient_mapping PM
 LEFT JOIN fq_common_telenutrition.schedule_patient SP 
    ON PM.patient_id = SP.patient_id
 LEFT JOIN fq_common_telenutrition.schedule_department SD
    ON SP.department_id = SD.department_id;

CREATE MATERIALIZED VIEW deident_telenutrition.patient_payment_method AS
SELECT 
    tpm.payment_method_did as payment_method_id,
    spm.payment_method_type_id,
    pm.patient_did as patient_id
FROM fq_teleapp_deident.telenutrition_schedule_patient_payment_method_mapping tpm
LEFT JOIN fq_common_telenutrition.schedule_patient_payment_method spm 
    ON tpm.payment_method_id = spm.payment_method_id
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping pm
    ON spm.patient_id = pm.patient_id;

CREATE MATERIALIZED VIEW deident_telenutrition.provider AS
SELECT 
    tp.provider_did as provider_id,
    sp.first_name,
    sp.last_name,
    sp.languages,
    sp.pediatrics,
    sp.npi
FROM fq_teleapp_deident.telenutrition_provider_mapping tp
LEFT JOIN fq_common_telenutrition.schedule_provider sp 
    ON tp.provider_id = sp.provider_id;


CREATE MATERIALIZED VIEW deident_telenutrition.clinical_encounter_data AS
SELECT
  TEM.encounter_did as encounter_id,
  TPM.patient_did as patient_id,

  json_extract_path_text(raw_data, 'main_reason') AS main_reason,
  json_extract_path_text(raw_data, 'medical_conditions') AS medical_conditions,
  json_extract_path_text(raw_data, 'pregnancy') AS pregnancy,
  json_extract_path_text(raw_data, 'pregnancy_due_date') AS pregnancy_due_date,
  json_extract_path_text(raw_data, 'pregnancy_risk') AS pregnancy_risk,
  json_extract_path_text(raw_data, 'medications_list') AS medications_list,
  json_extract_path_text(raw_data, 'inpatient_visit_last_90_days') AS inpatient_visit_last_90_days,
  json_extract_path_text(raw_data, 'inpatient_visit_facility') AS inpatient_visit_facility,
  json_extract_path_text(raw_data, 'reason_for_inpatient_visit') AS reason_for_inpatient_visit,

  CAST(NULLIF(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'blood_pressure_systolic'), '{}'), 'value'), '.'), '') AS FLOAT) AS blood_pressure_systolic,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'blood_pressure_systolic'), '{}'), 'date'), '') AS DATE) AS blood_pressure_systolic_measured_date,

  CAST(NULLIF(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'blood_pressure_diastolic'), '{}'), 'value'), '.'), '') AS FLOAT) AS blood_pressure_diastolic,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'blood_pressure_diastolic'), '{}'), 'date'), '') AS DATE) AS blood_pressure_diastolic_measured_date,

  (
    COALESCE(CAST(NULLIF(NULLIF(json_extract_path_text(raw_data, 'height_feet'), '.'), '') AS FLOAT), 0) * 12 +
    COALESCE(CAST(NULLIF(NULLIF(json_extract_path_text(raw_data, 'height_inches'), '.'), '') AS FLOAT), 0)
  ) AS height,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'weight'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'weight'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS weight,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'weight'), '{}'), 'date'), '') AS DATE) AS weight_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'a1c'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'a1c'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS a1c,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'a1c'), '{}'), 'date'), '') AS DATE) AS a1c_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'hdl'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'hdl'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS hdl,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'hdl'), '{}'), 'date'), '') AS DATE) AS hdl_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'ldl'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'ldl'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS ldl,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'ldl'), '{}'), 'date'), '') AS DATE) AS ldl_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'triglycerides'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'triglycerides'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS triglycerides,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'triglycerides'), '{}'), 'date'), '') AS DATE) AS triglycerides_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'total_cholesterol'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'total_cholesterol'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS total_cholesterol,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'total_cholesterol'), '{}'), 'date'), '') AS DATE) AS total_cholesterol_measured_date,

  CAST(
    CASE
      WHEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'bmi'), '{}'), 'value') ~ '^\d+(\.\d+)?$'
      THEN json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'bmi'), '{}'), 'value')
      ELSE NULL
    END AS FLOAT
  ) AS bmi,
  CAST(NULLIF(json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'bmi'), '{}'), 'date'), '') AS DATE) AS bmi_measured_date,

  json_extract_path_text(raw_data, 'specialized_diet_type') AS specialized_diet_type,
  json_extract_path_text(raw_data, 'food_sensitivity_intolerance') AS food_sensitivity_intolerance,
  json_extract_path_text(raw_data, 'food_allergy') AS food_allergy,
  json_extract_path_text(raw_data, 'vitamin_supplements') AS vitamin_supplements,
  CAST(NULLIF(NULLIF(json_extract_path_text(raw_data, 'meals_per_day'), '.'), '') AS FLOAT) AS meals_per_day,
  json_extract_path_text(raw_data, 'first_meal_of_day_time') AS first_meal_of_day_time,
  json_extract_path_text(raw_data, 'last_meal_of_day_time') AS last_meal_of_day_time,
  json_extract_path_text(raw_data, 'current_work_situation') AS current_work_situation,
  json_extract_path_text(raw_data, 'activity_level') AS activity_level,
  json_extract_path_text(raw_data, 'health_related_activity_limitations') AS health_related_activity_limitations,
  json_extract_path_text(raw_data, 'social_support') AS social_support,
  CAST(NULLIF(NULLIF(json_extract_path_text(raw_data, 'average_sleep_duration'), '.'), '') AS FLOAT) AS average_sleep_duration,
  json_extract_path_text(raw_data, 'cooking_frequency_at_home') AS cooking_frequency_at_home,
  json_extract_path_text(raw_data, 'cooking_responsibility') AS cooking_responsibility,
  json_extract_path_text(raw_data, 'meal_preparation_reason') AS meal_preparation_reason,
  json_extract_path_text(raw_data, 'grocery_acquisition_method') AS grocery_acquisition_method,
  json_extract_path_text(raw_data, 'grocery_purchasing_frequency') AS grocery_purchasing_frequency,
  json_extract_path_text(raw_data, 'grocery_payment_method') AS grocery_payment_method,
  json_extract_path_text(raw_data, 'takeout_restaurant_frequency') AS takeout_restaurant_frequency,
  json_extract_path_text(raw_data, 'food_shortage_worry_frequency') AS food_shortage_worry_frequency,
  json_extract_path_text(raw_data, 'food_security_last_12_months') AS food_security_last_12_months,
  json_extract_path_text(raw_data, 'household_food_adequacy_last_12_months') AS household_food_adequacy_last_12_months,
  json_extract_path_text(raw_data, 'difficulty_getting_eating_healthy_foods') AS difficulty_getting_eating_healthy_foods,
  json_extract_path_text(raw_data, 'snap_ebt_assistance_interest') AS snap_ebt_assistance_interest,
  CAST(NULLIF(NULLIF(json_extract_path_text(raw_data, 'weekly_food_budget'), '.'), '') AS FLOAT) AS weekly_food_budget,
  json_extract_path_text(raw_data, 'distance_from_grocery') AS distance_from_grocery,
  json_extract_path_text(raw_data, 'confidence_in_food_abilities') AS confidence_in_food_abilities,
  json_extract_path_text(raw_data, 'emotional_response_to_food') AS emotional_response_to_food,
  json_extract_path_text(raw_data, 'intervention') AS intervention,
  
  json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'pes_statement'), '{}'), 'nutrition_diagnosis') AS problem,
  json_extract_path_text(NULLIF(json_extract_path_text(raw_data, 'pes_statement'), '{}'), 'related_to') AS etiology,

  json_extract_path_text(raw_data, 'cpt_code') AS cpt_code,
  json_extract_path_text(raw_data, 'start_time') AS start_time,
  json_extract_path_text(raw_data, 'end_time') AS end_time,
  json_extract_path_text(raw_data, 'diagnosis_code') AS diagnosis_code,
  json_extract_path_text(raw_data, 'units_billed') AS units_billed,
  json_extract_path_text(raw_data, 'member_details_confirmed') AS member_details_confirmed,
  json_extract_path_text(raw_data, 'member_expressed_understanding_of_education') AS member_expressed_understanding_of_education,
  json_extract_path_text(raw_data, 'member_felt_confident_in_ability_to_meet_goals') AS member_felt_confident_in_ability_to_meet_goals

FROM fq_common_telenutrition.clinical_encounter CE
LEFT JOIN fq_teleapp_deident.telenutrition_encounter_mapping TEM on CE.encounter_id = TEM.encounter_id
LEFT JOIN fq_teleapp_deident.telenutrition_patient_mapping TPM on CE.patient_id = TPM.patient_id
where CE.encounter_id > 1000000
and CE.encounter_status = 'closed';


-- migrate:down

