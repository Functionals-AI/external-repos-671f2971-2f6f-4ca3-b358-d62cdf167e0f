import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '5 15 * * ? *',
    startAt: 'CreateTable',
    states: {
      CreateTable: Redshift.query({
        sql: `
          BEGIN;
          DROP TABLE IF EXISTS analytics.qcs_summary;
          with n AS (SELECT
            lead_id,dial_id,finalized, DATE(call_date) AS call_date, row_number() over (partition by lead_id order by call_date ) as call_number
            FROM public.qcs_dial),
          lc AS (SELECT lead_id, MAX(call_number) AS cn FROM n where finalized =1  GROUP BY 1),
          ld AS (SELECT n.* FROM n JOIN lc on lc.lead_id = n.lead_id WHERE n.call_number = lc.cn)

          SELECT DISTINCT  d.dial_id,d.lead_id,d.total_appointments,d.parent_appointment_date,d.parent_appointment_time,d.call_date::DATETIME AS call_date,d.dial_attempt,d.wrap_time,d.talk_time,d.agent_id,d.list_name,d.disposition_description,da.mperson_id,True AS call_center_set, d.provider, d.finalized, d.finalized_date, d.live_connect, d.call_type, l.dob, l.gender, l.promo, l.use_insurance, l.insurance_carrier, l.employer, l.copay, l.source, n.call_number, COALESCE(s.appointment_id::INTEGER, da.appointment_id::INTEGER) AS appointment_id
          FROM public.qcs_dial AS d
          LEFT JOIN public.qcs_dial_appointment AS da ON da.dial_id = d.dial_id
          LEFT JOIN public.qcs_lead AS l ON l.lead_id = d.lead_id
          LEFT JOIN n ON n.dial_id = d.dial_id
          LEFT JOIN ld ON ld.dial_id = d.dial_id
          LEFT JOIN (SELECT SPLIT_PART(tn_app_federated_id,':',2)::NUMERIC AS qcs_lead_id ,appointment_id::INTEGER
                  FROM  analytics.scheduling_flow_events
                  WHERE tn_app_federated_id LIKE '%cs%') AS s  ON s.qcs_lead_id  = ld.lead_id
          WHERE d.call_date IS NOT NULL
          ;
          COMMIT;
        `,
      }),
    }
  }
})
