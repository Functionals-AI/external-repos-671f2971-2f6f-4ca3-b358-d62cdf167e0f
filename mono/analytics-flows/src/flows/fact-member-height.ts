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
    startAt: 'FactHeight',
    states: {
      FactHeight: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.fact_member_height;
            CREATE TABLE analytics.fact_member_height AS
            with height as
(
--Get height values
select
sub.measure_date
,sub.patient_id
,sub.foodapp_user_id
-- ,max(round(sub.height,2)) as height
,round(sub.height,2) as height
,sub.encounter_id
,row_number() over (partition by sub.patient_id, sub.foodapp_user_id, sub.measure_date order by sub.height :: int desc) as rn
from
(
--Athena Height
select
v.createddatetime :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
--,max(v.displayvalue :: float) as height
,v.displayvalue :: float as height
,ce.encounter_id
from athena_stage.vitalsign_raw v
inner join fq_common_telenutrition.clinical_encounter ce
on v.clinicalencounterid = ce.encounter_id
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.id

where v.key in('VITALS.HEIGHT')
--and v.createddatetime :: date between ((current_date :: date) - 730) and current_date :: date
and v.displayvalue is not null
and v.displayvalue :: float between 52 and 96

-- group by
-- v.createddatetime :: date
-- ,ce.patient_id
-- ,gu.id

union

--Foodapp Heights
select
hub.date :: date as measure_date
,sp.patient_id
,gu.id as foodapp_user_id
-- ,max(hub.height) :: float as height
,hub.height :: float as height
,null as encounter_id

from fq_foodapp_tenants.hc_user_biomarkers hub
inner join fq_foodapp_tenants.go_users gu
on hub.user_id = gu.id
left join fq_common_telenutrition.schedule_patient sp
on gu.ta_identity_id = sp.identity_id

where 0 = 0
and hub.height is not null
and hub.height :: float between 52 and 96

-- group by
-- hub.date :: date
-- ,sp.patient_id
-- ,gu.id

union

--FFD Heights
select
ce.encounter_date :: date as measure_date
,ce.patient_id
,gu.id as foodapp_user_id
-- ,max((nullif(json_extract_path_text(raw_data, 'height_feet'), '') :: float * 12)
-- +
-- nullif(json_extract_path_text(raw_data, 'height_inches'), '') :: float) as height
,(nullif(json_extract_path_text(raw_data, 'height_feet'), '') :: float * 12)
+
(nullif(json_extract_path_text(raw_data, 'height_inches'), '') :: float) as height
,ce.encounter_id
from fq_common_telenutrition.clinical_encounter ce
left join fq_common_telenutrition.schedule_patient p
on ce.patient_id = p.patient_id
left join fq_foodapp_tenants.go_users gu
on p.identity_id = gu.id

where 0 = 0 
and ce.encounter_date > '2024-10-15' --Switched from Athena to FFD at this time
and (nullif(json_extract_path_text(raw_data, 'height_feet'), '') :: float * 12)
+
(nullif(json_extract_path_text(raw_data, 'height_inches'), '') :: float) is not null
and (nullif(json_extract_path_text(raw_data, 'height_feet'), '') :: float * 12)
+
(nullif(json_extract_path_text(raw_data, 'height_inches'), '') :: float) between 52 and 96

-- group by
-- ce.encounter_date :: date
-- ,ce.patient_id
-- ,gu.id
) sub
-- group by
-- sub.measure_date
-- ,sub.patient_id
-- ,sub.foodapp_user_id
)

select
measure_date
,patient_id
,foodapp_user_id
,height
,encounter_id
from height
where rn = 1
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
