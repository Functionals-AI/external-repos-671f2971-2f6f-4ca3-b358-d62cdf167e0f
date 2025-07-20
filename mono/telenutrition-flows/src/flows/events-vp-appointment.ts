/**
 * 
 * Flow to calculate change in appointments and publish events
 * 
 */
import Logger from '@mono/common/lib/logger'
import { workflow, task } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'
import Sync from '@mono/common-flows/lib/tasks/sync'
import { publishEvent } from '@mono/analytics/lib/legacy/events'
import { ErrCode } from '@mono/common/lib/error'
import { err, ok } from 'neverthrow'

const MTAG = Logger.tag()

const SYNC_TOKEN_NAME = 'telenutrition-flows.events-vp-appointment'

export default workflow(function (_config) {
  return {
    cron: '5 15 * * ? *',
    startAt: 'GetToken',
    states: {
      GetToken: Sync.getToken({
        name: SYNC_TOKEN_NAME,
        next: 'CompletedQuery'
      }),
      CompletedQuery: Redshift.query({
        input: function (input) {
          input['next_token'] = Date.now() / 1000 | 0
          return input
        },
        //
        // Identify newly completed appointments. Newly completed appointments are ones
        // whose state transtions to '3 - Checked Out' or '4 - Charge Entered'.
        //
        // Note, the initial criteria for apt. completion was a transition of the claim ID
        // to an integer > 0.
        //
        sql: function (input) {
          const schema = 'diff'
          const previous = `vp_appointment_${input['token']}`
          const next = `vp_appointment_${input['next_token']}`

          return `
--- #1
BEGIN;    

--- #2
CREATE TABLE ${schema}.${next} AS
  SELECT 
    appointment_id,
    status
  FROM fq_common_telenutrition.schedule_appointment
;
          
--- #3
WITH completed_appointments AS (
  SELECT
    P.appointment_id
  FROM ${schema}.${previous} P
  LEFT JOIN ${schema}.${next} N ON P.appointment_id=N.appointment_id
  WHERE
    -- if status transitions from something NOT 'checked out' to 'checked out'
    (
      (
        -- Note, the previous value can be the Athena status string.
        (NVL(NVL2(P.status, SUBSTRING(P.status, 1, 1), NULL) = '3', FALSE) = FALSE) AND 
        (NVL(NVL2(P.status, SUBSTRING(P.status, 1, 1), NULL) = '4', FALSE) = FALSE)
      )
    ) AND 
    (
      (
        (NVL(N.status = '3', FALSE) = TRUE) OR
        (NVL(N.status = '4', FALSE) = TRUE)
      )
    )
)
--- #4
SELECT
  GU.id AS user_id
FROM completed_appointments A
INNER JOIN fq_common_telenutrition.schedule_appointment SA ON A.appointment_id = SA.appointment_id
INNER JOIN fq_common_telenutrition.schedule_patient P ON SA.patient_id = P.patient_id
INNER JOIN fq_common_telenutrition.schedule_user_patient UP ON P.patient_id = UP.patient_id
INNER JOIN fq_common_telenutrition.iam_user SU ON UP.user_id=SU.user_id
INNER JOIN foodapp_stage.go_users_raw GU ON GU.id=SU.fs_user_id
WHERE 
  GU.organization_id=10
;

--- #5
COMMIT;
`
        },
        output: function (output, input) {
          const {results} = output

          //
          // Note, index is 3 as its #4 in the statements above (the select)
          //
          return {
            ids: results[3].rows.map(row => row['user_id']),
            token: input['next_token']
          }
        },
        next: 'PublishEvent',
      }),
      PublishEvent: task({
        handler: async (context, input) => {
          const {ids, token} = input
          const { logger } = context
          const TAG = [...MTAG, 'PublishEvent']
          const EVENT_TYPE = "app_telenutrition_telehealth_visit"

          const events = [...ids as number[]].map(id => {
            return {
              event_type: EVENT_TYPE,
              user_id: id
            }
          })

          if (events.length > 0) {
            //
            // Publish kinesis events
            // Note, the publication should probably occur in batches. There is
            // a 1MB limit on the batch size.
            //
            const result = await publishEvent(context, events)

            if (result.isErr()) {
              logger.error(context, TAG, 'Error publishing event.', { errCode: result.error })
              
              return err(ErrCode.SERVICE)
            }
          }
          else {
            logger.info(context, TAG, 'No events to post.', {
              events,
            })
          }

          return ok({
            token,
          })
        },
        next: 'UpdateToken',
      }),
      UpdateToken: Sync.updateToken({
        name: SYNC_TOKEN_NAME,
        value: function (input) {
          return String(input['token'])
        }
      })
    }
  }
})