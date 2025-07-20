import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = 'analytics.warehouse.deploy.completed'

export default workflow(function(config) {
  return {
  	rate: '24 hours', 
    event: {
      bus: EVENT_BUS,
      source: [ 'foodsmart' ],
      detailType: [
        EVENT_TYPE
      ]
    },
    startAt: 'FactFoodInsecurity',
    states: {
      FactFoodInsecurity: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_food_insecurity;
            CREATE TABLE analytics.fact_member_food_insecurity AS
            with food_insecurity as
(
select
sub.measure_date
,sub.patient_id
,sub.foodapp_user_id
,sub.question
,sub.response
,sub.response_numerical
,sub.encounter_id
,row_number() over (partition by 
case when sub.patient_id is not null 
then 'patient_' || sub.patient_id
else 'foodapp_' || sub.foodapp_user_id
end, sub.measure_date, sub.question order by sub.response_numerical desc) as rn
from
(
--Food security Foodapp responses
select
sr.response_time :: date as measure_date
,p.patient_id
,sr.user_id as foodapp_user_id
,sr.question
,regexp_replace(sr.response, '[^a-zA-Z]', '') as response
,case 
when regexp_replace(sr.response, '[^a-zA-Z]', '') = 'often' then 3
when regexp_replace(sr.response, '[^a-zA-Z]', '') = 'sometimes' then 2
when regexp_replace(sr.response, '[^a-zA-Z]', '') = 'never' then 1
end as response_numerical
,null as encounter_id
from fq_foodapp_tenants.survey_response sr
inner join fq_foodapp_tenants.go_users gu
on sr.user_id = gu.id
left join fq_common_telenutrition.schedule_patient p
on gu.ta_identity_id = p.identity_id

where sr.question in ('money_worries','food_worries')
and upper(sr.response) not like '%NOTELL%'


union

--FFD food worries
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,'food_worries' as question
,nullif(json_extract_path_text(raw_data, 'food_shortage_worry_frequency'), '') :: varchar as response
,case 
when nullif(json_extract_path_text(raw_data, 'food_shortage_worry_frequency'), '') :: varchar = 'often' then 3
when nullif(json_extract_path_text(raw_data, 'food_shortage_worry_frequency'), '') :: varchar = 'sometimes' then 2
when nullif(json_extract_path_text(raw_data, 'food_shortage_worry_frequency'), '') :: varchar = 'never' then 1
end as response_numerical
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.id

where 0 = 0 
--and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time
--and ce.encounter_date :: date between ((current_date :: date) - 730) and current_date :: date
and nullif(json_extract_path_text(raw_data, 'food_shortage_worry_frequency'), '') is not null

union

--FFD money worries
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,'money_worries' as question
,nullif(json_extract_path_text(raw_data, 'food_security_last_12_months'), '') :: varchar as response
,case 
when nullif(json_extract_path_text(raw_data, 'food_security_last_12_months'), '') :: varchar = 'often' then 3
when nullif(json_extract_path_text(raw_data, 'food_security_last_12_months'), '') :: varchar = 'sometimes' then 2
when nullif(json_extract_path_text(raw_data, 'food_security_last_12_months'), '') :: varchar = 'never' then 1
end as response_numerical
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.id

where 0 = 0 
--and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time
--and ce.encounter_date :: date between ((current_date :: date) - 730) and current_date :: date
and nullif(json_extract_path_text(raw_data, 'food_security_last_12_months'), '') is not null


union
  
--CalO assessment food worries
select
cesq.created_at :: date as measure_date
,cesq.patient_id
,gu.id as foodapp_user_id
,'food_worries' as question
,nullif(json_extract_path_text(cesq.form_data, 'wasted_food_with_no_money','value'),'') :: varchar as response
,case 
when nullif(json_extract_path_text(cesq.form_data, 'wasted_food_with_no_money','value'),'') :: varchar = 'often' then 3
when nullif(json_extract_path_text(cesq.form_data, 'wasted_food_with_no_money','value'),'') :: varchar = 'sometimes' then 2
when nullif(json_extract_path_text(cesq.form_data, 'wasted_food_with_no_money','value'),'') :: varchar = 'never' then 1
end as response_numerical
,cesq.encounter_id
from fq_common_telenutrition.clinical_encounter_screening_questionnaire cesq
left join fq_common_telenutrition.schedule_patient p
on cesq.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0
and coalesce(nullif(json_extract_path_text(cesq.form_data, 'wasted_food_with_no_money','value'),''),'prefer_not_to_say') != 'prefer_not_to_say'
  
union

--CalO assessment money worries
select
cesq.created_at :: date as measure_date
,cesq.patient_id
,gu.id as foodapp_user_id
,'money_worries' as question
,nullif(json_extract_path_text(cesq.form_data, 'worried_money_would_run_out','value'),'') :: varchar as response
,case 
when nullif(json_extract_path_text(cesq.form_data, 'worried_money_would_run_out','value'),'') :: varchar = 'often' then 3
when nullif(json_extract_path_text(cesq.form_data, 'worried_money_would_run_out','value'),'') :: varchar = 'sometimes' then 2
when nullif(json_extract_path_text(cesq.form_data, 'worried_money_would_run_out','value'),'') :: varchar = 'never' then 1
end as response_numerical
,cesq.encounter_id
from fq_common_telenutrition.clinical_encounter_screening_questionnaire cesq
left join fq_common_telenutrition.schedule_patient p
on cesq.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0
and coalesce(nullif(json_extract_path_text(cesq.form_data, 'worried_money_would_run_out','value'),''),'prefer_not_to_say') != 'prefer_not_to_say'
) sub
)

select
measure_date
,patient_id
,foodapp_user_id
,question
,response
,response_numerical
,encounter_id
from food_insecurity
where rn = 1
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
