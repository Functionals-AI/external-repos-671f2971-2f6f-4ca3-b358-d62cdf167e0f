import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
        DROP TABLE IF EXISTS public.summary_org_newproduct;
        
        CREATE TABLE public.summary_org_newproduct AS
        SELECT me.user_id::varchar, date_trunc('day',me.event_timestamp_pst) as event_date, 
               newfeature_product , soe.member_org_name
        FROM public.mapped_events me
        JOIN public.summary_org_enrollment soe ON soe.user_id=me.user_id 
        WHERE me.user_id not in (select user_id from go_test_users)
        AND me.newfeature_product IS NOT NULL
        GROUP BY 1,2,3,4;
        `
  })
}
