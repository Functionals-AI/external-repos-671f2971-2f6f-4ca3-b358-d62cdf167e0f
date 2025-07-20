import { ok, err, Result } from 'neverthrow'
import { JsonObject, task, workflow } from '@mono/common-flows/lib/builder'
import { Logger } from '@mono/common'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'
import Store from '@mono/common-flows/lib/tasks/aws/store'
import * as zs from "zapatos/schema";
import { ErrCode } from '@mono/common/lib/error'
import { phone } from 'phone';

const MTAG = Logger.tag()
const REDSHIFT_QUERY = `
with initials as
--CTE to get patients with completed initial appts
(
select 
distinct a.patient_id, a.start_timestamp :: date as initial_appt_date
from analytics.dim_appointment a
where a.is_completed_initial_appt is true
)
,member_stats as
--count completed/scheduled FUPs, no shows and get last appt date
(
select
a.patient_id
,sum(case when a.status_normalized = 'completed' then 1 else 0 end) as fups_completed
,sum(case when a.status_normalized = 'booked' and a.start_timestamp > current_date :: date then 1 else 0 end) as fups_scheduled
,sum(case when a.status_normalized = 'cancelled' and a.participation = 'patient_no_show' then 1 else 0 end) as total_no_shows
,max(case when a.status_normalized = 'completed' then a.start_timestamp :: date else i.initial_appt_date end) as last_appt_date
from initials i
inner join analytics.dim_appointment a
on i.patient_id = a.patient_id
and a.is_completed_initial_appt is false
--and a.status_normalized in('completed','booked')
group by a.patient_id
)
,last_appt_details as
--use last appt to get most recent provider, insurance label, spcl program, member_id and group_id
(
select 
*
from 
(
select
a.patient_id
,upper(p.first_name) || ' ' || upper(p.last_name) as provider_name
,i.label as superpackage
,e.special_program
,ppm.member_id
,ppm.group_id
,row_number() over (partition by a.patient_id order by a.start_timestamp desc) as rownum
from analytics.dim_appointment a
inner join member_stats ms
on a.patient_id = ms.patient_id
and a.start_timestamp :: date = ms.last_appt_date
left join fq_common_telenutrition.schedule_provider p
on a.provider_id = p.provider_id
left join fq_common_telenutrition.schedule_insurance i
on a.insurance_id = i.insurance_id
left join fq_common_telenutrition.schedule_employer e
on a.employer_id = e.employer_id
left join fq_common_telenutrition.schedule_patient_payment_method ppm
on a.payment_method_id = ppm.payment_method_id

where a.status_normalized = 'completed'
) sub
where sub.rownum = 1
)


select
ii.identity_id,
ii.account_id,
ii.eligible_id,
lad.group_id,
lad.member_id,
pat.patient_id,
iu.user_id,
ii.birthday :: date :: text as dob,
ii.first_name,
ii.last_name,
pat.address,
pat.address2,
pat.city,
pat."state",
pat.zip_code AS postal_code,
ARRAY (pat.phone, iu.phone) AS phone,
pat.email,
CASE
WHEN pat."language" = 'English' 
THEN 'en'
WHEN pat."language" = 'Spanish' 
THEN 'es'
ELSE NULL END AS lang,
pat.sex AS gender,
NULL AS guardian_name,
lad.provider_name AS provider,
lad.superpackage,
lad.special_program,
null as program,
ms.last_appt_date :: text AS last_appointment_date,
ms.fups_completed AS followups_completed,
ms.fups_scheduled AS followups_scheduled,
'initial_w/o_2_followups_scheduled_' || TO_CHAR(CURRENT_DATE, 'MM/DD/YY') AS calling_list_id,
last_dialed.last_dialed_at,
'available' AS status

from member_stats ms
inner join fq_common_telenutrition.schedule_patient pat
on ms.patient_id = pat.patient_id
inner join fq_common_telenutrition.iam_identity ii
on pat.identity_id = ii.identity_id
inner join fq_foodapp_tenants.go_users_eligible gue
on ii.eligible_id = gue.id
left join fq_common_telenutrition.iam_user iu
on ii.identity_id = iu.identity_id
left join last_appt_details lad
on ms.patient_id = lad.patient_id
left join --subquery to get last dialed date
(
select
l.identity_id
,max(d.dialed_at :: date) as last_dialed_at
from fq_common_callcenter.dial d
inner join fq_common_callcenter.lead l
on d.lead_id = l.lead_id
group by l.identity_id
) last_dialed
on ii.identity_id = last_dialed.identity_id
left join fq_common_callcenter.do_not_call dnc --do not call list
on coalesce(pat.phone, iu.phone, concat('+1', regexp_replace(gue.mobile_phone, '[^0-9]'))) = dnc.phone

where (ms.fups_completed + ms.fups_scheduled) between 1 and 11
and ms.fups_scheduled <= 2
and (ms.fups_completed + 1) < 8 --total appts < 8; adding 1 bc fups completed doesnt include the initial appt
and ms.total_no_shows < 3
and ms.last_appt_date between ((current_date :: date) - 30) and current_date :: date
and ii.first_name is not null
and ii.last_name is not null
and coalesce(pat.phone, iu.phone) is not null
and 
(
gue.organization_id in(197, 174,175,184,200,8,177,204,206)
or (gue.organization_id = 85 and gue.suborganization_id = 'biomerieux')
or 
(
gue.organization_id = 191 -- CareOregon
and 
(
json_extract_path_text(gue.raw_data, 'Diabetes') = '1' 
OR json_extract_path_text(gue.raw_data, 'CHF') = '1' 
OR json_extract_path_text(gue.raw_data, 'IschHD') = '1' 
OR json_extract_path_text(gue.raw_data, 'Acute_MI') = '1' 
OR json_extract_path_text(gue.raw_data, 'Hypertension') = '1' 
OR json_extract_path_text(gue.raw_data, 'Hyperlipidemia_OR_Dyslipidemia') = '1' 
OR json_extract_path_text(gue.raw_data, 'Chronic_Liver') = '1' 
OR json_extract_path_text(gue.raw_data, 'Cerebrovascular_disease') = '1' 
OR json_extract_path_text(gue.raw_data, 'Cancer') = '1' 
OR json_extract_path_text(gue.raw_data, 'Obesity') = '1' 
OR json_extract_path_text(gue.raw_data, 'Renal_Disease') = '1' 
OR json_extract_path_text(gue.raw_data, 'Prediabetes') = '1' 
OR json_extract_path_text(gue.raw_data, 'Degenerative_joint_disease') = '1' 
OR json_extract_path_text(gue.raw_data, 'Failure_to_thrive') = '1' 
OR json_extract_path_text(gue.raw_data, 'Nutritional_deficiencies') = '1' 
OR json_extract_path_text(gue.raw_data, 'Pregnancy') = '1'
)
) 
)
and --last dialed at least one week ago
(
last_dialed.last_dialed_at <= ((current_date :: date) - 7) 
or last_dialed.last_dialed_at is null
)
and dnc.phone is null --not on DNC list
;


  `
const MOCK_REDSHIFT_QUERY = `
  SELECT DISTINCT 
    NULL AS identity_id,
    NULL AS account_id,
    NULL AS eligible_id,
    NULL AS group_id,
    left(md5(i::text), 32) AS member_id,
    NULL AS user_id,
    NULL AS patient_id,
    '2000-01-01'::date::text AS dob,
    'John' AS first_name, 
    'Doe' AS last_name, 
    '123 Fake Street' AS address,
    NULL AS address2, 
    'San Francisco' AS city,
    'CA' AS state,
    '94133' AS postal_code,
    ARRAY('813-123-4567','(813) 123-4567') AS phone,
    'fake_email@gmail.com' AS email,
    'en' AS lang,
    'M' as gender,
    NULL AS guardian_name,
    'test_provider' AS provider,
    'test_superpackagename' AS superpackage, 
    'test_special_program' AS special_program,
    'test_program' AS program,
    '2000-01-01'::date::text AS last_appointment_date,
    0 AS followups_completed, 
    0 AS followups_scheduled,
    'initial_w/o_4_followups_scheduled_wk_' || TO_CHAR(current_date - interval '7 day', 'MMDD') || '-' || TO_CHAR(current_date - interval '1 day', 'MMDD') as calling_list_id,
    NULL AS last_dialed_at,
    'available' AS status
  FROM generate_series(1, 10) s(i);
`

enum State {
  Extract = 'Extract',
  Transform = 'Transform',
  Load = 'Load',
}

interface TransformInput extends JsonObject {
  results: {
    rows: {
      identity_id: number,
      account_id: number,
      eligible_id: number,
      group_id: string,
      member_id: string,
      patient_id: number,
      user_id: number,
      dob: string,
      first_name: string,
      last_name: string,
      address: string,
      address2: string,
      city: string,
      state: string,
      postal_code: string,
      phone: string,
      email: string,
      lang: string,
      gender: string,
      guardian_name: string,
      provider: string,
      superpackage: string,
      special_program: string,
      program: string,
      last_appointment_date: string,
      followups_completed: number,
      followups_scheduled: number,
      calling_list_id: string,
      last_dialed_at: string,
      status: string,
    }[];
  }[];
};

interface LoadInput extends JsonObject {
  callingLists: string[],
  leads: {
    identity_id: number,
    account_id: number,
    eligible_id: number,
    group_id: string,
    member_id: string,
    patient_id: number,
    user_id: number,
    dob: string,
    first_name: string,
    last_name: string,
    address: string,
    address2: string,
    city: string,
    state: string,
    postal_code: string,
    phone: string[],
    email: string,
    lang: string,
    gender: string,
    guardian_name: string,
    provider: string,
    superpackage: string,
    special_program: string,
    program: string,
    last_appointment_date: string,
    followups_completed: number,
    followups_scheduled: number,
    calling_list_id: string,
    last_dialed_at: string,
    status: string,
  }[],
};

export default workflow(function (config) {
  return {
    cron: '0 16 ? * MON *', // Every monday at noon ET (9AM PT)
    startAt: State.Extract,
    states: {
      [State.Extract]: Redshift.query({
        sql: config.isProduction ? REDSHIFT_QUERY : MOCK_REDSHIFT_QUERY,
        next: State.Transform,
      }),
      [State.Transform]: task({
        handler: async (context, input: TransformInput): Promise<Result<LoadInput, ErrCode>> => {
          const tag = [...MTAG, State.Transform]
          const { logger } = context

          if (input.results.length !== 1 || !input.results[0].rows) {
            logger.error(context, tag, `unable to get the rows from the input`, { input });
            return err(ErrCode.SERVICE);
          }

          const rows = input.results[0].rows;

          const callingLists = [...new Set(rows.map(row => row.calling_list_id))];

          const leads = rows.map(row => {
            const phoneNumbers = (JSON.parse(row.phone) as string[])
              .filter(val => val !== null && phone(val, { country: 'USA', validateMobilePrefix: false }).isValid)
              .map(val => String(phone(val, { country: 'USA', validateMobilePrefix: false }).phoneNumber))

            return {
              ...row,
              phone: phoneNumbers,
            }
          })

          return ok({ callingLists, leads });
        },
        next: State.Load,
      }),
      [State.Load]: Store.load({
        tables: [
          {
            name: 'callcenter.calling_list',
            rows: (input: LoadInput) => input.callingLists.map((id): zs.callcenter.calling_list.Insertable => ({
              calling_list_id: id,
            }))
          },
          {
            name: 'callcenter.lead',
            rows: (input: LoadInput) => input.leads.map((row): zs.callcenter.lead.Insertable => ({
              identity_id: row.identity_id,
              account_id: row.account_id,
              eligible_id: row.eligible_id,
              group_id: row.group_id,
              member_id: row.member_id,
              patient_id: row.patient_id,
              user_id: row.user_id,
              dob: row.dob,
              first_name: row.first_name,
              last_name: row.last_name,
              address: row.address,
              address2: row.address2,
              city: row.city,
              state: row.state,
              postal_code: row.postal_code,
              phone: row.phone,
              email: row.email,
              lang: row.lang,
              gender: row.gender,
              guardian_name: row.guardian_name,
              provider: row.provider,
              superpackage: row.superpackage,
              special_program: row.special_program,
              program: row.program,
              last_appointment_date: row.last_appointment_date,
              followups_completed: row.followups_completed,
              followups_scheduled: row.followups_scheduled,
              calling_list_id: row.calling_list_id,
              last_dialed_at: new Date(row.last_dialed_at),
              status: row.status,
            }))
          }
        ]
      })
    }
  }
});
