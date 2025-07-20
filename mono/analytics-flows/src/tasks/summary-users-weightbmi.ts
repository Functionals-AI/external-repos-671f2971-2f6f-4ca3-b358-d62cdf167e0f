import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `

 DROP TABLE IF EXISTS public.summary_users_weight;
	CREATE TABLE public.summary_users_weight AS
        WITH awt AS
        (
        SELECT user_id, weight, date,
               first_value(weight) OVER (PARTITION BY user_id ORDER BY date asc ROWS between UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as first_weight,
               last_value(weight) OVER (PARTITION BY user_id ORDER BY date asc ROWS between UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_weight,
               count(user_id) OVER (PARTITION BY user_id ) as count_rec
        FROM foodapp.hc_user_biomarkers
        WHERE weight is not null
        )
        SELECT user_id, first_weight, (CASE WHEN count_rec>1 THEN last_weight ELSE NULL END) AS "latest_weight"
        FROM awt
        GROUP BY 1,2,3;

	DROP TABLE IF EXISTS public.summary_users_bmi;
        CREATE TABLE public.summary_users_bmi AS
        WITH abmi AS
	(
	SELECT user_id, bmi, date,
	       first_value(bmi) OVER(PARTITION BY user_id ORDER BY date asc ROWS between UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as first_bmi,
	       last_value(bmi) OVER(PARTITION BY user_id ORDER BY date asc ROWS between UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as latest_bmi,
	       count(user_id) OVER(PARTITION BY user_id) as cnt_rec
	FROM foodapp.hc_user_biomarkers
	WHERE bmi is not null 
	GROUP BY user_id, bmi, date
	)
	SELECT user_id, 
	       first_bmi,
	       CASE WHEN cnt_rec>1 THEN latest_bmi ELSE NULL END as latest_bmi
	FROM abmi
	GROUP BY 1,2,3;
  `
  })
}
