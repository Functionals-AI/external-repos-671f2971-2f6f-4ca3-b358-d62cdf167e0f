import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
  	rate: '6 hours', 
    startAt: 'DimProvider',
    states: {
      DimProvider: Redshift.query({
        sql: `
	BEGIN TRANSACTION;
            DROP TABLE IF EXISTS analytics.dim_provider;
            CREATE TABLE analytics.dim_provider AS
            --first appt slot date (go live date)
with go_live_date as
(
select
sa.provider_id
,min(sa.date :: date) as go_live_date
from fq_common_telenutrition.schedule_appointment sa
where sa.status != 'o'
group by
sa.provider_id
)
,employee_parsed as
--parsing employee nested data for readability
(
select
e.employee_id
,e.work_email
,nullif(json_extract_path_text(e.custom_fields,'NPI Last Name') :: varchar,'') as last_name
,nullif(json_extract_path_text(e.custom_fields,'NPI First Name') :: varchar,'') as first_name
,nullif(json_extract_path_text(e.custom_fields,'Provider NPI') :: varchar,'') as npi
,nullif(split_part(json_extract_path_text(e.custom_fields,'CSV Export'):: varchar,',',1),'') as phone_number
,nullif(split_part(json_extract_path_text(e.custom_fields,'CSV Export'):: varchar,',',2),'') as date_of_birth
,nullif(json_extract_path_text(e.custom_fields,'CDR Number') :: varchar,'') as cdr_number
,nullif(json_extract_path_text(e.custom_fields,'Languages Spoken for Care') :: varchar,'') as languages_for_care
,nullif(json_extract_path_text(e.custom_fields,'Can you see pediatric patients?') :: varchar,'') as pediatrics
,e.role_state
,e.employment_type
,e.start_date
,e.end_date
,nullif(split_part(json_extract_path_text(e.custom_fields, 'CSV Export'):: varchar, ',', 3), '') :: date as termination_date
,nullif(json_extract_path_text(e.custom_fields, 'Contract to FT') :: varchar, '') as contract_to_ft
,nullif(json_extract_path_text(e.custom_fields, 'RD Independent Contractor Agreement - Sign Date'), '') :: date as ind_contractor_sign_date
,nullif(json_extract_path_text(e.custom_fields, 'Transition Start Date'), '') :: date as transition_start_date
,nullif(json_extract_path_text(e.custom_fields, 'FT Offer Letter Sign Date'), '') :: date as ft_offer_sign_date
,nullif(json_extract_path_text(e.custom_fields,'Billing Unit Rate') :: varchar,'') as billing_unit_rate
,nullif(json_extract_path_text(e.custom_fields,'Hours of Weekly Availability for Patient Appts'),'') as reported_hours_available
from fq_teleapp_common.employee e
)
,
provider_status as
--CTE for determining provider status. The logic is different depending on whether the provider is transitioning from 1099 to FTE, FTE or 1099
(
select
sub.employee_id
,sub.provider_id
,sub.provider_status
from
(
--1099 -> FTE transition
select
e.employee_id
,sp.provider_id
,case 
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date - e.start_date :: date between 0 and 2
then 'NEVER STARTED'
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date > current_date :: date
then 'OFFBOARDING'
when e.role_state = 'terminated'
then 'TERMINATED'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - e.transition_start_date > 60
then 'ACTIVE'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - e.transition_start_date between 0 and 60
--and e.employment_type like '%salaried%' --not sure about this?
then 'NEW ACTIVE'
when e.transition_start_date > current_date
then 'HIRED'
end as provider_status
from employee_parsed e
left join fq_common_telenutrition.schedule_provider sp
on e.employee_id = sp.employee_id
left join go_live_date gld
on sp.provider_id = gld.provider_id

where e.contract_to_ft = 'Yes - Contract to FT'

union

--FTE
select
e.employee_id
,sp.provider_id
,case 
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date - e.start_date :: date between 0 and 2
then 'NEVER STARTED'
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date > current_date :: date
then 'OFFBOARDING'
when e.role_state = 'terminated'
then 'TERMINATED'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - gld.go_live_date > 60
then 'ACTIVE'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - gld.go_live_date between 0 and 60
then 'NEW ACTIVE'
when e.ft_offer_sign_date is not null
and e.start_date :: date + 3 > current_date :: date
and coalesce(workramp.progress_percentage, 0) between 1 and 99
then 'OFF TRACK ONBOARDING'
when e.ft_offer_sign_date is not null
and e.start_date :: date <= current_date :: date
and coalesce(workramp.progress_percentage, 0) = 0 
then 'DELAYED START'
when e.ft_offer_sign_date is not null
and e.start_date :: date <= current_date :: date
and coalesce(workramp.progress_percentage, 0) > 0 
then 'ONBOARDING'
when e.ft_offer_sign_date is not null
and e.start_date > current_date :: date
then 'HIRED'
when e.ft_offer_sign_date is null
then 'AWAITING SIGNATURE'
end as provider_status
from employee_parsed e
left join fq_common_telenutrition.schedule_provider sp
on e.employee_id = sp.employee_id
left join go_live_date gld
on sp.provider_id = gld.provider_id
left join
(
select
wc.npi
,wc.email
,wcp.path_name
,wcp.progress_percentage
,row_number() over (partition by wc.npi order by wc.created_at desc) as rownum
from fq_common_telenutrition.workramp_contact wc
inner join fq_common_telenutrition.workramp_contact_path wcp
on wc.workramp_contact_id = wcp.workramp_contact_id
and wcp.path_name = 'Full Time RD Onboarding (External Hires)'
) workramp
on (e.npi = workramp.npi OR e.work_email = workramp.email)

where coalesce(e.contract_to_ft, 'abc') != 'Yes - Contract to FT'
and e.employment_type like '%salaried%'

union

--1099
select
e.employee_id
,sp.provider_id
,case 
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date - e.start_date :: date between 0 and 2
then 'NEVER STARTED'
when coalesce(e.termination_date, e.end_date) is not null
and coalesce(e.termination_date, e.end_date) :: date > current_date :: date
then 'OFFBOARDING'
when e.role_state = 'terminated'
then 'TERMINATED'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - gld.go_live_date > 60
then 'ACTIVE'
when coalesce(e.termination_date, e.end_date) is null
and current_date :: date - gld.go_live_date between 0 and 60
then 'NEW ACTIVE'
when e.ind_contractor_sign_date is not null
and e.start_date :: date + 7 > current_date :: date
and coalesce(workramp.progress_percentage, 0) between 1 and 49
then 'OFF TRACK ONBOARDING'
when e.ind_contractor_sign_date is not null
and e.start_date :: date <= current_date :: date
and coalesce(workramp.progress_percentage, 0) = 0 
then 'DELAYED START'
when e.ind_contractor_sign_date is not null
and e.start_date :: date <= current_date :: date
and coalesce(workramp.progress_percentage, 0) > 0 
then 'ONBOARDING'
when e.ind_contractor_sign_date is not null
and e.start_date > current_date :: date
then 'HIRED'
when e.ind_contractor_sign_date is null
then 'AWAITING SIGNATURE'
end as provider_status
from employee_parsed e
left join fq_common_telenutrition.schedule_provider sp
on e.employee_id = sp.employee_id
left join go_live_date gld
on sp.provider_id = gld.provider_id
left join
(
select
wc.npi
,wc.email
,wcp.path_name
,wcp.progress_percentage
,row_number() over (partition by wc.npi order by wc.created_at desc) as rownum
from fq_common_telenutrition.workramp_contact wc
inner join fq_common_telenutrition.workramp_contact_path wcp
on wc.workramp_contact_id = wcp.workramp_contact_id
and wcp.path_name LIKE 'Onboarding Path for Contract RDs%'
) workramp
on (e.npi = workramp.npi OR e.work_email = workramp.email)

where coalesce(e.contract_to_ft, 'abc') != 'Yes - Contract to FT'
and e.employment_type not like '%salaried%'
) sub
)





select
e.employee_id
,sp.provider_id
,e.role_state
,e.employment_type
,e.start_date
,ep.termination_date
,e.end_date
,e.title
,coalesce(ep.last_name, e.last_name, sp.last_name) as last_name
,coalesce(ep.first_name, e.first_name, sp.first_name) as first_name
,e.preferred_first_name
,e.preferred_last_name
,e.personal_email
,coalesce(e.work_email, sp.email) as work_email
,e.custom_fields
,e.rippling_id
,e.rippling_employee_number
,coalesce(ep.npi, sp.npi :: varchar) as npi
,ep.phone_number
,ep.date_of_birth
,ep.cdr_number
,ep.languages_for_care
,ep.pediatrics
,ep.transition_start_date
,ep.contract_to_ft
,ep.ft_offer_sign_date
,ep.ind_contractor_sign_date
,ep.billing_unit_rate
,ep.reported_hours_available
,sp.credentialing_committee_status
,sp.zoom_phone
,sp.zoom_pmi
,sp.professional_titles
,sp.specialties
,sp.specialty_categories
,ps.provider_status


from fq_teleapp_common.employee e
left join fq_common_telenutrition.schedule_provider sp
on e.employee_id = sp.employee_id
left join go_live_date gld
on sp.provider_id = gld.provider_id
left join employee_parsed ep
on e.employee_id = ep.employee_id
left join provider_status ps
on e.employee_id = ps.employee_id

where (upper(e.title) = 'RD MANAGER'
or upper(e.title) like 'REG%')
and e.role_state != 'deleted'
;
	  COMMIT TRANSACTION;   
        `,
      }),   
    }
  }
})
