import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    drop table if exists public.summary_users_npscomment;
	CREATE TABLE public.summary_users_npscomment AS
	SELECT 
		"user".id AS "user.id",
		listagg(nps_response.comment,' ~ ') AS "nps_response.comment",
                listagg(nps_response.comment_recommendations,' ~ ') AS "nps_response.comment_recommendations"
	FROM public.summary_nps_response AS nps_response
	INNER JOIN foodapp.go_users  AS "user" ON nps_response.email_hash = ("user".username) 
	LEFT JOIN foodapp.go_test_users  AS go_test_users ON ("user".id) = go_test_users.user_id 
	INNER JOIN summary_member_organization AS member_organization ON (("user".organization_id || '/' || nvl("user".suborganization_id, ''))::varchar(65535)) = member_organization.member_org_id 
	WHERE ((nps_response.comment IS NOT NULL)) 
	AND ((go_test_users.user_id is not null) = false
	    AND (case when member_organization.member_org_name in ('Zipongo Team','go.Zipongo.com') then 'Free'
		      -- when member_organization.member_org_name in ('go.Zipongo.com') then 'Free'
		      when member_organization.organization_id in (13,16,29,94) then 'Test'
		      else 'Paid' end
	) in ('Paid', 'Free')
	)
	GROUP BY 1;

    `
  })
}
