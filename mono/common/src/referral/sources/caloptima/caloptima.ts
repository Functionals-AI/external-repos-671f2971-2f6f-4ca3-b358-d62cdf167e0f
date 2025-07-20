import { Result, ok, err } from 'neverthrow'
import { DateTime } from 'luxon'
import { RowDataPacket } from 'mysql2'

import { CalOptimaReferralConfig } from '../../../config'
import { IContext } from '../../../context'
import { ErrCode } from '../../../error'
import { ReferralAction, ReferralActionType, ReferralActionReasons, updateScheduleReferralAction } from '../../store'
import { CalOptimaReferral, CalOptimaService, CaloptimaConnectContext, MECHANICALLY_ALTERED_DIET_MAPPING, createReauthReferral, createReferral } from '../../../integration/cal-optima-connect/browser'
import { determineVendor, VendorPreferenceData } from '../../determinations'
import { AccountIds } from '../../../account/service'

const MTAG = ['common', 'referral', 'service']

async function fetchAllergies(context: IContext, identityId: number): Promise<string[] | null> {
  const { logger, store: { writer }, mysql } = context

  const pool = await mysql.reader()


  const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        response
      FROM tenants.go_users GU
      LEFT JOIN tenants.survey_response SR ON SR.user_id=GU.id
      WHERE
        GU.ta_identity_id = ?
        AND question = 'allergies'
    `, [identityId])

  if (rows.length > 0) {
    const allergies = JSON.parse(rows[0].response)
    console.log(`allergies: ${allergies}`)
    return allergies
  }

  return null
}

const RISK_SCORE_TYPES = {
  'low': 'low',
  'medium': 'medium',
  'high': 'high',
}

const DIAGNOSIS_MAPPING = {
  'type_1_diabetes': 'E10.9',
  'type_2_diabetes': 'E11.9',
  'heart_disease': 'I50.9',
}

const FOOD_BENEFITS_TYPES = {
  'grocery_box': 'grocery_box',
  'mtm': 'mtm',
}

const FOOD_BENEFITS_FREQUENCY_TYPES = {
  '1 grocery box per week': '1 grocery box per week',
  '2 meals per day': '2 meals per day',
}

const FOOD_BENEFITS_DURATION_TYPES = {
  '4 weeks - 28 days': '4 weeks - 28 days',
  '12 weeks - 84 days': '12 weeks - 84 days',
}

const FOOD_BENEFIT_FREQUENCY_MAPPING = {
  [FOOD_BENEFITS_TYPES.grocery_box]: [
    FOOD_BENEFITS_FREQUENCY_TYPES['1 grocery box per week']
  ],
  [FOOD_BENEFITS_TYPES.mtm]: [
    FOOD_BENEFITS_FREQUENCY_TYPES['2 meals per day']
  ],
}

type Nullable<T> = { [K in keyof T]: T[K] | null };

type DecisionResultActionable = {
  vendor: string;
  description: string | null;
  message: string | null;
  allergies: string[] | null;
  risk_score: string;
  food_benefit: string;
  service_date: string;
  mechanical_altered_diet: string;
  diagnosis_icd10: string | null;
  duration: string;
  frequency: string;
  dietitian_recommendation: string | null;
  food_benefit_limit_reached: string;
}

type DecisionResultUnactionable = {
  vendor: string;
  description: string | null;
  message: string | null;
  allergies: string[] | null;
  risk_score: string;
  food_benefit: string;
  service_date: string;
  mechanical_altered_diet: string | null;
  diagnosis_icd10: string | null;
  duration: string;
  frequency: string;
  dietitian_recommendation: string | null;
  food_benefit_limit_reached: string | null;
}

type DecisionResult = Nullable<DecisionResultActionable>

function isActionableDecisionResult(result: DecisionResult): result is DecisionResultActionable {
  if (result.vendor === null) {
    return false
  }

  if (result.risk_score === null) {
    return false
  }

  return ['high', 'medium'].includes(result.risk_score)
}

async function validateDecisionResult(output: DecisionResult, referralConfig: CalOptimaReferralConfig): Promise<Result<DecisionResultActionable | DecisionResultUnactionable, string>> {
  const vendors = referralConfig.cal_optima_connect.food_vendors
  const foodVendorsList = Object.keys(vendors)

  if (output.risk_score === null || !Object.keys(RISK_SCORE_TYPES).includes(output.risk_score)) {
    return err('invalid_decision_risk_score')
  }

  // Actionable Decision
  if (output.vendor !== null && foodVendorsList.includes(output.vendor)) {
    if (output.risk_score === null || output.risk_score === RISK_SCORE_TYPES.low) {
      return err('invalid_decision_risk_score')
    }

    if (output.mechanical_altered_diet === null || !Object.keys(MECHANICALLY_ALTERED_DIET_MAPPING).includes(output.mechanical_altered_diet)) {
      return err('invalid_decision_mechanical_altered_diet')
    }

    if (output.frequency === null || !Object.keys(FOOD_BENEFITS_FREQUENCY_TYPES).includes(output.frequency)) {
      console.log(`invalid_decision_frequency: ${output.frequency}`, Object.keys(FOOD_BENEFITS_FREQUENCY_TYPES))
      return err('invalid_decision_frequency')
    }

    if (output.duration === null || !Object.keys(FOOD_BENEFITS_DURATION_TYPES).includes(output.duration)) {
      return err('invalid_decision_duration')
    }

    if (output.diagnosis_icd10 === null) {
      return err('invalid_decision_diagnosis_icd10')
    }

    if (output.food_benefit === null || !Object.keys(FOOD_BENEFITS_TYPES).includes(output.food_benefit)) {
      return err('invalid_decision_food_benefit')
    }

    if (output.food_benefit === FOOD_BENEFITS_TYPES.grocery_box) {
      if (!FOOD_BENEFIT_FREQUENCY_MAPPING[FOOD_BENEFITS_TYPES.grocery_box].includes(output.frequency)) {
        return err('invalid_decision_frequency_grocery_box')
      }
    }

    if (output.food_benefit === FOOD_BENEFITS_TYPES.mtm) {
      if (!FOOD_BENEFIT_FREQUENCY_MAPPING[FOOD_BENEFITS_TYPES.mtm].includes(output.frequency)) {
        return err('invalid_decision_frequency_mtm')
      }
    }

    return ok(output as DecisionResultActionable)
  }

  return ok(output as DecisionResultUnactionable)
}

export interface ActionableReferral {
  referralId: number,
  patientExternalId: string,
  referralExternalId: string,
  identityId: number,
  questionnaireId: number,
}

export interface PerformReferralActionsOptions {
  sourceContext?: CaloptimaConnectContext,
  dryRun?: boolean,
}

export interface PerformReferralActionsResult {
  referralId: number,
  actions: ReferralAction[],
}

export async function performReferralActions(context: IContext, referral: ActionableReferral, options?: PerformReferralActionsOptions): Promise<Result<PerformReferralActionsResult, ErrCode>> {
  const { config, logger, store: { reader } } = context

  const TAG = [...MTAG, 'performReferralActions']

  try {
    logger.info(context, TAG, `Perform any referral actions.`, {
      referral_id: referral.referralId
    })

    const pool = await reader()

    if (referral.questionnaireId === null) {
      const action: ReferralAction = {
        action_type: ReferralActionType.ERROR,
        action_date: DateTime.now().toISODate(),
        action_reason: ReferralActionReasons.MISSING_QUESTIONNAIRE,
      }

      const updateResult = await updateScheduleReferralAction(context, referral.referralId, action)

      if (updateResult.isErr()) {
        logger.error(context, TAG, 'Error updating referral action.', {
          referral,
          action,
          error: updateResult.error,
        })

        return err(updateResult.error)
      }

      logger.info(context, TAG, 'Skipping referral update due to missing questionnaire ID.', {
        referral_id: referral.referralId,
        action,
      })

      return ok({
        referralId: referral.referralId,
        actions: [action],
      })
    }

    const { rows } = await pool.query(`
      WITH form_recent_inpatient_visit_reasons as (
        select 
          patient_id, array_agg(value) as recent_inpatient_admission_reason_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'recent_inpatient_admission_reason'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as inpatient_visit_reason
        group by 1  
      ),
      form_medical_conditions as (
        select 
          patient_id, array_agg(value) as medical_conditions_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'medical_conditions'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as med_conditions
        group by 1  
      ),
      
      form_medications as (
        select 
          patient_id, array_agg(value) as medications_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'medications'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as meds
        group by 1  
      ),

      form_cuisine_preferences as (
        select 
          patient_id, array_agg(value) as cuisine_preferences_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'cuisine_preferences'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as cuisine_preferences
        group by 1  
      ),

      form_food_sensitivities as (
        select 
          patient_id, array_agg(value) as food_sensitivities_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'food_sensitivities'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as food_sensitivities
        group by 1  
      ),
      
      form_food_allergies as (
        select 
          patient_id, array_agg(value) as food_allergies_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'food_allergies'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as food_allergies
        where value in ('none','dairy', 'egg', 'fish', 'shellfish', 'tree_nut', 'peanut', 'wheat', 'soy', 'sesame')
        group by 1  
      ),

      form_diet_types as (
        select 
          patient_id, array_agg(value) as diet_types_list
        from(
          select patient_id, jsonb_extract_path_text(jsonb_array_elements(form_data->'diet_types'),'value') as value
          from telenutrition.clinical_encounter_screening_questionnaire
        ) as diet_types
        where value in ('none','keto','vegan','kosher')
        group by 1  
      )
      
      select
        -- Description of Service Request
        case when food_benefit = 'none' then null 
          when food_benefit = 'grocery_box' then 'Member will be receiving grocery boxes'
          when food_benefit = 'mtm' then 'Member will be receiving medically tailored meals'
          else null end as description,
        -- message to receiving org; standardized for now
        case when food_benefit_determination = 'No Food' then null 
          else 'Please choose food in accordance to the conditions in the referral below'
        end as message,
        CASE
          WHEN determination_code like 'high%' THEN 'high'
          WHEN determination_code like 'medium%' THEN 'medium'
          WHEN determination_code like 'low%' THEN 'low'
          ELSE NULL
        END as risk_score,
        *,
        case 
          when determination_code like 'medium%' then (referral_action_date + INTERVAL '4 weeks' )::date
          when determination_code like 'high%' then (referral_action_date + INTERVAL '12 weeks' )::date
          else null end as reauth_decision_date
      from(
        SELECT CASE 
          WHEN food_benefit_determination = 'Medically Tailored Meals' and (prefers_grocery_delivery = '"yes"' or meal_type_preference = '"grocery_boxes"') THEN 'grocery_box'
          WHEN food_benefit_determination = 'Medically Tailored Meals' and (prefers_grocery_delivery = '"no"' or prefers_grocery_delivery is null) and (meal_type_preference != '"grocery_boxes"' or meal_type_preference is null) THEN 'mtm'
          WHEN food_benefit_determination = 'Grocery Boxes' THEN 'grocery_box'
          ELSE 'none'
        END as food_benefit,
        TO_CHAR(questionnaire_intake_date AT TIME ZONE 'PST', 'MM/DD/YYYY') AS service_date,
        --order of conditions per Jay's input
        CASE
          WHEN 'nonceliac_gluten'=ANY(food_sensitivities_list) then 'gluten_free' --Gluten Free
          WHEN 'lactose'=ANY(food_sensitivities_list) then 'lactose_free' --Lactose free
          WHEN 'stroke'=ANY(medical_conditions_list) then 'heart_friendly'
          WHEN 'end_state_renal_disease'=ANY(medical_conditions_list) THEN 'renal_friendly'
          WHEN referral_congestive_heart_failure_stages_c_or_d = 'T' or 'congestive_heart_failure' = ANY(medical_conditions_list) THEN 'low_na'
          WHEN 'celiac_disease'=ANY(medical_conditions_list) THEN 'gluten_free'
          WHEN 'type_1_diabetes'=ANY(medical_conditions_list) THEN 'diabetic_friendly'
          WHEN 'cancer' = ANY(medical_conditions_list) then 'cancer_supports_calories'
          WHEN 'crohns_disease'= ANY(medical_conditions_list) then 'low_residue_diet'
          WHEN 'chronic_kidney_disease'=ANY(medical_conditions_list) OR referral_chronic_kidney_disease_stages_3_or_4 = 'T' THEN 'renal_friendly'
          WHEN 'type_2_diabetes'=ANY(medical_conditions_list) THEN 'diabetic_friendly'
          WHEN 'heart_disease'=ANY(medical_conditions_list) THEN 'heart_friendly'
          WHEN 'hypertension' = any(medical_conditions_list)
            OR systolic >= 130 or diastolic >= 80 
            OR 'high blood pressure' = ANY(string_to_array(lower(array_to_string(medical_conditions_list, ',')), ',')) 
            OR 'hypertension' = ANY(string_to_array(lower(array_to_string(medical_conditions_list, ',')), ',')) 
            OR 'blood_pressure_medication' = ANY(medications_list) THEN 'low_na'
          when 'pre_diabetes'=ANY(medical_conditions_list) THEN 'diabetic_friendly'
          WHEN 'high_cholesterol'=ANY(medical_conditions_list) THEN 'heart_friendly'
          WHEN 'heart_related_issues'=ANY(medical_conditions_list) then 'heart_friendly'
          WHEN low_sodium_flag = TRUE then 'low_na'
          ELSE 'heart_friendly'
        END as mechanical_altered_diet,
        CASE
          WHEN 'stroke'=ANY(medical_conditions_list) then 'I63.9'
          WHEN 'physical_problem_adl_problems'=ANY(medical_conditions_list) THEN 'Z73.6'
          WHEN 'phenylketonuria'=ANY(medical_conditions_list) THEN 'E70.0'
          WHEN 'end_state_renal_disease'=ANY(medical_conditions_list) THEN 'N18.6'
          WHEN referral_congestive_heart_failure_stages_c_or_d = 'T' or 'congestive_heart_failure' = ANY(medical_conditions_list) then 'I50.3'
          WHEN 'celiac_disease'=ANY(medical_conditions_list) THEN 'K90.0'
          WHEN 'type_1_diabetes'=ANY(medical_conditions_list) THEN 'E10.9'
          WHEN 'eating_disorders'=ANY(medical_conditions_list) THEN 'F50.9'
          WHEN 'cancer' = ANY(medical_conditions_list) then 'C80.1'
          WHEN 'crohns_disease'= ANY(medical_conditions_list) then 'K50.90'
          WHEN 'rheumatoid_arthritis'=ANY(medical_conditions_list) then 'M06.9'
          WHEN 'chronic_kidney_disease'=ANY(medical_conditions_list) OR referral_chronic_kidney_disease_stages_3_or_4 = 'T' THEN 'N18.9'
          WHEN 'type_2_diabetes'=ANY(medical_conditions_list) THEN 'E11.9'
          WHEN 'dementia_alzheimers'=ANY(medical_conditions_list) THEN 'G30.9'
          WHEN 'heart_disease'=ANY(medical_conditions_list) then 'I51.9'
          WHEN 'Pregnant'=ANY(medical_conditions_list) THEN 'Z33.1'
          WHEN 'thyroid_issues' = any(medical_conditions_list) THEN 'E07.9'
          WHEN 'ibs'= ANY(medical_conditions_list) then 'K58.9'
          WHEN 'mental_health'= ANY(medical_conditions_list) then 'F99'
          WHEN 'hypertension' = any(medical_conditions_list)
            OR systolic >= 130 or diastolic >= 80 
            OR 'high blood pressure' = ANY(string_to_array(lower(array_to_string(medical_conditions_list, ',')), ',')) 
            OR 'hypertension' = ANY(string_to_array(lower(array_to_string(medical_conditions_list, ',')), ',')) 
            OR 'blood_pressure_medication' = ANY(medications_list) THEN 'I10' --hypertension 
          WHEN 'pre_diabetes' = any(medical_conditions_list) then 'R73.03'
          WHEN 'high_cholesterol'=ANY(medical_conditions_list) THEN 'E78.00'
          WHEN 'other_autoimmune_disease' = any(medical_conditions_list) THEN 'D89.9'
          WHEN 'COPD'=any(medical_conditions_list) THEN 'J44.9'
          WHEN 'heart_related_issues'=ANY(medical_conditions_list) THEN 'I51.9'
          ELSE 'Z71.3'
        END as diagnosis_icd10,
        --duration of meals
        CASE
          WHEN determination_code like 'high%' THEN '12 weeks - 84 days'
          WHEN determination_code like 'medium%' THEN '4 weeks - 28 days' 
          ELSE null 
        END as duration,
        CASE
          WHEN food_benefit_determination = 'Medically Tailored Meals' and (prefers_grocery_delivery = '"yes"' or meal_type_preference = '"grocery_boxes"') THEN '1 grocery box per week'
          WHEN food_benefit_determination = 'Medically Tailored Meals' and (prefers_grocery_delivery = '"no"' or prefers_grocery_delivery is null) and (meal_type_preference != '"grocery_boxes"' or meal_type_preference is null) THEN '2 meals per day'
          WHEN food_benefit_determination = 'Grocery Boxes' THEN '1 grocery box per week'
          ELSE null
        END as frequency,
        *
      from(
        select
          *, 
          row_number() over (partition by patient_id order by questionnaire_intake_date asc) as risk_assessment_take_number,
          --food benefit determination
          case when
            (
              (
                (determination_code in ('high_risk','medium_risk', 'high_risk_per_referral_data')) and
                (referral_member_receive_other_meal_delivery_services_from_local_state_or_federally_funded_program != 'T') and
                (
                  'physical_problem_adl_problems' = any(medical_conditions_list) or
                  'end_state_renal_disease' = any(medical_conditions_list) or
                  --more specifically congestive heart failure, placeholder for now until get referral data in
                  'heart_disease' = any(medical_conditions_list) or
                  recent_inpatient_yn = '"yes"' or
                  (health_limitations ='"severely_limited"' or  (health_limitations ='"somewhat_limited"' and friends_and_family_support = '"never"'))
                )
              ) or 
              referral_discharge_plan_with_MTM = 'T' or
              referral_congestive_heart_failure_stages_c_or_d = 'T' or
              referral_member_recently_discharged_from_hospital_or_nursing_fac = 'T'
          ) and (prefers_grocery_delivery = '"no"' or prefers_grocery_delivery is null) and (meal_type_preference != '"grocery_boxes"' or meal_type_preference is null) then 'Medically Tailored Meals'
          when
            determination_code in ('high_risk','medium_risk', 'high_risk_per_referral_data') 
              and referral_member_receive_other_meal_delivery_services_from_local_state_or_federally_funded_program != 'T' then 'Grocery Boxes'--could also add in hard
          else 'No Food' end as food_benefit_determination
        from (
          select
            SR.referral_action as referral_action,
            SR.referral_action ->> 'action_type' as referral_action_type,
            SR.referral_action ->> 'action_reason' as referral_action_reason,
            SR.referral_action -> 'data' -> 'vendor' as referral_action_vendor,
            SR.referral_action -> 'data' -> 'description' as referral_action_description,
            SR.referral_action -> 'data' -> 'diagnosis_icd10' as referral_action_icd_10,
            (SR.source_data ->>'REFERRAL_DATE')::date as referral_date,
            (SR.referral_action ->> 'action_date')::date as referral_action_date,
            SQ.created_at::date as questionnaire_intake_date,
            SQ.encounter_id,
            SQ.appointment_id,
            SQ.patient_id,
            (SR.source_data->>'CIN')::text as CIN,
            SQ.provider_id,
            -- for members who had coronary heart failure, recently discharged with plan for MTM, or recently decently discharged auto-set to 
            -- high_risk regardless if filled out risk stratification questionnaire or not
            -- if didn't fill out risk stratification questionnaire then set as low_risk
            case
              when (SR.source_data->>'CAFD_HEART')::text = 'T' or
                (SR.source_data->>'CAFD_DISCHARGE_PLAN')::text = 'T' or 
                (SR.source_data->>'CAFD_DISCHARGE')::text = 'T' then 'high_risk_per_referral_data'
              when 
                (
                  (SR.source_data->>'CAFD_KIDNEY')::text = 'T' or 
                  (SR.source_data->>'DIABETES')::text = 'T' or 
                  (SQ.form_data->'blood_pressure'->0->>'systolic')::numeric >= 140 
                  or (SQ.form_data->'blood_pressure'->0->>'diastolic')::numeric >= 90 or 
                  (SQ.form_data->'a1c'->0->>'percentage')::numeric >= 6.5 or 
                  (SQ.form_data->'lipids'->0->>'hdl')::numeric <= 40 or 
                  (SQ.form_data->'lipids'->0->>'ldl')::numeric >= 130 or 
                  (SQ.form_data->'lipids'->0->>'triglycerides')::numeric >= 150 or 
                  (SQ.form_data->'lipids'->0->>'cholesterol')::numeric >=200
                ) and 
                (
                  (SQ.determination_meta->'categoryRisks'->'lifestyleAndWellbeingAddedRisk')::boolean = TRUE and 
                  (SQ.determination_meta->'categoryRisks'->'foodNutritionInsecurityAddedRisk')::boolean = TRUE
                ) 
                then 'high_risk'
              when SQ.determination_code::text = 'high_risk' then 'high_risk'
              --incorporate referrals data for CKD and diabetes, as well as biometrics into risk logic
              when 
                (
                  (SR.source_data->>'CAFD_KIDNEY')::text = 'T' or 
                  (SR.source_data->>'DIABETES')::text = 'T' or 
                  (SQ.form_data->'blood_pressure'->0->>'systolic')::numeric >= 140 
                  or (SQ.form_data->'blood_pressure'->0->>'diastolic')::numeric >= 90 or 
                  (SQ.form_data->'a1c'->0->>'percentage')::numeric >= 6.5 or 
                  (SQ.form_data->'lipids'->0->>'hdl')::numeric <= 40 or 
                  (SQ.form_data->'lipids'->0->>'ldl')::numeric >= 130 or 
                  (SQ.form_data->'lipids'->0->>'triglycerides')::numeric >= 150 or 
                  (SQ.form_data->'lipids'->0->>'cholesterol')::numeric >=200
                ) and 
                (
                  (SQ.determination_meta->'categoryRisks'->'lifestyleAndWellbeingAddedRisk')::boolean = TRUE or 
                  (SQ.determination_meta->'categoryRisks'->'foodNutritionInsecurityAddedRisk')::boolean = TRUE
                )
                then 'medium_risk'
              when (SR.source_data->>'CAFD_RISK')::text = 'T' then 'medium_risk'
              when SQ.determination_code::text is null then NULL 
              else SQ.determination_code::text end as determination_code,
            SQ.determination_meta->'categoryRisks'->'medicalAddedRisk' as medicalAddedRisk,
            SQ.determination_meta->'categoryRisks'->'lifestyleAndWellbeingAddedRisk' as lifestyleAndWellbeingAddedRisk,
            SQ.determination_meta->'categoryRisks'->'foodNutritionInsecurityAddedRisk' as foodNutritionInsecurityAddedRisk,
            -- inpatient visit
            (SQ.form_data->'recent_inpatient_yn' -> 'value')::text as recent_inpatient_yn,
            (SQ.form_data->'recent_inpatient_facility_type' -> 'value')::text as recent_inpatient_facility_type,
            FR.recent_inpatient_admission_reason_list,
            SQ.determination_meta->'factorRisks'->'recentInpatientAddedRisk' as recentInpatientAddedRisk,
            SQ.form_data->'recent_inpatient_date_of_discharge' as recent_inpatient_date_of_discharge,
            (SR.source_data->>'CAFD_DISCHARGE_PLAN')::text as referral_discharge_plan_with_MTM,
            (SR.source_data->>'CAFD_HEART')::text as referral_congestive_heart_failure_stages_c_or_d,
            (SR.source_data->>'CAFD_KIDNEY')::text as referral_chronic_kidney_disease_stages_3_or_4,
            (SR.source_data->>'CAFD_DISCHARGE')::text as referral_member_recently_discharged_from_hospital_or_nursing_fac,
            (SR.source_data->>'CAFD_RISK')::text as referral_member_high_risk_hospital_or_nursing_fac_placement,
            (SR.source_data->>'CAFD_DIET')::text as referral_member_on_special_diet,
            (SR.source_data->>'CAFD_DIET_DESC')::text as referral_member_on_special_diet_description,
            case when lower((SR.source_data->>'CAFD_DIET_DESC')::text) like '%low sodium%' then True else False end as low_sodium_flag,
            (SR.source_data->>'CAFD_DELIVERY')::text as referral_member_receive_other_meal_delivery_services_from_local_state_or_federally_funded_program,
            (SR.source_data->>'CAFD_FRIDGE')::text as referral_member_has_fridge,
            (SR.source_data->>'CAFD_REHEAT')::text as referral_member_has_way_to_safely_reheat_meals,
            (SR.source_data->>'CAFD_COORD')::text as member_has_extensive_care_coordination_needs,
            (SR.source_data->>'CAFD_COORD_DESC')::text as care_coordination_needs_desc,
            (SR.source_data->>'DIABETES')::text as DIABETES_A1C_9_PLUS,
            -- conditions/biometrics
            (SQ.form_data->'weight'->0->>'pounds')::numeric as weight,
            (SQ.form_data->'weight'->0->>'date')::date as weight_date,
            (SQ.form_data->>'height_feet')::numeric as height_feet,
            (SQ.form_data->>'height_inches')::numeric as height_inches,
            (SQ.determination_meta->'calculatedValues'->>'bmi')::numeric as bmi,
            SQ.determination_meta->'factorRisks'->'bmiAddedRisk' as bmiAddedRisk,
            (SQ.form_data->'a1c'->0->>'percentage')::numeric as a1c,
            (SQ.determination_meta->'factorRisks'->'a1cAddedRisk') as a1cAddedRisk,
            (SQ.form_data->'lipids'->0->>'hdl')::numeric as hdl,
            SQ.determination_meta->'factorRisks'->'lipidsHdlAddedRisk' as lipidsHdlAddedRisk,
            (SQ.form_data->'lipids'->0->>'ldl')::numeric as ldl,
            SQ.determination_meta->'factorRisks'->'lipidsLdlAddedRisk' as lipidsLdlAddedRisk,
            (SQ.form_data->'lipids'->0->>'triglycerides')::numeric as triglycerides,
            SQ.determination_meta->'factorRisks'->'lipidsTriglyceridesAddedRisk' as lipidsTriglyceridesAddedRisk,
            (SQ.form_data->'lipids'->0->>'cholesterol')::numeric as cholesterol,
            SQ.determination_meta->'factorRisks'->'lipidsCholesterolAddedRisk' as lipidsCholesterolAddedRisk,
            SQ.determination_meta->'factorRisks'->'lipidsAddedRisk' as lipidsAddedRisk,
            SQ.determination_meta->'factorRisks'->'medicationsAddedRisk' as medicationsAddedRisk,
            FME.medications_list,
            (SQ.form_data->'blood_pressure'->0->>'systolic')::numeric as systolic,
            SQ.determination_meta->'factorRisks'->'systolicBloodPressureAddedRisk,' as systolicBloodPressureAddedRisk,  
            (SQ.form_data->'blood_pressure'->0->>'diastolic')::numeric as diastolic,
            SQ.determination_meta->'factorRisks'->'diastolicBloodPressureAddedRisk,' as diastolicBloodPressureAddedRisk,
            FM.medical_conditions_list,
            SQ.determination_meta->'factorRisks'->'medicalConditionsAddedRisk' as medicalConditionsAddedRisk,
            -- activities of daily living
            (SQ.form_data->'health_limitations' -> 'value')::text as health_limitations,
            SQ.determination_meta->'factorRisks'->'healthLimitationsAddedRisk' as healthLimitationsAddedRisk,
            (SQ.form_data->'grocery_payment_methods' ->0->> 'value')::text as grocery_payment_methods_value,
            SQ.determination_meta->'factorRisks'->'groceryPaymentMethodsAddedRisk' as groceryPaymentMethodsAddedRisk,
            (SQ.form_data->'friends_and_family_support' -> 'value')::text as friends_and_family_support,
            SQ.determination_meta->'factorRisks'->'friendsAndFamilySupportAddedRisk' as friendsAndFamilySupportAddedRisk,
            -- food/nutrition insecurity
            (SQ.form_data->'food_quality_in_household' -> 'value')::text as food_quality_in_household,
            SQ.determination_meta->'factorRisks'->'foodQualityInHouseholdAddedRisk' as foodQualityInHouseholdAddedRisk,
            (SQ.form_data->'wasted_food_with_no_money' -> 'value')::text as wasted_food_with_no_money,
            SQ.determination_meta->'factorRisks'->'wastedFoodWithNoMoneyAddedRisk' as wastedFoodWithNoMoneyAddedRisk,
            (SQ.form_data->'worried_money_would_run_out' -> 'value')::text as worried_money_would_run_out,
            SQ.determination_meta->'factorRisks'->'worriedMoneyWouldRunOutAddedRisk' as worriedMoneyWouldRunOutAddedRisk,
            (SQ.form_data->'how_hard_to_get_healthy_foods' -> 'value')::text as how_hard_to_get_healthy_foods,
            SQ.determination_meta->'factorRisks'->'howHardToGetHealthyFoodsAddedRisk' as howHardToGetHealthyFoodsAddedRisk,
            -- Food Sensitivities and allergies
            -- array_to_string(string_to_array(array_to_string(cuisine_preferences_list, ', '), ','), ',') AS cuisine_preferences_list,
            cuisine_preferences_list, --list out cuisine preferences in message
            -- list out food sensitivities in message, lactose -> 'Lactose free', nonceliac_gluten -> 'Gluten Free' in mechanically altered diet
            food_sensitivities_list,
            array_replace(food_allergies_list,'tree_nut','treenut') as food_allergies_list, -- sesame, also map wheat to 'Wheat'
            diet_types_list, --Kosher, Vegan, Keto
            (SQ.form_data->'recommendations_for_food_vendor_for_member') as dietitian_recommendation,
            (SQ.form_data->'prefers_grocery_delivery'->'value')::text as prefers_grocery_delivery,
            (SQ.form_data->'meal_type_preference'->'value')::text as meal_type_preference
            --full determination_meta and form_data
            -- determination_meta
            -- form_data,
            -- SR.source_data
          FROM telenutrition.schedule_referral SR
          LEFT JOIN telenutrition.schedule_patient SP ON SP.identity_id=SR.identity_id
          LEFT JOIN telenutrition.clinical_encounter_screening_questionnaire SQ ON SQ.patient_id=SP.patient_id
          LEFT JOIN form_recent_inpatient_visit_reasons FR on SQ.patient_id = FR.patient_id
          LEFT JOIN form_medical_conditions FM on SQ.patient_id = FM.patient_id
          LEFT JOIN form_medications FME on SQ.patient_id = FME.patient_id
          LEFT JOIN form_cuisine_preferences FCP on SQ.patient_id = FCP.patient_id
          LEFT JOIN form_food_sensitivities FFS on SQ.patient_id = FFS.patient_id
          LEFT JOIN form_food_allergies FFA on SQ.patient_id = FFA.patient_id
          LEFT JOIN form_diet_types FDT on SQ.patient_id = FDT.patient_id
        WHERE
          SR.account_id=61
          AND SR.referral_status='completed'
          AND SR.referral_id=${referral.referralId}
          AND SQ.questionnaire_type='risk_assessment'
        ) as questionnaire_and_referral_data
      ) as fbm
) as food_vendor_selection
where risk_assessment_take_number <= 1
    `)

    if (rows.length === 0) {
      logger.error(context, TAG, `skipping referral: ${referral.referralId} due to missing questionnaire data`, {
        referral_id: referral.referralId,
      })

      const action: ReferralAction = {
        action_type: ReferralActionType.ERROR,
        action_date: DateTime.now().toISODate(),
        action_reason: ReferralActionReasons.MISSING_QUESTIONNAIRE,
      }

      const updateResult = await updateScheduleReferralAction(context, referral.referralId, action)

      if (updateResult.isErr()) {
        logger.error(context, TAG, 'Error updating referral.', {
          referral_id: referral.referralId,
          error: updateResult.error,
        })

        return err(updateResult.error)
      }

      return ok({
        referralId: referral.referralId,
        actions: [action]
      })
    }

    const {
      patient_id,
      description,
      message,
      risk_score,
      food_benefit,
      service_date,
      mechanical_altered_diet,
      diagnosis_icd10,
      duration,
      frequency,
      food_allergies_list,
      dietitian_recommendation,
      has_member_received_24_weeks_or_more_medically_tailored_meals_f: food_benefit_limit_reached,
    } = rows[0]

    // get allergies
    const allergies = await fetchAllergies(context, referral.identityId)

    // determine vendor from first questionnaire
    const { rows: vendorRows } = await pool.query(`
      select (form_data->>'vendor_preference')::text as vendor 
      from telenutrition.clinical_encounter_screening_questionnaire 
      where questionnaire_type = 'risk_assessment' and patient_id = ${patient_id}
      order by created_at asc 
      limit 1
    `);

    const { rows: vegetarianRows } = await pool.query(`
      select 
        case 
          when lower((source_data->>'CAFD_DIET_DESC')::text) like '%vegetarian%' then True 
          else False 
        end as vegetarian_flag 
      from telenutrition.schedule_referral 
      where patient_id = ${patient_id}
    `);

    const foodBenefitMapping = {
      mtm: 'prepared_meals',
      grocery_box: 'grocery_boxes'
    };

    const vendorPreferenceData: VendorPreferenceData = {
      foodBenefit: foodBenefitMapping[food_benefit] ?? food_benefit,
      vendorPreference: vendorRows[0]?.vendor,
      vegetarianFlag: vegetarianRows[0]?.vegetarian_flag,
    }

    const vendorResult = await determineVendor(context, AccountIds.CalOptima, vendorPreferenceData);

    if (vendorResult.isErr()) {
      logger.error(context, TAG, 'Error determining vendor.', {
        referral_id: referral.referralId,
        error: vendorResult.error,
      })

      return err(vendorResult.error)
    }

    const vendor = vendorResult.value;

    const data: DecisionResult = {
      vendor,
      description,
      message,
      allergies: food_allergies_list || allergies || null,
      risk_score,
      food_benefit,
      service_date,
      mechanical_altered_diet,
      diagnosis_icd10,
      duration,
      frequency,
      dietitian_recommendation,
      food_benefit_limit_reached,
    }

    logger.info(context, TAG, `decision result.`, {
      referral_id: referral.referralId,
      data,
    })

    const referralConfig = config.common.referrals?.find(r => r.source === 'cal-optima')

    if (!referralConfig) {
      logger.error(context, TAG, 'Referral config is required.', {
        referral,
      })

      return err(ErrCode.INVALID_CONFIG)
    }

    const validationResult = await validateDecisionResult(data, referralConfig)

    if (validationResult.isErr()) {
      logger.error(context, TAG, 'Referral design result validation error.', {
        referral_id: referral.referralId,
        data,
      })

      const updateResult = await updateScheduleReferralAction(context, referral.referralId, {
        action_type: ReferralActionType.ERROR,
        action_date: DateTime.now().toISODate(),
        action_reason: validationResult.error,
        data,
      })

      if (updateResult.isErr()) {
        logger.error(context, TAG, 'Error updating referral.', {
          referral_id: referral.referralId,
        })
      }

      return err(ErrCode.INVALID_DATA)
    }

    const decisionResult = validationResult.value

    let action: ReferralAction

    const foodVendors = referralConfig.cal_optima_connect.food_vendors

    if (isActionableDecisionResult(decisionResult)) {
      const createResult = await createReferral(context, {
        patientId: referral.patientExternalId,
        serviceId: referral.referralExternalId,
        foodVendorOption: foodVendors[decisionResult.vendor].option,
        riskScore: decisionResult.risk_score,
        diagnosisIcd10: decisionResult.diagnosis_icd10 ?? undefined,
        foodBenefit: decisionResult.food_benefit,
        frequency: decisionResult.frequency,
        duration: decisionResult.duration,
        allergies: decisionResult.allergies ?? undefined,
        mechanicalAlteredDiet: decisionResult.mechanical_altered_diet,
        dietitianRecommendation: decisionResult.dietitian_recommendation ?? undefined,
        serviceDate: decisionResult.service_date,
        description: decisionResult.description ?? undefined,
        message: decisionResult.message ?? undefined,
      }, options)

      if (createResult.isErr()) {
          logger.error(context, TAG, 'Error creating CalOptima Connect referral.')

          action = {
            action_type: ReferralActionType.ERROR,
            action_date: DateTime.now().toISODate(),
            action_reason: typeof createResult.error === 'string' 
              ? createResult.error 
              : `Error code: ${ErrCode[createResult.error]}`,
            data,
          }
      }
      else {
        action = {
          action_type: ReferralActionType.FOOD_REFERRAL,
          action_date: DateTime.now().toISODate(),
          data,
        }

        logger.info(context, TAG, 'Outbound referral created.', {
          referral,
          action,
        })
      }
    }
    else {
      if (decisionResult.food_benefit_limit_reached === 'Yes') {
        action = {
          action_type: ReferralActionType.NO_ACTION,
          action_date: DateTime.now().toISODate(),
          action_reason: 'food_benefits_limit_reached',
          data,
        }
      } else if (decisionResult.risk_score === RISK_SCORE_TYPES.low) {
        action = {
          action_type: ReferralActionType.NO_ACTION,
          action_date: DateTime.now().toISODate(),
          action_reason: 'low_risk',
          data,
        }
      } else {
        action = {
          action_type: ReferralActionType.ERROR,
          action_date: DateTime.now().toISODate(),
          action_reason: 'invalid_decision_result',
          data,
        }
      }
    }

    // const action = JSON.stringify({
    //   action_type: 'submit_form_mtm',
    //   action_date: '2024-05-22',
    //   form_external_id: '15871537',
    //   data:{
    //     vendor: 'mealsonwheels',
    //     description: 'Member will be receiving Medically Tailored Meals',
    //     message: 'Please choose food in accordance to the conditions in the referral below',
    //     risk_score: 'high',
    //     food_benefit: 'mtm',
    //     mechanical_altered_diet: 'renal_friendly',
    //     diagnosis_icd10: 'Z73.6'
    //   }     
    // })

    await updateScheduleReferralAction(context, referral.referralId, action)

    //check if referral was successful and log accordingly
    if (action.action_type === ReferralActionType.FOOD_REFERRAL) {
      logger.info(context, TAG, 'Referral successfully created.', {
        referral_id: referral.referralId,
        action_type: action.action_type,
      })
    } else {
      logger.info(context, TAG, 'Referral not created.', {
        referral_id: referral.referralId,
        action_type: action.action_type,
      })
    }

    return ok({
      referralId: referral.referralId,
      actions: [action],
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ReauthData {
  service: CalOptimaService,
  referral: CalOptimaReferral,
  originalReferralId: number,
}

type ReferralActionReauthorizationData = DecisionResult;

export async function transformReauthDataToActionData(reauthData: ReauthData): Promise<ReferralActionReauthorizationData> {
  return {
    vendor: reauthData.referral.foodVendorName ?? null,
    description: reauthData.referral.description ?? null,
    message: reauthData.referral.message ?? null,
    risk_score: reauthData.referral.riskScore,
    food_benefit: reauthData.referral.foodBenefit,
    service_date: DateTime.fromFormat(reauthData.referral.serviceDate, 'M/d/yy').toISODate(), // from format 9/23/24
    mechanical_altered_diet: reauthData.referral.mechanicalAlteredDiet,
    diagnosis_icd10: reauthData.referral.diagnosisIcd10 ?? null,
    duration: reauthData.referral.duration,
    frequency: reauthData.referral.frequency,
    allergies: reauthData.referral.allergies ?? null,
    dietitian_recommendation: reauthData.referral.dietitianRecommendation ?? null,
    food_benefit_limit_reached: null, // we don't have this data as of now
  }
}

export async function performReferralReauthActions(context: IContext, data: ReauthData, options?: PerformReferralActionsOptions): Promise<Result<PerformReferralActionsResult, ErrCode>> {
  const { logger } = context;

  const TAG = [...MTAG, 'performReferralReauthActions'];

  try {
    logger.info(context, TAG, `Perform any referral reauthorization actions.`, {
      cin: data.service.cin
    });

    let action: ReferralAction;

    const reauthResult = await createReauthReferral(context, data, options);

    const referralActionReauthData = await transformReauthDataToActionData(data);

    if (reauthResult.isErr()) {
      if (typeof reauthResult.error === 'number') {
        logger.error(context, TAG, 'Error creating CalOptima Connect reauthorization referral.');

        return err(reauthResult.error);
      }
      else {
        action = {
          action_type: ReferralActionType.ERROR,
          action_date: DateTime.now().toISODate(),
          action_reason: reauthResult.error,
          data: referralActionReauthData,
        };
      }
    } else {
      action = {
        action_type: ReferralActionType.FOOD_REAUTHORIZATION,
        action_date: DateTime.now().toISODate(),
        data: referralActionReauthData,
      };
    }

    await updateScheduleReferralAction(context, data.originalReferralId, action);

    return ok({
      referralId: -1,
      actions: [action],
    });
  }
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export default {
  performReferralActions,
  performReferralReauthActions,
}