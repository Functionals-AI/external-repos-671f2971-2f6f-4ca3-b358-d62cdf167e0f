import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
DROP TABLE IF EXISTS public.clean_survey_response;

CREATE TABLE public.clean_survey_response AS 
WITH all_data as (
  SELECT
    response_id,
    response_time,
    user_id,
    survey,
    question,
    regexp_replace( btrim(cast(response as varchar(4096)), '"[]'), '","' , ', ') AS response,
    row_number() OVER (
      PARTITION BY user_id, question
      ORDER BY response_time DESC
    ) AS row_num,
    source
  FROM fq_foodapp_tenants.survey_response
),
recent_survey_response_cte as (
  SELECT
    response_id,
    response_time,
    user_id,
    survey,
    question,
    response,
    source
  FROM all_data where row_num = 1
)
SELECT
  response_id,
  response_time,
  user_id,
  survey,
  question,
  CASE 
    WHEN question='sitting' and response='~day' Then '8.0'
    WHEN question='sitting' and response='0.75_day' Then '6.0'
    WHEN question='sitting' and response='~0.5_day' Then '4.0'
    WHEN question='sitting' and response='<0.5_day' Then '2.0'
    WHEN question='strenuous_exercise' and response <> '' and cast(response as int) >20 Then '20'
    WHEN question='moderate_exercise' and response <> '' and cast(response as int) >20 Then '20'
    WHEN question='mild_exercise' and response <> '' and cast(response as int) >30 Then '30'
    WHEN question='sleep_amount' and response='<5_hr' Then '4-4.9hr'
    WHEN question='sleep_amount' and response='5-6.9hr' Then '6-6.9hr'
    WHEN question='sleep_amount' and response='7-8.9hr' Then '8-8.9hr'
    WHEN question='relationship' and response like '%relationship%' Then 'in_a_relationship'
    WHEN question='relationship' and (response != 'single' AND response != 'married' AND response not like '%relationship%') Then 'other'
    WHEN question='sleep_quality' and response='rarely' THEN 'sometimes'
    WHEN question='pleasure' and response='more_than_half_of_week' THEN 'more_than_half_the_days'
    ELSE response end,
  source
FROM recent_survey_response_cte
;
    `
  })
}
