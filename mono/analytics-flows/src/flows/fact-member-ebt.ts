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
    startAt: 'FactEbt',
    states: {
      FactEbt: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_ebt;
            CREATE TABLE analytics.fact_member_ebt AS
            with ebt as
(
select
*
,row_number() over (partition by sub.patient_id, sub.foodapp_user_id, sub.measure_date order by sub.response) as rn
from
(
--Foodapp responses
select
sr.response_time :: date as measure_date
,p.patient_id
,sr.user_id as foodapp_user_id
,case when sr.response = '["yes"]'
then true else false end as response 
,null as encounter_id
from fq_foodapp_tenants.survey_response sr
inner join fq_foodapp_tenants.go_users gu
on sr.user_id = gu.id
left join fq_common_telenutrition.schedule_patient p
on gu.ta_identity_id = p.identity_id
where sr.question = 'ebt_card'
and sr.response in('["no"]','["yes"]')

union

--FFD responses
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,case when nullif(json_extract_path_text(raw_data, 'grocery_payment_method', 'ebt_card'),'') = 'true'
then true
else false end as response
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
inner join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id
where nullif(json_extract_path_text(raw_data, 'grocery_payment_method', 'ebt_card'),'') is not null 
and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time
) sub
)



select
measure_date
,patient_id
,foodapp_user_id
,response
,encounter_id
from ebt
where rn = 1
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
