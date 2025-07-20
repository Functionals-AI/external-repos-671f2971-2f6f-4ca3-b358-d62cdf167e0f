import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    rate: '6 hours',
    startAt: 'CreateBiometricsCount',
    states: {
      CreateBiometricsCount: Redshift.query({
        sql: `
        DROP TABLE IF EXISTS analytics.biometrics_count;
        CREATE TABLE analytics.biometrics_count AS 
        drop table if exists full_biometrics_table_long;											
create temp table full_biometrics_table_long as (

--identity table											
with identity_table as (											
	select										
		IDE.identity_id::varchar,									
		SP.patient_id,									
		IUS.fs_user_id as fs_user_id,									
		IDE.eligible_id,									
		case when name = 'CountyCare' then 'Cook County Health' else name end as account									
	FROM fq_common_telenutrition.iam_identity IDE										
	LEFT JOIN fq_common_telenutrition.schedule_patient SP ON SP.identity_id = IDE.identity_id										
	LEFT JOIN fq_common_telenutrition.iam_user IUS ON IUS.identity_id = IDE.identity_id										
	LEFT JOIN fq_teleapp_common.account AC ON AC.account_id = IDE.account_id										
),											

-- Get A1c and Cholesterol readings from Athena											
athena_ha1c_lipid_readings as (											
select											
	TA.patientid,										
	TA.policyidnumber,										
	TA.account,										
	ce.clinicalencounterid,										
	ce.appointmentid,										
	ct.createddatetime as date,										
	ct.clinicalfinding as biometric,										
	findingtype::varchar as value										
from athena_stage.clinicaltemplate_raw as ct											
INNER JOIN athena_stage.clinicalencounter_raw as ce on ct.clinicalencounterid = ce.clinicalencounterid											
INNER JOIN (select distinct appointment_id, patientid, policyidnumber, account from analytics.telenutrition_analytics) TA ON TA.appointment_id = ce.appointmentid											
where clinicalfinding in ('A1C', 'total cholesterol', 'LDL', 'HDL','TG')											
	and findingtype not in ('.','', 'A1c', 'a1c','hgba1c') and findingtype <> 'NEUTRAL'										
),											
											
----------------------------------------------------------------------------------------------------------------											
-- biometric readings from athena											
----------------------------------------------------------------------------------------------------------------											
telenutrition_biometrics AS (											
	SELECT *										
	FROM (										
		SELECT									
			id.identity_id as identity_id,								
			id.eligible_id,								
			athena_vitals.*,								
			row_number() OVER (PARTITION BY id.identity_id,								
				biometric,							
				date							
				ORDER BY datepart(hour, date),							
					datepart(minute, date),						
					datepart(second, date) ASC) AS biometric_date_rank						
		from(									
			(select								
				telenutrition.patientid,							
				telenutrition.policyidnumber,							
				telenutrition.account,							
				encounter.appointmentid,							
				CASE WHEN KEY = 'VITALS.WEIGHT' THEN							
					'weight'						
				WHEN KEY = 'VITALS.HEIGHT' THEN							
					'height'						
				WHEN KEY = 'VITALS.BMI' THEN							
					'bmi'						
				WHEN KEY = 'VITALS.BLOODPRESSURE.DIASTOLIC' THEN							
					'diastolic'						
				WHEN KEY = 'VITALS.BLOODPRESSURE.SYSTOLIC' THEN							
					'systolic'						
				ELSE							
					null						
				END AS "biometric",							
				date(vitals.createddatetime) AS date,							
				displayvalue || ' ' || displayunit AS value_with_unit,							
				(CASE WHEN biometric in ('bmi','systolic','diastolic') THEN cast(value AS float) ELSE displayvalue END)::varchar AS value							
			from athena.vitalsign AS vitals								
			LEFT JOIN athena.clinical_encounter AS encounter ON vitals.clinicalencounterid = encounter.clinicalencounterid								
			LEFT JOIN								
				(select distinct patientid, appointment_id, policyidnumber, account from analytics.telenutrition_analytics)							
				AS telenutrition ON telenutrition.appointment_id = encounter.appointmentid							
			WHERE (KEY IS NOT NULL and((displayvalue IS NOT NULL) or(KEY = 'VITALS.BMI'))) or (KEY in ('VITALS.BLOODPRESSURE.DIASTOLIC','VITALS.BLOODPRESSURE.SYSTOLIC'))								
			)								
											
			UNION ALL								
											
			(								
			select patientid, policyidnumber, account, appointmentid, biometric, date, value_with_unit, value								
			from(								
				select							
					patientid,						
					policyidnumber,						
					account,						
					appointmentid,						
					case when biometric = 'total cholesterol' then 'cholesterol'
					when biometric = 'HDL' then 'hdl'
					when biometric = 'LDL' then 'ldl'
					when biometric = 'TG' then 'triglycerides'
					when biometric = 'A1C' then 'ha1c'
					else biometric end as biometric,						
					date,						
				value || ' ' || '%' AS value_with_unit,							
				value::varchar,							
				lag(value) over (partition by patientid, biometric order by date asc) as last_reading
				from athena_ha1c_lipid_readings							
				)							
				where value <> last_reading or last_reading is null							
			)								
	) as athena_vitals										
	LEFT JOIN identity_table as id ON athena_vitals.patientid::varchar = id.patient_id::varchar										
	) WHERE biometric_date_rank = 1										
),
																						
tn_biometrics_long AS (											
SELECT											
	identity_id,										
	eligible_id,										
	account,										
	policyidnumber,										
	biometric,										
	date,										
	value::varchar										
FROM telenutrition_biometrics											
where											
	(biometric = 'bmi' and value::float >15 and value::float <50) OR										
	(biometric = 'weight' and value::float >60 and value::float <400) OR										
	(biometric = 'systolic' and value::float >80 and value::float <300) OR										
	(biometric = 'diastolic' and value::float >40 and value::float <200) OR										
	biometric = 'ha1c' OR
	biometric = 'cholesterol' OR
	biometric = 'hdl' OR
	biometric = 'ldl' OR
	biometric = 'triglycerides'										
),
											
											
------------------------------------------------------------------------------------------------------------------											
--biometrics from foodsmart platform											
------------------------------------------------------------------------------------------------------------------											
food_insecurity_responses as (											
select user_id,											
DATE_TRUNC('day',response_time) as response_date,											
question,											
response,											
(response != '["NOTELL"]') as answered_food_security											
from survey_response											
where question IN ('money_worries','food_worries')											
),											
											
food_security_piv as(											
SELECT user_id, 'food insecurity' as biometric, response_date as date, (money_worries + food_worries > 0 ) AS value											
from(											
SELECT											
user_id,											
response_date,											
SUM(CASE WHEN question = 'money_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS money_worries,											
SUM(CASE WHEN question = 'food_worries' AND response in ('["sometimes"]', '["often"]') THEN 1 ELSE 0 END) AS food_worries,											
max( CASE WHEN question = 'money_worries' THEN 1 ELSE 0 END ) = 0 as null_money_worries, --check if money worries was answered on the response date											
max( CASE WHEN question = 'food_worries' THEN 1 ELSE 0 END ) = 0 as null_food_worries, -- check if food worries was answered on the response date											
SUM(CASE WHEN  response != '["NOTELL"]' THEN 1 ELSE 0 END) AS answered_food_security											
FROM food_insecurity_responses											
GROUP BY 1,2)											
where null_money_worries = false and null_food_worries = false --only include food insecurity responses that have both money worries and food worries answers on the same response											
),
											 											
foodsmart_platform_biometrics AS (											
SELECT											
	identity_id,										
	eligible_id,										
	account,										
	cast(patientid as varchar) as patientid,										
	member_id,										
	member_id_2,										
	biometric,										
	date,										
	value::varchar										
FROM (											
SELECT											
	case when go_users.ta_identity_id::varchar is not null then go_users.ta_identity_id::varchar else concat(id::varchar, '_fs_app') end as identity_id,										
	map.account,										
	go_users.eligible_id,										
	go_users.member_id,										
	go_users.member_id_2,										
	cast(ide.patient_id AS varchar) AS patientid,										
	biometric,										
	date,										
	value,										
	CASE WHEN (biometric = 'bmi')										
	and(value::float > 15)										
	and(value::float < 50) THEN										
			1								
		WHEN (biometric = 'weight')									
	and(value::float > 60)										
	and(value::float < 400) THEN										
			1								
		WHEN (biometric = 'triglycerides')									
	and(value::float > 10)										
	and(value::float < 2000) THEN										
			1								
		WHEN (biometric = 'cholesterol')									
	and(value::float > 65)										
	and(value::float < 750) THEN										
			1								
		WHEN (biometric = 'hdl')									
	and(value::float > 10)										
	and(value::float < 120) THEN										
			1								
		WHEN (biometric = 'ldl')									
	and(value::float > 30)										
	and(value::float < 200) THEN										
			1								
		WHEN (biometric = 'systolic')									
	and(value::float > 80)										
	and(value::float < 300) THEN										
			1								
		WHEN (biometric = 'diastolic')									
	and(value::float > 40)										
	and(value::float < 200) THEN										
			1								
		WHEN (biometric = 'ha1c')									
	and(value::float > 3)										
	and(value::float < 15) THEN										
			1								
	when biometric = 'Nutriquiz' THEN 1										
	when biometric = 'food insecurity' THEN 1										
		ELSE NULL									
											
		END AS normal_value_flag,									
		--take the first reported biometric on a given date if there are duplicates									
		row_number() OVER (PARTITION BY id,									
			biometric,								
			date(date)								
			ORDER BY								
				datepart (hour,							
				date),							
			datepart (minute,								
			date),								
		datepart (second,									
		date) ASC) AS biometric_date_rank									
	FROM										
		go_users									
		INNER JOIN public.fs_app_org_account_mappings as map ON ((go_users.organization_id || '/' || nvl (go_users.suborganization_id,									
		''))::varchar(65535)) = map.member_org_id									
		LEFT JOIN (									
			SELECT user_id, biometric, value::varchar, date								
			FROM public.biometrics_transform								
											
		UNION ALL									
											
		SELECT user_id, 'Nutriquiz' as "biometric", score::varchar as "value", created_at::DATE as "date"
		    from public.nutriscore
		    WHERE complete = 1									
											
		UNION ALL									
											
		select user_id, biometric, case when value = TRUE then 1 else 0 end::varchar as value, date									
		from food_security_piv									
		) as biometrics_transform ON go_users.id = biometrics_transform.user_id									
		left join identity_table as ide on go_users.ta_identity_id = ide.identity_id									
	WHERE										
		value IS NOT NULL									
		AND normal_value_flag IS NOT NULL									
		) AS biometric_clean									
		where									
		biometric_date_rank = 1									
)	
																				
------------------------------------------------------------------------------------------------------------------											
--combine platform biometrics with athena biometrics											
------------------------------------------------------------------------------------------------------------------											
SELECT *											
from(											
	SELECT										
		identity_id,									
		eligible_id,									
		account,									
		biometric,									
		date,									
		value::varchar,									
		'athena' as source									
	FROM										
		tn_biometrics_long									
	UNION ALL										
	SELECT										
		identity_id,									
		eligible_id,									
		account,									
		biometric,									
		date,									
		value::varchar,									
		'platform' as source									
	FROM										
		foodsmart_platform_biometrics									
)											
)											
;											
											
WITH before_biometrics AS (											
SELECT											
	*										
FROM (											
SELECT											
	identity_id,										
	account,										
	biometric,										
	value AS "before_value",										
	date AS "before_date",										
	row_number() OVER (PARTITION BY identity_id,										
		biometric ORDER BY date ASC) AS record_number									
FROM											
	full_biometrics_table_long)										
WHERE											
	record_number = 1										
),											
											
long_before_after_biometrics AS (											
SELECT *											
from (											
SELECT											
	full_biometrics_table_long.identity_id,										
	full_biometrics_table_long.eligible_id,										
	full_biometrics_table_long.account,										
	full_biometrics_table_long.biometric,										
	before_biometrics.before_value AS before_value,										
	before_biometrics.before_date AS before_date,										
	full_biometrics_table_long.value AS "after_value",										
	full_biometrics_table_long.date AS "after_date",										
	datediff('day',										
	before_date,										
	after_date) AS "days_between",										
	row_number() over (partition by full_biometrics_table_long.identity_id, full_biometrics_table_long.biometric order by days_between desc) as days_between_rank	
FROM											
	full_biometrics_table_long										
	LEFT JOIN before_biometrics ON full_biometrics_table_long.identity_id = before_biometrics.identity_id										
		AND full_biometrics_table_long.account = before_biometrics.account									
		AND full_biometrics_table_long.biometric = before_biometrics.biometric									
WHERE											
	days_between >= 30										
)											
where days_between_rank = 1
)

--combine the before biometrics table with the before_after biometrics table and count how many members are in each for each biometric
select
	member_account as account,
	-- weight and bmi
	sum(case when biometric = 'weight' then count_members_report_1_reading else 0 end) as report_1_weight,
	sum(case when biometric = 'weight' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_weight,
	sum(case when biometric = 'bmi' then count_members_report_1_reading else 0 end) as report_1_bmi,
	--NQ
	sum(case when biometric = 'bmi' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_bmi,
	sum(case when biometric = 'Nutriquiz' then count_members_report_1_reading else 0 end) as report_1_nutriquiz,
	sum(case when biometric = 'Nutriquiz' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_nutriquiz,
	--food insecurity
	sum(case when biometric = 'food insecurity' then count_members_report_1_reading else 0 end) as report_1_food_insecurity,
	sum(case when biometric = 'food insecurity' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_food_insecurity,
	-- blood pressure
	sum(case when biometric = 'systolic' then count_members_report_1_reading else 0 end) as report_1_systolic,
	sum(case when biometric = 'systolic' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_systolic,
	sum(case when biometric = 'diastolic' then count_members_report_1_reading else 0 end) as report_1_diastolic,
	sum(case when biometric = 'diastolic' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_diastolic,
	--diabetes
	sum(case when biometric = 'ha1c' then count_members_report_1_reading else 0 end) as report_1_ha1c,
	sum(case when biometric = 'ha1c' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_ha1c,
	--cholesterol
	sum(case when biometric = 'ldl' then count_members_report_1_reading else 0 end) as report_1_ldl,
	sum(case when biometric = 'ldl' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_ldl,
	sum(case when biometric = 'hdl' then count_members_report_1_reading else 0 end) as report_1_hdl,
	sum(case when biometric = 'hdl' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_hdl,
	sum(case when biometric = 'cholesterol' then count_members_report_1_reading else 0 end) as report_1_cholesterol,
	sum(case when biometric = 'cholesterol' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_cholesterol,
	sum(case when biometric = 'triglycerides' then count_members_report_1_reading else 0 end) as report_1_triglycerides,
	sum(case when biometric = 'triglycerides' then count_members_report_2_plus_readings_30_plus_days_apart else 0 end) as report_2_plus_readings_triglycerides
from(
	select
		case when f.account is not null then f.account else t.account end as member_account,
		case when f.biometric is not null then f.biometric else t.biometric end as biometric,
		nvl(count_members_report_1_reading,0) as count_members_report_1_reading,
		nvl(count_members_report_2_plus_readings_30_plus_days_apart,0) as count_members_report_2_plus_readings_30_plus_days_apart
	from
	( 
		select 
			account, 
			biometric, 
			count(identity_id) as count_members_report_1_reading
		from before_biometrics
		group by 1,2
	) f
	full join (
		select
			account,
			biometric,
			count(identity_id) as count_members_report_2_plus_readings_30_plus_days_apart
		from long_before_after_biometrics
		group by 1,2
	) t
	on f.account = t.account and f.biometric = t.biometric
)
group by 1
        `,
      }),
    }
  }
})
