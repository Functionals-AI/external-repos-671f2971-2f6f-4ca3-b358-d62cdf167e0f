import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '0 15 * * ? *',
    startAt: 'ReportingFoodInsecurityView',
    states: {
      ReportingFoodInsecurityView: Redshift.query({
        sql: `  -- Create reporting_food_insecurity_view table, only if it doesn't exist
            DROP TABLE IF EXISTS c360.reporting_food_insecurity_view;

            CREATE TABLE c360.reporting_food_insecurity_view DISTSTYLE KEY DISTKEY(user_id) SORTKEY(user_id)  AS
            (
              WITH food_insecurity_responses AS (
              SELECT user_id, DATE_TRUNC('day',response_time) as response_date, question, response, (response != '["NOTELL"]') as answered_food_security
              FROM public.survey_response
              WHERE question IN( 'money_worries','food_worries')
              ),
              food_security_piv as(
              SELECT user_id, response_date,  
              SUM( CASE WHEN question = 'money_worries' AND response in ('["sometimes"]', '["often"]') 
                  THEN 1 
                  ELSE 0 
                   END) AS money_worries,  
              SUM(CASE WHEN question = 'food_worries' AND response in ('["sometimes"]', '["often"]') 
                THEN 1 
                ELSE 0 
                   END) AS food_worries,
                    SUM(CASE WHEN  response != '["NOTELL"]' 
                THEN 1 
                ELSE 0 
                  END) AS answered_food_security,
                    row_number() over (partition by user_id order by response_date) as response_rank
              FROM food_insecurity_responses
              GROUP BY 1,2)
            SELECT  user_id, response_date, (money_worries + food_worries > 0 ) AS is_food_insecure,  (answered_food_security > 0) AS answered_food_security
            FROM food_security_piv
            );
          `,
        next: 'ReportingExpensiveFoodView',
      }),
      ReportingExpensiveFoodView: Redshift.query({
        sql: `  -- Create reporting_expensive_food_view table, only if it doesn't exist
            DROP TABLE IF EXISTS c360.reporting_expensive_food_view;

            CREATE TABLE c360.reporting_expensive_food_view DISTSTYLE KEY DISTKEY(user_id) SORTKEY(user_id, thinks_food_is_expensive)  AS
            (
            with food_insecurity_responses as (
                      select user_id, response_time, response, row_number() over (partition by user_id order by response_time) as response_rank
                      from public.clean_survey_response
                      where question = 'expensive_food'
                      )
                      select *, (response in ('sometimes', 'often')) as thinks_food_is_expensive
                      from food_insecurity_responses
                      where response_rank = 1 
            );
          `,
        next: 'ReportingEbtCard',
      }),
      ReportingEbtCard: Redshift.query({
        sql: `  -- Create reporting_ebt_card table, only if it doesn't exist
            DROP TABLE IF EXISTS c360.reporting_ebt_card;

            CREATE TABLE c360.reporting_ebt_card DISTSTYLE KEY DISTKEY(user_id) SORTKEY(user_id, has_ebt_card)  AS
            (
            with food_insecurity_responses as (
                      select user_id, response_time, response, row_number() over (partition by user_id order by response_time) as response_rank
                      from clean_survey_response
                      where question = 'ebt_card' AND response = 'yes'
                      )
                      select *, (response = 'yes') as has_ebt_card
                      from food_insecurity_responses
                      WHERE response_rank =1
            );
        `,
        next: 'ReportingFoodSecurityChanges',
      }),
      ReportingFoodSecurityChanges: Redshift.query({
        sql: `  -- Create reporting_food_security_changes table, only if it doesn't exist
            DROP TABLE IF EXISTS c360.reporting_food_security_changes;

            CREATE TABLE c360.reporting_food_security_changes DISTSTYLE KEY DISTKEY(user_id) SORTKEY(user_id, latest_response_date)  AS
            (
              WITH food_insecurity_responses AS 
              (
                SELECT user_id, DATE_TRUNC('day',response_time) as response_date, question, response, (response != '["NOTELL"]') as answered_food_security
                FROM survey_response
                WHERE question IN( 'money_worries','food_worries')
              ),
              food_security_piv as(
                SELECT user_id, response_date,  SUM(CASE WHEN question = 'money_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS money_worries,  SUM(CASE WHEN question = 'food_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS food_worries, SUM(CASE WHEN  response != '["NOTELL"]' THEN 1 ELSE 0 END) AS answered_food_security, row_number() over (partition by user_id order by response_date) as response_rank
                FROM food_insecurity_responses
                GROUP BY 1,2),
              starting_response AS (
                SELECT user_id, response_date, (money_worries + food_worries > 0 ) AS is_food_insecure
                FROM food_security_piv
                WHERE response_rank = 1
              ),
              latest_response AS (
              SELECT user_id, (money_worries + food_worries > 0) AS is_food_insecure, max(response_date)as most_recent_date, MAX(response_rank) AS latest_response_number
              FROM food_security_piv  t1
              WHERE  response_rank = (SELECT MAX(response_rank) FROM food_security_piv WHERE food_security_piv.user_id = t1.user_id)
              GROUP BY 1,2)
              SELECT lr.user_id AS user_id, sr.is_food_insecure AS initial_food_insecure, sr.response_date AS first_response_date, DATE_TRUNC('month',sr.response_date) AS first_response_month,
                lr.is_food_insecure AS latest_food_insecure, lr.most_recent_date AS latest_response_date,
                DATE_TRUNC('month',lr.most_recent_date) AS latest_response_month, lr.latest_response_number ,
                CASE WHEN latest_response_number >1 
                  THEN true 
                  ELSE false 
                END AS has_multiple_responses,
                CASE WHEN initial_food_insecure != latest_food_insecure 
                  THEN true 
                  ELSE false 
                END AS has_status_change,
                CASE WHEN initial_food_insecure = true AND latest_food_insecure = false 
                  THEN true 
                  ELSE false 
                END as improved_food_insecurity,
                DATEDIFF(day,first_response_date,latest_response_date) AS days_between_first_last_response
              FROM starting_response AS sr
              LEFT JOIN latest_response AS lr ON lr.user_id = sr.user_id
            );
          `,
        next: 'ReportingFoodSecurityChangeDates',
      }),
      ReportingFoodSecurityChangeDates: Redshift.query({
        sql: `  -- Create reporting_food_security_change_dates table, only if it doesn't exist
            DROP TABLE IF EXISTS c360.reporting_food_security_change_dates;

            CREATE TABLE c360.reporting_food_security_change_dates DISTSTYLE KEY DISTKEY(user_id) SORTKEY(user_id, date_food_secuirty_improved)  AS
            (
              WITH food_insecurity_responses AS 
              (
                SELECT user_id, DATE_TRUNC('day',response_time) AS response_date,
                question, response, (response != '["NOTELL"]') AS answered_food_security
                FROM survey_response
                WHERE question IN( 'money_worries','food_worries')
                    ),
              food_security_piv as
              (
                      SELECT user_id, response_date,  
                SUM(CASE WHEN question = 'money_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS money_worries,
                SUM(CASE WHEN question = 'food_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS food_worries, 
                SUM(CASE WHEN  response != '["NOTELL"]' THEN 1 ELSE 0 END) AS answered_food_security, 
                ROW_NUMBER() over (PARTITION BY user_id ORDER BY response_date) AS response_rank
                      FROM food_insecurity_responses
                      GROUP BY 1,2
              ),
                    starting_response AS 
              (
                      SELECT user_id, response_date, (money_worries + food_worries > 0 ) AS is_food_insecure
                      FROM food_security_piv
                      WHERE response_rank = 1
              )
                    SELECT ar.user_id AS user_id, 
                           MIN(ar.response_date) AS date_food_secuirty_improved
                    FROM starting_response AS sr
                    LEFT JOIN food_security_piv AS ar ON ar.user_id = sr.user_id
                    WHERE DATEDIFF(day,sr.response_date,ar.response_date) >=15 
              AND ar.response_rank > 1 
              AND sr.is_food_insecure = true 
              AND (ar.money_worries + ar.food_worries >0)  = false
                    GROUP BY 1
            );
        `,
      }),
    }
  }
})
