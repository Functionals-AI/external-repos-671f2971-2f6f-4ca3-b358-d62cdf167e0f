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
    startAt: 'FactBloodPressure',
    states: {
      FactBloodPressure: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_blood_pressure;
            CREATE TABLE analytics.fact_member_blood_pressure AS
            with bp as
(
--Get BP values
select
sub.measure_date
,sub.patient_id
,sub.foodapp_user_id
,sub.systolic :: int as systolic
,sub.diastolic :: int as diastolic
,sub.encounter_id
,row_number() over (partition by 
case when sub.patient_id is not null 
then 'patient_' || sub.patient_id
else 'foodapp_' || sub.foodapp_user_id
end, sub.measure_date order by sub.systolic :: int desc) as rn
from
(
--Foodapp BP
select
hub.date :: date as measure_date
,sp.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(hub.systolic,'[^0-9]',''),'') :: bigint as systolic
,nullif(regexp_replace(hub.diastolic,'[^0-9]',''),'') :: bigint as diastolic
,null as encounter_id

from fq_foodapp_tenants.hc_user_biomarkers hub
inner join fq_foodapp_tenants.go_users gu
on hub.user_id = gu.id
left join fq_common_telenutrition.schedule_patient sp
on gu.ta_identity_id = sp.identity_id

where 0 = 0
and coalesce(nullif(regexp_replace(hub.systolic,'[^0-9]',''),'') :: bigint, 0) between 80 and 300
and coalesce(nullif(regexp_replace(hub.diastolic,'[^0-9]',''),'') :: bigint, 0) between 40 and 200


union


--FFD BP v1
select
coalesce(nullif(json_extract_path_text(raw_data, 'blood_pressure_systolic', 'date'), '') :: date, ce.encounter_date :: date) as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(json_extract_path_text(raw_data, 'blood_pressure_systolic', 'value'),'[^0-9]',''), '') :: bigint as systolic
,nullif(regexp_replace(json_extract_path_text(raw_data, 'blood_pressure_diastolic', 'value'),'[^0-9]',''), '') :: bigint as diastolic
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0 
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'blood_pressure_systolic', 'value'),'[^0-9]',''), '') :: bigint, 0) between 80 and 300
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'blood_pressure_diastolic', 'value'),'[^0-9]',''), '') :: bigint, 0) between 40 and 200



union


--FFD BP v2 --Athena data should be captured here
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(json_extract_path_text(raw_data, 'vitals.bloodpressure.systolic'),'[^0-9]',''), '') :: bigint as systolic
,nullif(regexp_replace(json_extract_path_text(raw_data, 'vitals.bloodpressure.diastolic'),'[^0-9]',''), '') :: bigint as diastolic
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0 
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'vitals.bloodpressure.systolic'),'[^0-9]',''), '') :: bigint, 0) between 80 and 300
and coalesce(nullif(regexp_replace(json_extract_path_text(raw_data, 'vitals.bloodpressure.diastolic'),'[^0-9]',''), '') :: bigint, 0) between 40 and 200


union


--Risk Assessment BP
select
coalesce(nullif(json_extract_path_text(json_extract_array_element_text(json_extract_path_text(cesq.form_data, 'blood_pressure'), 0), 'date'),'') :: date, cesq.created_at :: date)  as measure_date
,cesq.patient_id
,gu.id as foodapp_user_id
,nullif(regexp_replace(json_extract_path_text(json_extract_array_element_text(json_extract_path_text(form_data, 'blood_pressure'), 0), 'systolic'),'[^0-9]',''),'') :: bigint as systolic
,nullif(regexp_replace(json_extract_path_text(json_extract_array_element_text(json_extract_path_text(form_data, 'blood_pressure'), 0), 'diastolic'),'[^0-9]',''),'') :: bigint as diastolic
,cesq.encounter_id
from fq_common_telenutrition.clinical_encounter_screening_questionnaire cesq
left join fq_common_telenutrition.schedule_patient p
on cesq.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.ta_identity_id

where 0 = 0
and nullif(regexp_replace(json_extract_path_text(json_extract_array_element_text(json_extract_path_text(form_data, 'blood_pressure'), 0), 'systolic'),'[^0-9]',''),'') :: bigint between 80 and 300
and nullif(regexp_replace(json_extract_path_text(json_extract_array_element_text(json_extract_path_text(form_data, 'blood_pressure'), 0), 'diastolic'),'[^0-9]',''),'') :: bigint between 40 and 200
) sub
)

select
measure_date
,patient_id
,foodapp_user_id
,systolic
,diastolic
,case 
when systolic >= 140 or diastolic >= 90 then 'stage_2_hypertension'
when (systolic between 130 and 139) or (diastolic between 80 and 89) then 'stage_1_hypertension'
when (systolic between 120 and 129) and (diastolic < 80) then 'pre_hypertension'
when systolic < 120 and diastolic < 80 then 'normal'
end as hypertension_category
,case 
when systolic >= 140 or diastolic >= 90 then 4
when (systolic between 130 and 139) or (diastolic between 80 and 89) then 3
when (systolic between 120 and 129) and (diastolic < 80) then 2
when systolic < 120 and diastolic < 80 then 1
end as hypertension_category_numerical
,encounter_id
from bp
where rn = 1
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
