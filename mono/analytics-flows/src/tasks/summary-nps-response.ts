import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
BEGIN TRANSACTION;

drop table if exists public.summary_nps_response;

CREATE TABLE public.summary_nps_response AS
SELECT * FROM qualtrics_survey_response_vw
  UNION ALL
    SELECT
      'Mobile NPS' AS campaign_type,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY response_time) || '-time' AS campaign,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY response_time) AS survey_cycle,
      username AS email_hash,
      response_time::VARCHAR AS recordeddate_raw,
      TO_TIMESTAMP(response_time, 'YYYY-MM-DD HH:MI:SS') AS response_date,
      nps AS nps_response,
      CASE
        WHEN nps IN (9,10) THEN 'Promoter'
        WHEN nps IN (7,8) THEN 'Passive'
        WHEN nps BETWEEN 0 AND 6 THEN 'Detractor'
        ELSE 'Weird'
      END AS nps_response_category,
      comment,
      null as comment_recommendations,
      null as likes_benefit
    FROM (
      SELECT
        user_id,
        response_time,
        CASE
          WHEN question = 'how_likely_to_refer' THEN JSON_EXTRACT_ARRAY_ELEMENT_TEXT(response, 0 ,true)::INT
        END AS nps,
        CASE
          WHEN
            question = 'how_likely_to_refer' AND
            LEAD(user_id, 1) OVER (PARTITION BY user_id ORDER BY response_time, response_id) = user_id AND
            LEAD(response_time, 1) OVER (PARTITION BY user_id ORDER BY response_time, response_id) = response_time AND
            LEAD(question, 1) OVER (PARTITION BY user_id ORDER BY response_time, response_id) IN ('number_one_thing_to_improve', 'what_do_better', 'what_like_best')
            THEN JSON_EXTRACT_ARRAY_ELEMENT_TEXT(LEAD(response, 1) OVER (PARTITION BY user_id ORDER BY response_time, response_id), 0 ,true)
        END AS comment
      FROM foodapp.survey_response
      WHERE survey = 'mobile-nps'
      ORDER BY 1,2
    ) a
    LEFT JOIN foodapp.go_users u ON a.user_id = u.id
    WHERE nps IS NOT null
;
COMMIT TRANSACTION;
    `
  })
}