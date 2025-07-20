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
          DROP TABLE IF EXISTS telenutrition.provider_availability;
          WITH a AS (
          SELECT
                *,
                SUM(is_new_session) OVER (ORDER BY template_provider_id, appt_timestamp ROWS UNBOUNDED PRECEDING) AS block_id
              FROM (
                SELECT
                  *,
                  CASE WHEN EXTRACT('EPOCH' FROM appt_timestamp) - EXTRACT('EPOCH' FROM last_appt_timestamp) >= (60 * 31) OR last_appt_timestamp IS NULL THEN
                    1
                  ELSE
                    0
                  END AS is_new_session
                FROM( 
                SELECT 
                appointment_id,
                template_provider_id,
                CAST(CONCAT(SUBSTRING(to_char(appointment_date, 'YYYY-MM-DD HH:MM:SS'),1,11), appointment_start_time) AS TIMESTAMP) AS appt_timestamp,
                LAG( appt_timestamp ) OVER (PARTITION BY template_provider_id ORDER BY appt_timestamp) AS last_appt_timestamp
                FROM  athena.scheduling_slot_future
                WHERE _EXTRACT_DATE_ = (
                              SELECT
                                MAX(_extract_date_)
                              FROM
                                athena_stage.scheduling_slot_future_raw)
                      AND open_indicator =1
                      AND frozen_slot_indicator = 0
                      )
                 )     
          ),
          b AS (
          SELECT *, md5(CONCAT(CONCAT(block_id,template_provider_id), DATE_TRUNC('day',appt_timestamp))) AS u_block_id FROM a ),

          g AS (select u_block_id,count(*) AS slots FROM b GROUP BY 1),
          i AS (
          SELECT b.appointment_id, b.template_provider_id, b.appt_timestamp, b.u_block_id, FLOOR(g.slots/2.0) AS initial_slots
          FROM b
          LEFT JOIN g ON g.u_block_id = b.u_block_id
          WHERE is_new_session = 1 AND slots >1 )

 SELECT DISTINCT
            s.appointment_id,
            s.appointment_date,
            s.appointment_start_time,
            s.slot_status_type,
            s.template_provider_name,
            s.template_provider_id,
            s.department_name AS primary_department,
            s.appointment_status_type,
            s.frozen_slot_indicator,
            s.frozen_reason,
            p.department_id,
            p.department_name,
            i.initial_slots
          INTO telenutrition.provider_availability
          FROM
            athena.scheduling_slot_future AS s
            JOIN (
              SELECT
                pro.provider_id,
                dep.department_id,
                dep.department_name
              FROM
                fq_common_telenutrition.schedule_department_provider AS pro
                JOIN ( SELECT DISTINCT
                    department_id,
                    department_name
                  FROM
                    athena.scheduling_slot_future
                  WHERE
                    department_name LIKE '%FOODSMART%') AS dep ON dep.department_id = pro.department_id) p ON s.template_provider_id = p.provider_id
          LEFT JOIN i on s.appointment_id = i.appointment_id
          WHERE
            _extract_date_ = (
              SELECT
                MAX(_extract_date_)
              FROM
                athena.scheduling_slot_future)
              AND frozen_slot_indicator = 0
              AND appointment_date BETWEEN trunc(getdate ())
              AND DATEADD (day, 120, trunc(getdate ()));
          COMMIT;
        `,
      }),
    }
  }
})
