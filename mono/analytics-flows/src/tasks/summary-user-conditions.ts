import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    	drop table if exists public.summary_users_conditions;
	create table public.summary_users_conditions AS
	 WITH conds AS (
		SELECT user_id, question, JSON_EXTRACT_ARRAY_ELEMENT_TEXT(response, seq.i) AS cond
		FROM foodapp.survey_response r, seq_0_to_100 AS seq
		WHERE  (question ilike '%conditions')
		AND seq.i < JSON_ARRAY_LENGTH(response)
		-- AND survey ilike 'nutrition%exercise'
		UNION ALL
		SELECT user_id, question, ''
		FROM foodapp.survey_response r
		WHERE (question ilike '%conditions')
		AND response = '[]'
	      )
	      SELECT DISTINCT
		conds.user_id,
		CASE
		  WHEN cond IN ('diabetes', 'type_1_diabetes', 'type_2_diabetes') THEN 'Diabetes'
		  WHEN cond IN ('blood_pressure') THEN 'High Blood Pressure'
		  WHEN cond IN ('cholesterol', 'high_ldl_cholesterol', 'high_total_cholesterol') THEN 'High Cholesterol'
		  WHEN cond IN ('high_triglycerides') THEN 'High Triglycerides'
		  WHEN cond IN ('low_hdl_cholesterol') THEN 'Low Cholesterol'
		  WHEN cond = '' THEN 'No Response'
		  WHEN cond IN ('no_conditions') THEN 'No Conditions'
		  WHEN cond IN ('not_sure') THEN 'Not Sure'
		  WHEN cond IN ('pre_diabetes') THEN 'Pre-Diabetes'
		  ELSE 'Unexpected Condition!!'
		END AS condition
	      FROM
		conds;

	drop table if exists public.summary_users_conditions_zmed;
	CREATE TABLE public.summary_users_conditions_zmed AS
	SELECT
		user_id,
		LISTAGG(DISTINCT condition, ' | ') WITHIN GROUP (ORDER BY condition) AS all_user_conditions,
		MAX(
		  CASE
		    WHEN condition IN ('Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Pre-Diabetes') THEN 3
		    WHEN condition IN ('High Triglycerides', 'Low Cholesterol', 'No Conditions') THEN 2
		    WHEN condition IN ('No Response', 'Not Sure') THEN 1
		    ELSE 0
		  END) AS has_z_medical_condition,
		SUM(
		  CASE
		    WHEN condition IN ('Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Pre-Diabetes') THEN 1
		    ELSE 0
		  END) AS num_z_medical_conditions
	      FROM
		public.summary_users_conditions
	      GROUP BY user_id;
    `
  })
}
