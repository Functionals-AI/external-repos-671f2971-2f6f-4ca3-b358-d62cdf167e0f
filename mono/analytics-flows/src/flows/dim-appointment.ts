import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
  	rate: '6 hours', 
    startAt: 'DimAppointment',
    states: {
      DimAppointment: Redshift.query({
        sql: `
	BEGIN TRANSACTION;

-- Truncate the table to remove existing data
TRUNCATE TABLE analytics.dim_appointment;

-- Insert new data
INSERT INTO analytics.dim_appointment
select *
from
(
with patient_appt_ranking as
--CTE to get initial completed appts and order of completed appts
(
select
sub2.*
,case when sub2.patient_completed_appt_number = 1
then True
else False end as is_completed_initial_appt
from
(
select
*
,row_number() over (partition by sub.patient_id order by sub.appt_date asc) as patient_completed_appt_number
from
(
select
sa.appointment_id
,coalesce(sa.patient_id, ar.patientid) as patient_id
,sa.start_timestamp as appt_date
from fq_common_telenutrition.schedule_appointment sa
left join athena_stage.appointment_raw ar
on sa.appointment_id = ar.appointmentid
and ar.parentappointmentid is not null
and ar.parentappointmentid = ar.appointmentid

where 0 = 0
and sa.status in('3','4')
and coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is null
and coalesce(ar.nochargeentryreason,'na') not in('LATE CANCEL/NO SHOW')
) sub
) sub2
)




select
sub.*
,par.patient_completed_appt_number
,coalesce(par.is_completed_initial_appt, FALSE) as is_completed_initial_appt
-------------temp fields for backfilling insurance/employer IDs while we work on permanent solution
--Nested case to hardcode NULL insurance IDs
,case when sub.payment_method_id is null
and sub.status_normalized != 'booked'
then
case
--Employee accts that should have null insurances
when upper(ip.name) like '%CHOICE BENEFITS%'
or pi.policygroupnumber = '116983'
or upper(spcl_prgm.customfieldvalue) = 'EATWISE'
or upper(spcl_prgm.customfieldvalue) like '%HOUSTON METHODIST%'
or upper(spcl_prgm.customfieldvalue) like '%REGENCY CENTER%'
or (upper(spcl_prgm.customfieldvalue) = 'BIOM') 
or pi.policygroupnumber = '76411294'
or upper(spcl_prgm.customfieldvalue) = 'NORTHWESTERN MUTUAL'
or upper(spcl_prgm.customfieldvalue) = 'ADVENTIST RISK MANAGEMENT'
or upper(spcl_prgm.customfieldvalue) like '%MARICOPA COUNTY%'
or upper(spcl_prgm.customfieldvalue) like '%ADVOCATE AURORA HEALTH (AAH)%'
or upper(spcl_prgm.customfieldvalue) like '%UNITED STATES HOUSE OF REPRESENTATIVES%'
or upper(ip.superpackagename) like '%PACIFICSOURCE%'
then null

when (upper(spcl_prgm.customfieldvalue) like '%SALESFORCE%' and upper(ip.superpackagename) like '%AETNA%')
or (upper(ip.superpackagename) like '%AETNA%' and pi.policygroupnumber IN ('28573104000001','88352802000001','88352802300101','88352801700001','88352801900001','88352802300001','88352801800002','86881601100001','71998202300120','10799401000006','66037701100006','10919001100100','80021502300001','87058802000019','28573105500001','86523701500105','81127405000008')) then '13' --Salesforce Aetna
when (upper(spcl_prgm.customfieldvalue) like '%SALESFORCE%' and upper(ip.superpackagename) like '%UNITED HEALTHCARE%')
or (upper(ip.superpackagename) like '%UNITED HEALTHCARE%' and pi.policygroupnumber= '911585') then '14' --Salesforce UHC
when upper(spcl_prgm.customfieldvalue) = 'ADVENTIST RISK MANAGEMENT' then '19' --Ascend to wholeness
when upper(ip.superpackagename) like '%SAMARITAN HEALTH PLAN OPERATIONS%' then '44' --'Samaritan'
when upper(ip.name) like '%MASS GENERAL BRIGHAM%' then '24' --MGB
when upper(ip.superpackagename) like '%CDPHP%' then '4'  --'CDPHP'
when upper(ip.superpackagename) like '%CHORUS COMMUNITY HEALTH PLAN (MEDICAID%' then '6' --'CCHP - Medicaid'
when (upper(ip.superpackagename) like '%CHORUS COMMUNITY HEALTH PLAN (EPO)%' or upper(ip.superpackagename) like '%CHORUS COMMUNITY HEALTH PLAN (HMO)%' or upper(ip.name) like '%TOGETHER HEALTH%') or  ((upper(ip.superpackagename) like '%CHORUS COMMUNITY HEALTH PLAN%' )  and pi.policyidnumber like '22%') then '5' --'CCHP - Exchange'
when upper(ip.superpackagename) = 'BCBS-VA - HEALTHKEEPERS PLUS (MEDICAID REPLACEMENT - HMO)' then '23' --'Elevance'
when upper(ip.superpackagename) like '%HEALTHFIRST%' then '7' --'Healthfirst'
when upper(ip.superpackagename) like '%BANNER%' then '22' --'Banner Health'
when upper(ip.superpackagename) like '%INDEPENDENT HEALTH%' then '8' --'INDEPENDENT HEALTH'
when upper(ip.superpackagename) like '%MARTIN''S POINT HEALTH CARE (MEDICARE%' then '9' --'Martin''s Point GA'
when (upper(ip.superpackagename) like '%UMPQUA%')  then '12' --'UMPQUA Medicaid'
when (upper(ip.name) like '%UNITED%'and right(pi.policygroupnumber,4) = 'DSNP') then '21' --'UHC DSNP'
when upper(ip.name) like '%MOLINA%' then '10' --'Molina'
when upper(ip.superpackagename) like '%BCBS-TX%' then '2' --'BCBS-TX'
when upper(ip.superpackagename) like '%BCBS-IL%' then '1' --'BCBS-IL'
when upper(ip.superpackagename) like '%COUNTYCARE%' or upper(ip.name) like '%COUNTYCARE%' then '18' --'Cook County Health'
when upper(ip.superpackagename) like '%HEALTH SERVICES FOR CHILDREN WITH SPECIAL NEEDS%' then '20' --'Health Services for Children'
when upper(spcl_prgm.customfieldvalue) = 'QUARTZ' or upper(ip.superpackagename) like '%QUARTZ%' then '17' --'Quartz'
--when upper(ip.superpackagename) like 'UMR%' then '15' --UMR has insurance but no acct
when upper(ip.name) like '%CIGNA%' then '3' --Cigna Ntnl
when upper(ip.superpackagename) like '%AETNA BETTER HEALTH OF IL%' then '45' --Aetna IL
when upper(ip.name) like '%AETNA%' then '16'
else null end :: int
--else to get currently populated insurance IDs
else ppm.insurance_id end as insurance_id

--Nested case to hardcode NULL employer IDs
,case when sub.payment_method_id is null
and sub.status_normalized != 'booked'
then
case when upper(ip.name) like '%CHOICE BENEFITS%' then '2' --'ArcBest'
when pi.policygroupnumber = '116983' then '8' --Umpqua Employees
when upper(spcl_prgm.customfieldvalue) like '%SALESFORCE%'
or (upper(ip.superpackagename) like '%AETNA%' and pi.policygroupnumber IN ('28573104000001','88352802000001','88352802300101','88352801700001','88352801900001','88352802300001','88352801800002','86881601100001','71998202300120','10799401000006','66037701100006','10919001100100','80021502300001','87058802000019','28573105500001','86523701500105','81127405000008'))
or (upper(ip.superpackagename) like '%UNITED HEALTHCARE%' and pi.policygroupnumber= '911585')
 then '5' --Salesforce
when upper(spcl_prgm.customfieldvalue) = 'EATWISE' then '12' --'EATWISE'
when upper(spcl_prgm.customfieldvalue) like '%HOUSTON METHODIST%' then '13' --Houston
when upper(spcl_prgm.customfieldvalue) like '%REGENCY CENTER%' then '9' --'Regency'
when (upper(spcl_prgm.customfieldvalue) = 'BIOM') or pi.policygroupnumber = '76411294' then '3' --'BIOMerieux' assume we dont need UMR? UMR hits nulls, AAH and NW Mutual --or (ip.superpackagename like '%UMR%' )
when upper(spcl_prgm.customfieldvalue) = 'NORTHWESTERN MUTUAL' then '4' --'NORTHWESTERN MUTUAL'
when upper(spcl_prgm.customfieldvalue) = 'ADVENTIST RISK MANAGEMENT' then '10' --Adventist
when upper(spcl_prgm.customfieldvalue) like '%MARICOPA COUNTY%' then '11' --Maricopa
when upper(spcl_prgm.customfieldvalue) like '%ADVOCATE AURORA HEALTH (AAH)%' then '1' --'AAH Healthy Living'
when upper(spcl_prgm.customfieldvalue) like '%UNITED STATES HOUSE OF REPRESENTATIVES%' then '6' --'UHoR'
when upper(ip.superpackagename) like '%PACIFICSOURCE%' then '7' --'PacificSource'
else null end :: int
--else to get currently populated employer IDs
else ppm.employer_id end as employer_id
-------------
from
(
select
sa.appointment_id
,sa.provider_id
,(sa.date || ' ' || sa.start_time) :: timestamp as start_timestamp
,coalesce(sa.scheduled_at :: timestamp, ar.appointmentscheduleddatetime :: timestamp) as schedule_timestamp
,coalesce(sa.scheduled_by :: varchar, ar.scheduledby) as scheduled_by --jsonb in sa
,sa.duration as booked_duration
,sa.status
,case when sa.status in('f')
and coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is null
and coalesce(ar.nochargeentryreason,'na') not in('LATE CANCEL/NO SHOW')
then 'booked'
when sa.status in('3','4')
and coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is null
and coalesce(ar.nochargeentryreason,'na') not in('LATE CANCEL/NO SHOW')
then 'completed'
when sa.status = 'x'
or coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is not null
or coalesce(ar.nochargeentryreason,'na') in('LATE CANCEL/NO SHOW')
then 'cancelled'
else sa.status :: varchar end as status_normalized
,case when ar.nochargeentryreason in('LATE CANCEL/NO SHOW')
or coalesce(acr.name, ar.appointmentcancelreason) in('PATIENT NO SHOW','LAST MINUTE CANCELLATION')
then 'patient_no_show'
when sa.status in('3','4')
and coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is null
and coalesce(acr.name, ar.appointmentcancelreason,'na') not in('PATIENT NO SHOW','LAST MINUTE CANCELLATION')
and coalesce(ar.nochargeentryreason,'na') not in('LATE CANCEL/NO SHOW')
then 'both_show'
when (sa.status = 'x'
or coalesce(sa.cancelled_at, ar.appointmentcancelleddatetime) is not null)
and coalesce(ar.nochargeentryreason,'na') not in('LATE CANCEL/NO SHOW')
and coalesce(acr.name, ar.appointmentcancelreason,'na') not in('PATIENT NO SHOW','LAST MINUTE CANCELLATION')
then 'both_no_show'
else null end as participation --currently no provider_no_show
,coalesce(sa.patient_id, ar.patientid) as patient_id
,case when ar.appointmentcancelleddatetime is not null
then ar.appointmentcancelleddatetime
else DATEADD(hour, -DATEDIFF(hour, (sa.date || ' ' || sa.start_time) :: timestamp, sa.start_timestamp :: timestamp), sa.cancelled_at) 
end as cancel_datetime --athena cancel timestamp is local to patient and FFD cancel is in UTC. Subtracting the difference in hours from the UTC appt timestamp from the local appt timestamp and applying that difference to the UTC cancel timestamp
,coalesce(acr.name, ar.appointmentcancelreason) as cancel_reason
,d.state
,sa.frozen
,ar.appointmentfrozenreason as frozen_reason
,sa.appointment_type_id
,sa.payment_method_id
,sa.accepted_payment_method_id
,sa.meeting
,ar.nochargeentryreason as no_charge_reason
,ar.primarypatientinsuranceid as primary_patient_insurance_id
,ar.secondarypatientinsuranceid as secondary_patient_insurance_id
,ar.claimid as claim_id
,ar.rescheduleddatetime as reschedule_timestamp
,ar.rescheduledappointmentid as reschedule_appointment_id
,ar.rescheduledby as reschedule_by

from fq_common_telenutrition.schedule_appointment sa
left join athena_stage.appointment_raw ar
on sa.appointment_id = ar.appointmentid
and ar.parentappointmentid is not null
and ar.parentappointmentid = ar.appointmentid
and ar.appointmentstatus != 'o - Open Slot'
left join fq_common_telenutrition.schedule_department d
on sa.department_id = d.department_id
left join fq_common_telenutrition.appointment_cancel_reason acr
on sa.cancel_reason_id = acr.cancel_reason_id

where sa.status != 'o'
) sub

left join patient_appt_ranking par
on sub.appointment_id = par.appointment_id

--join to get populated insurance/employer IDs
left join fq_common_telenutrition.schedule_patient_payment_method ppm
on sub.payment_method_id = ppm.payment_method_id

--joins to backfill NULL insurance/employer IDs
left join athena_stage.patientinsurance_raw pi
on sub.primary_patient_insurance_id = pi.patientinsuranceid
left join athena_stage.insurancepackage_raw ip
on pi.insurancepackageid = ip.insurancepackageid
left join athena_stage.customdemographics_raw spcl_prgm --currently only 1 spec program per patient
on sub.patient_id = spcl_prgm.patientid
and spcl_prgm.customfieldname = 'Special Programs'
) sub_insert;
 
COMMIT TRANSACTION;
   
        `,
      }),   
    }
  }
})
