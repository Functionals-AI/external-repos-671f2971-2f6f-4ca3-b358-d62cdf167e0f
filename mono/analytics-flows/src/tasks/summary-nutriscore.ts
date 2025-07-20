import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
DROP TABLE IF EXISTS public.nutriscore_vw;

CREATE TABLE public.nutriscore_vw AS 
WITH ns AS (
  SELECT *, 
		row_number() OVER (PARTITION by user_id, DATE ORDER BY total_score desc) AS row_rank
		FROM public.zhei_user
)
SELECT * FROM ns WHERE row_rank = 1
;

DROP TABLE IF EXISTS public.summary_nutriscore;

CREATE TABLE public.summary_nutriscore AS
SELECT 
  user_id, date, fruits, vegetables, carb_ratio, protein_ratio, fat_ratio, sodium, hydration,
  (fruits+vegetables+carb_ratio+protein_ratio+fat_ratio+sodium+hydration) as total_score_2017
		, ((fruits+vegetables)/2+carb_ratio+protein_ratio+fat_ratio+sodium+hydration) as total_score
		, first_value (fruits+vegetables+carb_ratio+protein_ratio+fat_ratio+sodium+hydration) over (partition by user_id order by date asc rows unbounded preceding) as first_score_2017
		, first_value ((fruits+vegetables)/2+carb_ratio+protein_ratio+fat_ratio+sodium+hydration) over (partition by user_id order by date asc rows unbounded preceding) as first_score
		, lag((fruits+vegetables)/2+carb_ratio+protein_ratio+fat_ratio+sodium+hydration) over (partition by user_id order by date asc) as previous_score
		--     , total_score as total_score_bad
		, imputed
		, first_value(date) over (partition by user_id order by date asc rows unbounded preceding) first_score_date
		, row_number() over (partition by user_id order by date asc) as record_number
		, count(1) over (partition by user_id) as total_records
		, case when row_number() over (partition by user_id order by date asc) = 1 then 1 else 0 end first_record
		, case when row_number() over (partition by user_id order by date asc)  =
		count(1) over (partition by user_id) then 1 else 0 end as latest_record
		, abs(datediff('day',date,(first_value(date) over (partition by user_id order by date asc rows unbounded preceding)) )) as days_from_first_record
		, abs(datediff('day',date,(lag(date) over (partition by user_id order by date asc)) )) as days_from_previous_record
		,  months_between(date, lag(date) over (partition BY user_id ORDER BY date)) as months_from_previous_score
		,  months_between(date, first_value(date) over (partition by user_id order by date asc rows unbounded preceding)) as months_from_first_score
		, abs(datediff('day',(last_value(date) over(partition by user_id order by date asc rows between unbounded preceding and unbounded following)),
		  ( first_value(date) over (partition by user_id order by date asc rows between unbounded preceding and unbounded following)) )) as nutriquiz_lifetime
from public.nutriscore_vw;

drop table if exists public.summary_users_nutriscore_tags;

CREATE TABLE public.summary_users_nutriscore_tags AS
SELECT a.user_id, count(1) nutriquiz_takes
FROM summary_nutriscore a
GROUP BY 1
;
`
  })
}
