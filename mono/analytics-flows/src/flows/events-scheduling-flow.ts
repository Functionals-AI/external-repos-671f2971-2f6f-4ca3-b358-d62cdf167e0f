import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    rate: '6 hours',
    startAt: 'CreateFlowEvents',
    states: {
      CreateFlowEvents: Redshift.query({
        sql: `
            with
            events AS (
              SELECT
                *,
                SUM(is_new_session) OVER (ORDER BY cid, timestamp ROWS UNBOUNDED PRECEDING) AS monotonic_session_id
              FROM (
                SELECT
                  *,
                  CASE WHEN EXTRACT('EPOCH' FROM timestamp) - EXTRACT('EPOCH' FROM last_event_timestamp) >= (60 * 10) OR last_event_timestamp IS NULL THEN
                    1
                  ELSE
                    0
                  END AS is_new_session
                FROM (
                  SELECT
                    id,
                    meta.cid::varchar as cid,
                    meta.uid::bigint as uid,
                    meta.fid::varchar as fid,
                    meta.location::VARCHAR as location,
                   CASE WHEN meta.params LIKE '%utm_source%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_source=', 2), '&', 1) 
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_source=', 2), '&', 1) END AS source,
                   CASE WHEN meta.params LIKE '%utm_campaign%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_campaign=', 2), '&', 1) 
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_campaign=', 2), '&', 1) END AS campaign,
                   CASE WHEN meta.params LIKE '%utm_id%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_id=', 2), '&', 1) 
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_id=', 2), '&', 1) END AS campaign_id,
                   CASE WHEN meta.params LIKE '%utm_medium%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_medium=', 2), '&', 1)
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_medium=', 2), '&', 1) END AS medium,
                   CASE WHEN meta.params LIKE '%utm_term%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_term=', 2), '&', 1) 
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_term=', 2), '&', 1) END AS term,
                   CASE WHEN meta.params LIKE '%utm_content%' THEN SPLIT_PART(SPLIT_PART(meta.params::varchar, 'utm_content=', 2), '&', 1) 
                      ELSE SPLIT_PART(SPLIT_PART(meta.referrer::varchar, 'utm_content=', 2), '&', 1) END AS content,
                    timestamp 'epoch' + time * interval '1 second' as timestamp,
                    type AS event_type,
                    name AS event_name,
                    meta.platform::varchar AS platform,
                    meta.device::varchar AS device,
                    JSON_SERIALIZE(meta.params) AS params,
                    data.count_on_this_unique_step::INT AS count_on_this_unique_step,
                    data.current_step_index::INT AS current_step_index,
                    data.flow_count::INT AS flow_count,
                    data.appointment_id::varchar AS appointment_id,
                    data.patient_id::varchar AS patient_id,
                    data.member_id::varchar AS member_id,
                    data.employer_id::varchar AS employer_id,
                    data.group_id::varchar AS group_id,
                    data.employer_name::varchar AS employer_name,
                    data.insurance_name::varchar AS insurance_name,
                    data.promo::varchar AS promo,
                    data.duration::varchar AS duration,
                    data.weightloss::varchar AS weightloss,
                    data.timezone::varchar AS timezone,
                    data.state::varchar AS pat_state,
                    data.flow_name::VARCHAR AS flow_name,
                    data.icd_10_codes::VARCHAR AS icd_10_codes,
                    data.referrer_credentials::VARCHAR AS referrer_credentials,
                    data.referrer_email::VARCHAR AS referrer_email,
                    data.referrer_first_name::VARCHAR AS referrer_first_name,
                    data.referrer_last_name::VARCHAR AS referrer_last_name,
                    data.referrer_org_id::INT AS referrer_org_id,
                    data.referrer_id::VARCHAR AS referrer_id,                   
                    LAG(timestamp 'epoch' + time * interval '1 second', 1) OVER (PARTITION BY cid ORDER BY timestamp) AS last_event_timestamp
                  FROM analytics.events
                )
              )
            ),
            events_partitioned as (
              SELECT
                *,
                ROW_NUMBER() OVER (PARTITION BY monotonic_session_id ORDER BY timestamp) AS rn
              FROM events
            ),
            sessions AS (
              SELECT
                md5(substring(listagg(DISTINCT id, ',') within group (order by timestamp), 0, 36)) as stable_session_id,
                min(cid) as cid,
                min(uid) as uid,
                min(fid) as fid,
                any_value(campaign_id) as campaign_id,		
                any_value(source) as source,
                any_value(campaign) as campaign,
                any_value(medium) as medium,
                any_value(term) as term,
                any_value(content) as content,
                monotonic_session_id
              FROM events_partitioned
              WHERE rn < 1200
              GROUP BY monotonic_session_id
            ),
            flows AS (
              SELECT
                CONCAT(s.stable_session_id,e.flow_count) as flow_id,
                any_value(referrer_credentials) as referrer_credentials,    
                any_value(flow_name) as flow_name,
                any_value(icd_10_codes) as icd_10_codes,
                any_value(referrer_email) as referrer_email,
                any_value(referrer_first_name) as referrer_first_name,
                any_value(referrer_last_name) as referrer_last_name,
                any_value(referrer_org_id) as referrer_org_id,
                any_value(referrer_id) as referrer_id,
                any_value(pat_state) as pat_state
              FROM events e 
              LEFT JOIN sessions s ON s.monotonic_session_id = e.monotonic_session_id 
              GROUP BY flow_id
            )
            SELECT
              E.id, 
              S.stable_session_id as session_id, 
              CONCAT(S.stable_session_id,E.flow_count) AS flow_id,
              S.cid, 
              S.uid AS tn_app_user_id, 
              S.fid AS tn_app_federated_id, 
              S.campaign_id, 
              S.source, 
              S.campaign, 
              S.medium, 
              S.term, 
              S.content,
              E.timestamp,
              E.platform,
              E.device,
              E.event_type,
              E.event_name,
              E.params,
              E.appointment_id,
              E.patient_id,
              E.member_id,
              E.employer_id,
              E.group_id,
              E.employer_name,
              E.insurance_name,
              E.promo,
              E.duration,
              E.weightloss,
              E.timezone,
              F.pat_state,
              E.count_on_this_unique_step,
              E.current_step_index,
              F.flow_name,
              F.icd_10_codes,
              F.referrer_credentials,
              F.referrer_email,
              F.referrer_first_name,
              F.referrer_last_name,
              F.referrer_org_id,
              F.referrer_id
            INTO 
            analytics.scheduling_flow_events_tmp
            FROM events E
            left join sessions S ON E.monotonic_session_id=S.monotonic_session_id
            LEFT JOIN flows F ON F.flow_id = CONCAT(S.stable_session_id,E.flow_count);
          DROP TABLE IF EXISTS analytics.scheduling_flow_events;
          ALTER TABLE analytics.scheduling_flow_events_tmp RENAME TO scheduling_flow_events;
        `,
      }),
    }
  }
})
