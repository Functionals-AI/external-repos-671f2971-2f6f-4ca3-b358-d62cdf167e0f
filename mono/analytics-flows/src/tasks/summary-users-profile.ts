import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    drop table if exists public.summary_users_profile;

	CREATE TABLE public.summary_users_profile AS
	SELECT "user".id AS "user_id",
		"user".username AS "hashed_username",
		abs((DATEDIFF('year', elg.birthday,CURRENT_DATE)::int)) AS "age",
		CASE WHEN ("user".gender) ilike 'male' or ("user".gender) = 'M' THEN 'Male'
		     WHEN ("user".gender) ilike 'female' or ("user".gender) = 'F' THEN 'Female'
		     ELSE 'Unknown'
		END AS "gender",
                CASE WHEN ibzc.zip_code IN ('6629DBCD3E291378785AAD9AE7C6C840', '187217BAEC7F4AE9550ADFE65CB58CD5', 'AEDF32A2CCF9A98EA31C2EF4AB6BE167', '6B1BB0A607C7F96379B32CF407B3AF15', 'B36ADE09CA5612D33FD894118FA72EC4') THEN -1 ELSE ibzc.income_band END AS income_band,
		member_organization.member_org_name,
		member_organization.suborg_name,
		member_organization.organization_id,
		member_organization.suborganization_id,
		CASE WHEN nvl(user_nutriscore_tags.nutriquiz_takes,0) > 1 THEN 'Yes' ELSE 'No' END AS "is_nutriquiz_retaker",
		CASE WHEN user_nutriscore_tags.user_id is not null THEN 'Yes' ELSE 'No' END AS "is_nutriquiz_taker",
		nutriscore.first_score_date AS "NQ Take Date",
		nutriscore.date AS "NQ Retake Date",
		trunc(nutriscore.first_score,2) AS "first_score",
		trunc(nutriscore.total_score,2) AS "latest_score",
		trunc((nutriscore.total_score-nutriscore.first_score) /nutriscore.first_score, 2) AS "nutriscore_percent_change_from_first", 
		b.first_weight, 
		b.latest_weight, 
		d.first_bmi, 
		d.latest_bmi,
		-- nvl(user_conditions.condition, 'No NutriQuiz')  AS "user_conditions.condition"
		max(CASE WHEN condition='No Response' THEN 'Yes' ELSE 'No' END ) AS "NO RESPONSE",
		max(CASE WHEN condition='Diabetes' THEN 'Yes' ELSE 'No' END ) AS "DIABETES",
		max(CASE WHEN condition='High Blood Pressure' THEN 'Yes' ELSE 'No' END ) AS "HIGH BLOOD PRESSURE",
		max(CASE WHEN condition='High Cholesterol' THEN 'Yes' ELSE 'No' END ) AS "HIGH CHOLESTEROL",
		max(CASE WHEN condition='No Conditions' THEN 'Yes' ELSE 'No' END ) AS "NO CONDITIONS",
		max(CASE WHEN condition='High Triglycerides' THEN 'Yes' ELSE 'No' END ) AS "HIGH TRIGLYCERIDES",
		max(CASE WHEN condition='Not Sure' THEN 'Yes' ELSE 'No' END ) AS "NOT SURE",
		max(CASE WHEN condition='Pre-Diabetes' THEN 'Yes' ELSE 'No' END ) AS "PRE-DIABETES",
		max(CASE WHEN condition='Low Cholesterol' THEN 'Yes' ELSE 'No' END ) AS "LOW CHOLESTEROL",
		max(c."nps_response.comment") AS nps_comment,
                max(c."nps_response.comment_recommendations") as nps_comment_recommendations
	FROM public.summary_nutriscore AS nutriscore
	INNER JOIN foodapp.go_users  AS "user" ON nutriscore.user_id = ("user".id) 
        INNER JOIN foodapp.go_user_infos AS gui ON gui.user_id = ("user".id) 
        LEFT JOIN income_band_zip_code ibzc on gui.zip = ibzc.zip_code
	LEFT JOIN public.summary_users_weight b ON "user".id = b.user_id 
	LEFT JOIN public.summary_users_npscomment c ON "user".id = c."user.id"
	LEFT JOIN public.summary_users_bmi d ON "user".id = d."user_id"
	LEFT JOIN foodapp.go_users_eligible elg ON elg.id = "user".eligible_id
	LEFT JOIN foodapp.go_test_users  AS go_test_users ON ("user".id) = go_test_users.user_id 
	INNER JOIN public.summary_users_nutriscore_tags AS user_nutriscore_tags ON ("user".id) = user_nutriscore_tags.user_id 
	LEFT JOIN public.summary_users_conditions AS user_conditions ON ("user".id) = user_conditions.user_id 
	INNER JOIN public.summary_member_organization AS member_organization ON (("user".organization_id || '/' || nvl("user".suborganization_id, ''))::varchar(65535)) = member_organization.member_org_id 
	WHERE nutriscore.latest_record=1
	AND ((((nvl(user_conditions.condition, 'No NutriQuiz')) IS NOT NULL))) 
	AND ((go_test_users.user_id is not null) = false
	    AND (case when member_organization.member_org_name in ('Zipongo Team','go.Zipongo.com') then 'Free'
		      -- when member_organization.member_org_name in ('go.Zipongo.com') then 'Free'
		      when member_organization.organization_id in (13,16,29,94) then 'Test'
		      else 'Paid' end
	) in ('Paid', 'Free')
	)
	GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20;

    `
  })
}
