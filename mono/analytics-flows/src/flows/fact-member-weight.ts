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
    startAt: 'FactWeight',
    states: {
      FactWeight: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_weight;
            CREATE TABLE analytics.fact_member_weight AS
            with weight as
(
--Get weight/bmi values
select
sub.measure_date
,sub.patient_id
,sub.foodapp_user_id
,sub.weight :: int as weight
,sub.bmi :: float
,sub.encounter_id
--window function to ensure we only get one reading per day per person
,row_number() over (partition by 
case when sub.patient_id is not null 
then 'patient_' || sub.patient_id
else 'foodapp_' || sub.foodapp_user_id
end, sub.measure_date order by sub.weight :: int desc) as rn
from
(
---------------------------- (Commented out bc most are captured in clinical_encounter)
-- --Athena Weights
-- select
-- v.createddatetime :: date as measure_date
-- ,ce.patient_id
-- ,gu.id as foodapp_user_id
-- --,max(v.displayvalue :: float) as weight
-- ,nullif(regexp_replace(v.displayvalue,'[^0-9.]',''),'') :: float as weight
-- ,ce.encounter_id
-- from athena_stage.vitalsign_raw v
-- inner join fq_common_telenutrition.clinical_encounter ce
-- on v.clinicalencounterid = ce.encounter_id
-- left join fq_common_telenutrition.schedule_patient p
-- on ce.patient_id = p.patient_id
-- left join fq_foodapp_tenants.go_users gu
-- on p.identity_id = gu.id

-- where v.key in('VITALS.WEIGHT')
-- --and v.createddatetime :: date between ((current_date :: date) - 730) and current_date :: date
-- and nullif(regexp_replace(v.displayvalue,'[^0-9.]',''),'') is not null
-- and nullif(regexp_replace(v.displayvalue,'[^0-9.]',''),'') > 60
-- and nullif(regexp_replace(v.displayvalue,'[^0-9.]',''),'') < 560


-- -- group by
-- -- v.createddatetime :: date
-- -- ,ce.patient_id
-- -- ,gu.id

-- union
-----------------------------


--Foodapp Weights
select
hub.date :: date as measure_date
,sp.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(hub.weight,'[^0-9.]',''),'') :: float as weight
,hub.bmi :: real as bmi
,null as encounter_id

from fq_foodapp_tenants.hc_user_biomarkers hub
inner join fq_foodapp_tenants.go_users gu
on hub.user_id = gu.id
left join fq_common_telenutrition.schedule_patient sp
on gu.ta_identity_id = sp.identity_id

where 0 = 0
and coalesce(nullif(regexp_replace(hub.weight,'[^0-9.]',''),'') :: float, 0) between 60 and 560 --valid weights
-- and nullif(regexp_replace(hub.weight,'[^0-9.]',''),'') :: float > 60
-- and nullif(regexp_replace(hub.weight,'[^0-9.]',''),'') :: float < 560


union


--FFD Weights v1
select
coalesce(nullif(json_extract_path_text(raw_data, 'weight', 'date'), '')::date, ce.encounter_date :: date) as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(json_extract_path_text(raw_data, 'weight', 'value'),'[^0-9.]',''),'') :: float  as weight
,coalesce(
nullif(json_extract_path_text(raw_data, 'bmi'), '') :: float,
(
(nullif(nullif(json_extract_path_text(raw_data, 'weight', 'value'), ''),'-') :: float * 703)
/ 
nullif(power((nullif(json_extract_path_text(raw_data, 'height_feet'), '') :: float * 12
+ 
nullif(json_extract_path_text(raw_data, 'height_inches'), '') :: float)
, 2), 0) 
)) as bmi
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0 
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'weight', 'value'),'[^0-9.]',''),'') :: float, 0) between 60 and 560
-- --and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time

-- and nullif(regexp_replace(json_extract_path_text(raw_data, 'weight', 'value'),'[^0-9.]',''),'') :: float > 60
-- and nullif(regexp_replace(json_extract_path_text(raw_data, 'weight', 'value'),'[^0-9.]',''),'') :: float < 560


union


--FFD Weights v2 --Athena data should be captured here
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(json_extract_path_text(raw_data, 'weight'), '[^0-9.]', ''),'') :: float as weight
,coalesce(
nullif(json_extract_path_text(raw_data, 'bmi'), '') :: float,
(
nullif(regexp_replace(json_extract_path_text(raw_data, 'weight'), '[^0-9.]', ''), '') :: float * 703
/ 
nullif(power(nullif(regexp_replace(json_extract_path_text(raw_data, 'height'), '[^0-9.]', ''),'') :: float
, 2), 0)
)) as bmi
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0 
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'weight'), '[^0-9.]', ''),'') :: float,0) between 60 and 560
-- --and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time

-- and nullif(regexp_replace(json_extract_path_text(raw_data, 'weight'), '[^0-9.]', ''),'') :: float > 60
-- and nullif(regexp_replace(json_extract_path_text(raw_data, 'weight'), '[^0-9.]', ''),'') :: float < 560


union


--Risk Assessment Weights
select
coalesce(nullif(JSON_EXTRACT_PATH_TEXT(JSON_EXTRACT_ARRAY_ELEMENT_TEXT(JSON_EXTRACT_PATH_TEXT(cesq.form_data, 'weight'), 0), 'date'),'') :: date, cesq.created_at :: date)  as measure_date
,cesq.patient_id
,gu.id as foodapp_user_id
,nullif(JSON_EXTRACT_PATH_TEXT(JSON_EXTRACT_ARRAY_ELEMENT_TEXT(JSON_EXTRACT_PATH_TEXT(cesq.form_data, 'weight'), 0), 'pounds'),'') :: float as weight
,(nullif(weight,0)*703)/nullif(POWER(
(nullif(JSON_EXTRACT_PATH_TEXT(form_data, 'height_feet'),'') :: float * 12)
+
(nullif(JSON_EXTRACT_PATH_TEXT(form_data, 'height_inches'),'')::float)
, 2),0) as bmi
,cesq.encounter_id
from fq_common_telenutrition.clinical_encounter_screening_questionnaire cesq
left join fq_common_telenutrition.schedule_patient p
on cesq.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where coalesce(nullif(JSON_EXTRACT_PATH_TEXT(JSON_EXTRACT_ARRAY_ELEMENT_TEXT(JSON_EXTRACT_PATH_TEXT(form_data, 'weight'), 0), 'pounds'),'') :: float, 0) between 60 and 560
) sub
)

select
measure_date
,patient_id
,foodapp_user_id
,weight
,bmi
,case when bmi < 25 then 'normal'									
when bmi between 25 and 29.999999 then 'overweight'									
when bmi >= 30 then 'obese'
else null end as bmi_category
,case when bmi < 25 then 1									
when bmi between 25 and 29.999999 then 2								
when bmi >= 30 then 3
else null end as bmi_category_numerical
,encounter_id
from weight
where rn = 1
and measure_date between '2016-01-01' and current_date :: date
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
