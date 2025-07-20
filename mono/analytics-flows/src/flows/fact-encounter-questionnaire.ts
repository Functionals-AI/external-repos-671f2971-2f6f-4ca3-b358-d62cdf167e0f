import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
  	rate: '24 hours', 
    startAt: 'FactEncounterQuestionnaire',
    states: {
      FactEncounterQuestionnaire: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_encounter_questionnaire;
            CREATE TABLE analytics.fact_encounter_questionnaire AS
-- FFD QUESTIONNAIRE FACT TABLE: fact_encounter_questionnaire
SELECT
  encounter_id,
  patient_id,
  appointment_id,
  provider_id,
  encounter_status,
  raw_data,
  json_extract_path_text(raw_data, 'specialized_diet_type') AS specialized_diet_type,
  json_extract_path_text(raw_data, 'food_sensitivity_intolerance') AS food_sensitivity_intolerance,
  json_extract_path_text(raw_data, 'food_allergy') AS food_allergy,
  json_extract_path_text(raw_data, 'medical_conditions') AS medical_conditions,
  json_extract_path_text(raw_data, 'medications_list') AS medications_list,
  json_extract_path_text(raw_data, 'vitamin_supplements') AS vitamin_supplements,
  json_extract_path_text(raw_data, 'cooking_responsibility') AS cooking_responsibility,
  json_extract_path_text(raw_data, 'meal_preparation_reason') AS meal_preparation_reason,
  json_extract_path_text(raw_data, 'current_work_situation') AS current_work_situation,
  json_extract_path_text(raw_data, 'cooking_frequency_at_home') AS cooking_frequency_at_home
FROM fq_common_telenutrition.clinical_encounter
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
