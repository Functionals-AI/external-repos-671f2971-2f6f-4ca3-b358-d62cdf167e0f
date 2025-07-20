import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
BEGIN TRANSACTION; 

DROP VIEW IF EXISTS public.summary_org_enrollment_count_vw;

DROP TABLE IF EXISTS public.summary_org_enrollment;

CREATE TABLE summary_org_enrollment AS
  SELECT gu.id AS user_id, smo.member_org_name,  date_trunc('day',gu.create_date) AS enrolled_date, gue.lob AS lob, gue.plan_type AS plan_type, smo.member_org_id AS member_org_id
  FROM foodapp.go_users gu
  LEFT JOIN summary_member_organization smo ON smo.organization_id=gu.organization_id AND coalesce(smo.suborganization_id,'')=coalesce(gu.suborganization_id,'')
  LEFT JOIN foodapp.go_users_eligible gue ON gu.eligible_id=gue.id
  LEFT JOIN foodapp.go_test_users gtu ON gtu.user_id = gu.id
  WHERE gtu.user_id IS NULL
;

CREATE VIEW summary_org_enrollment_count_vw as 
  SELECT member_org_id, member_org_name, count(*) AS enrollees_count 
  FROM public.summary_org_enrollment 
  GROUP BY member_org_id, member_org_name
;
COMMIT TRANSACTION;
`
  })
}
