import { err, ok } from 'neverthrow'

import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { EventTypes, detailType } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { query } from '@mono/common-flows/lib/tasks/aws/redshift'

const EVENT_BUS = 'default'
const EVENT_TYPE = detailType({
    type: EventTypes.FlowCompleted,
    domain: 'analytics-flows',
    flowName: 'EventSyncRedshift',
})

enum State {
  MappedEvents = 'MappedEvents',
  Success = 'Success'
}

function createMappedEventsInsertQueries(): string[] {
  try {
    const eventlist = [
      'ui_collection',
      'ui_action',
      'ui_view',
      'ui_search',
      'ui_motion',
      'ui_share',
      'ui_view_order_totals',
    ]

    const stmts:string[] = []

    for (const [index, eventtype] of eventlist.entries()) {
      console.debug(`--- ${index} ${eventtype} ---`)
  
      //Ignore action_type filer condition in query_string_list query if event_type='ui_view'
      const action_type_str = (eventtype === 'ui_view') ? '' : `decode(b.action_type,NULL,decode(a.action_type,NULL,'',a.action_type),b.action_type)=decode(a.action_type,null,'',a.action_type) AND `

      console.debug(`--- ${action_type_str}`)

      const stmt = `
SELECT 
  c.user_id, 
  organization_info.organization, 
  c.event_timestamp_pst, 
  c.event_type, 
  nvl2(b.description, b.description, 'other') event, 
  a.event_id,
  b.product, 
  b.product_category, 
  b.feature, 
  b.event_category, 
  b.is_high_impact, 
  b.newfeature_product, 
  b.fs_product_category, 
  b.platform,
  a.action_type,
  a.target_id,
  a.target_type,
  CASE
    WHEN a.screen_name='unknown' AND a.event_type='ui_view' AND a.action_type='view' AND a.target_type='screen'
    THEN decode(c.client_uri,'https://zipongo.com/recipes/home','recipes_home','https://zipongo.com/account/general','settings',
                'https://zipongo.com/dashboard/biometrics','diet',
                'https://zipongo.com/mealkits/landing','marketplace')
    ELSE a.screen_name
  END AS screen_name,
  a.screen_id,
  a.screen_page,
  b.feature_old,
  b.product_old, b.product_category_old, b.fs_product_category_old, b.ext_product, b.ext_fs_product_category
FROM event_user c
INNER JOIN event_ui_action a ON c.event_id = a.event_id AND a.event_type='${eventtype}'
LEFT JOIN mapped_events_key_vw b ON ${action_type_str}decode(b.screen_name,'IGNORE',decode(a.screen_name,NULL,'',a.screen_name),NULL,'',b.screen_name) = decode(a.screen_name,NULL,'',a.screen_name)
  AND decode(b.target_type,'IGNORE',decode(a.target_type,NULL,'',a.target_type),NULL,'',b.target_type) = decode(a.target_type,NULL,'',a.target_type) 
  AND decode(b.screen_page,'IGNORE',decode(a.screen_page,NULL,'',a.screen_page),NULL,'',b.screen_page) = decode(a.screen_page,NULL,'',a.screen_page) 
  AND decode(b.screen_id,'IGNORE',decode(a.screen_id,NULL,'',a.screen_id),NULL,'',b.screen_id) = decode(a.screen_id,NULL,'',a.screen_id) 
  AND decode(b.target_id,'IGNORE',decode(a.target_id,NULL,'',a.target_id),NULL,'',b.target_id) = decode(a.target_id,NULL,'',a.target_id) 
  AND b.event_type='${eventtype}'
INNER join go_users on c.user_id = go_users.id 
INNER join organization_info on go_users.organization_id = organization_info.organization_id 
WHERE c.event_type='${eventtype}' AND 
 c.event_timestamp_utc >= (select min_cutoff from mapped_events_zpipe_tmp) AND 
 c.event_timestamp_utc <= (select max_cutoff from mapped_events_zpipe_tmp) AND 
 c.event_id NOT IN (select event_id from mapped_events where event_type = '${eventtype}')
`
      stmts.push(...[
'BEGIN TRANSACTION;',
`
INSERT INTO mapped_events (
  ${stmt}
);
`,
'END TRANSACTION;'
])
      console.log(`--- select stmt:`)
      console.log(stmt)
    }
    return stmts
  }
  catch (e) {
    console.error(e)
    return []
  }
}

export default workflow(function(config) {
  return {
    event: {
      bus: EVENT_BUS,
      source: [ 'foodsmart' ],
      detailType: [
        EVENT_TYPE
      ]
    },
    startAt: 'MappedEvents',
    states: {
      [State.MappedEvents]: query({
        sql: `
CREATE TABLE IF NOT EXISTS mapped_events (
  user_id varchar(30),
  organization varchar(256),
  event_timestamp_pst timestamp NULL,
  event_type varchar(60),
  event varchar(256),
  event_id varchar(40),
  product varchar(60),
  product_category varchar(60),
  feature varchar(60),
  event_category varchar(60),
  is_high_impact varchar(1),
  newfeature_product varchar(60),
  fs_product_category varchar(60),
  platform varchar(60),
  action_type varchar(64),
  target_id varchar(128),
  target_type varchar(64),
  screen_name varchar(64),
  screen_id varchar(64),
  screen_page varchar(64),
  feature_old varchar(60),
  product_old varchar(60),
  product_category_old varchar(60),
  fs_product_category_old varchar(60),
  ext_product varchar(60),
  ext_fs_product_category varchar(60)
);
DROP TABLE IF EXISTS mapped_events_zpipe_tmp;
CREATE TABLE mapped_events_zpipe_tmp AS SELECT 
  dateadd(months, -2, sysdate) as min_cutoff,
  sysdate as max_cutoff
;
BEGIN TRANSACTION;

INSERT INTO mapped_events(user_id, organization, event_Timestamp_pst, event_type, event_id, event)
SELECT a.user_id, organization_info.organization, a.event_timestamp_pst, a.event_type,  a.event_id, b.description
FROM event_user a
LEFT JOIN mapped_events_key b ON b.event_type=a.event_type
INNER join go_users on a.user_id = go_users.id
INNER join organization_info on go_users.organization_id = organization_info.organization_id
WHERE b.event_type like 'api%' AND
      a.event_timestamp_utc >= (select min_cutoff from mapped_events_zpipe_tmp) AND
      a.event_timestamp_utc <= (select max_cutoff from mapped_events_zpipe_tmp) AND
      a.event_id NOT IN (select event_id from mapped_events where event_type like 'api%')
;

END TRANSACTION;
${createMappedEventsInsertQueries().join('\n')}
`,
        next: State.Success
      }),
      [State.Success]: succeed()
    }
  }
})
